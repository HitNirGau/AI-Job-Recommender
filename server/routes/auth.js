import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

import Otp from '../models/Otp.js';
import { sendOtpEmail } from '../services/emailService.js';

// @route    POST api/auth/send-register-otp
// @desc     Validate fields and send verification OTP for registration
// @access   Public
router.post(
  '/send-register-otp',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email containing @').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('college', 'College is required').not().isEmpty(),
    check('branch', 'Branch is required').not().isEmpty(),
    check('gradYear', 'Graduation year is required').isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, college, branch, gradYear, phone } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Clean up previous registration OTPs for this email address
      await Otp.deleteMany({ email, type: 'register' });

      // Save temporary registration data to Otp
      const otpRecord = new Otp({
        email,
        otp: otpCode,
        type: 'register',
        tempData: JSON.stringify({ name, email, password, college, branch, gradYear, phone })
      });
      await otpRecord.save();

      // Send verification email
      const emailResult = await sendOtpEmail(email, otpCode, 'User Registration');

      res.json({
        msg: 'Verification OTP sent successfully to your email. Please verify to complete registration.',
        loggedToConsole: !!emailResult.loggedToConsole
      });
    } catch (err) {
      console.error('[Server Console Only] Send register OTP error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/verify-register-otp
// @desc     Verify registration OTP and create user
// @access   Public
router.post(
  '/verify-register-otp',
  [
    check('email', 'Email is required').isEmail(),
    check('otp', '6-digit OTP is required').isLength({ min: 6, max: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    try {
      const otpRecord = await Otp.findOne({ email, otp, type: 'register' });
      if (!otpRecord) {
        return res.status(400).json({ errors: [{ msg: 'Invalid or expired OTP code' }] });
      }

      const { name, password, college, branch, gradYear, phone } = JSON.parse(otpRecord.tempData);

      // Check if user registered in the meantime
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email,
        password,
        college,
        branch,
        gradYear,
        phone,
        skills: [],
        education: [
          {
            school: college,
            degree: `Bachelor of Engineering / Technology (${branch})`,
            startYear: gradYear - 4,
            endYear: gradYear,
            gpa: ''
          }
        ],
        certifications: [],
        projects: [],
        socialLinks: {
          github: '',
          linkedin: '',
          portfolio: '',
          leetcode: '',
          codeforces: '',
          hackerrank: ''
        }
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();
      await Otp.deleteOne({ _id: otpRecord._id });

      const payload = {
        user: {
          id: user.id
        }
      };

      const secret = process.env.JWT_SECRET || 'jwt_secret_token_12345';
      jwt.sign(
        payload,
        secret,
        { expiresIn: '30d' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        }
      );
    } catch (err) {
      console.error('[Server Console Only] Verify registration OTP error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/forgot-password
// @desc     Send password reset OTP
// @access   Public
router.post(
  '/forgot-password',
  [
    check('email', 'Please enter a valid email address').isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'No account found with this email address' }] });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      await Otp.deleteMany({ email, type: 'forgot' });

      const otpRecord = new Otp({
        email,
        otp: otpCode,
        type: 'forgot'
      });
      await otpRecord.save();

      const emailResult = await sendOtpEmail(email, otpCode, 'Password Reset');

      res.json({
        msg: 'Password reset OTP sent to your email successfully.',
        loggedToConsole: !!emailResult.loggedToConsole
      });
    } catch (err) {
      console.error('[Server Console Only] Forgot password OTP error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/verify-reset-otp
// @desc     Verify forgot password OTP
// @access   Public
router.post(
  '/verify-reset-otp',
  [
    check('email', 'Email is required').isEmail(),
    check('otp', '6-digit OTP is required').isLength({ min: 6, max: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    try {
      const otpRecord = await Otp.findOne({ email, otp, type: 'forgot' });
      if (!otpRecord) {
        return res.status(400).json({ errors: [{ msg: 'Invalid or expired OTP code' }] });
      }

      res.json({ msg: 'OTP verified successfully.' });
    } catch (err) {
      console.error('[Server Console Only] Verify reset OTP error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/reset-password
// @desc     Reset password using OTP code
// @access   Public
router.post(
  '/reset-password',
  [
    check('email', 'Email is required').isEmail(),
    check('otp', 'OTP is required').isLength({ min: 6, max: 6 }),
    check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('confirmPassword', 'Confirm password is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ errors: [{ msg: 'Passwords do not match' }] });
    }

    try {
      const otpRecord = await Otp.findOne({ email, otp, type: 'forgot' });
      if (!otpRecord) {
        return res.status(400).json({ errors: [{ msg: 'Verification failed. Please request a new OTP.' }] });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'User account not found' }] });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      await Otp.deleteOne({ _id: otpRecord._id });

      res.json({ msg: 'Password reset completed successfully. You can now log in with your new password.' });
    } catch (err) {
      console.error('[Server Console Only] Reset password error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/login
// @desc     Authenticate user & get token
// @access   Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      const secret = process.env.JWT_SECRET || 'jwt_secret_token_12345';
      jwt.sign(
        payload,
        secret,
        { expiresIn: '30d' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    GET api/auth/me
// @desc     Get current user profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/auth/me
// @desc     Update user profile details (entire profile edit except email/password)
// @access   Private
router.put('/me', auth, async (req, res) => {
  const { name, college, branch, gradYear, phone, skills, education, certifications, projects, socialLinks, profilePicture } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update profile fields
    if (name !== undefined) user.name = name;
    if (college !== undefined) user.college = college;
    if (branch !== undefined) user.branch = branch;
    if (gradYear !== undefined) user.gradYear = Number(gradYear);
    if (phone !== undefined) user.phone = phone;
    if (skills !== undefined) user.skills = skills;
    if (education !== undefined) user.education = education;
    if (certifications !== undefined) user.certifications = certifications;
    if (projects !== undefined) user.projects = projects;
    if (socialLinks !== undefined) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();
    
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error('[Server Console Only] Profile update error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/request-email-update
// @desc     Request email update & send OTP to the NEW email
// @access   Private
router.post(
  '/request-email-update',
  [
    auth,
    check('newEmail', 'Please enter a valid email address containing @').isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newEmail } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check if new email is already taken
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'Email is already in use by another account' }] });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      await Otp.deleteMany({ email: user.email, type: 'update_email' });

      // Save OTP record mapping current user's email with the target newEmail
      const otpRecord = new Otp({
        email: user.email,
        otp: otpCode,
        type: 'update_email',
        tempData: newEmail
      });
      await otpRecord.save();

      const emailResult = await sendOtpEmail(newEmail, otpCode, 'Email Address Update');

      res.json({
        msg: 'Verification OTP sent to new email address successfully.',
        loggedToConsole: !!emailResult.loggedToConsole
      });
    } catch (err) {
      console.error('[Server Console Only] Request email OTP error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/verify-email-update
// @desc     Verify OTP and apply email address update
// @access   Private
router.post(
  '/verify-email-update',
  [
    auth,
    check('otp', '6-digit OTP is required').isLength({ min: 6, max: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { otp } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const otpRecord = await Otp.findOne({ email: user.email, otp, type: 'update_email' });
      if (!otpRecord) {
        return res.status(400).json({ errors: [{ msg: 'Invalid or expired OTP code' }] });
      }

      const newEmail = otpRecord.tempData;

      // Final validation to ensure email was not taken in the meantime
      const emailTaken = await User.findOne({ email: newEmail });
      if (emailTaken) {
        return res.status(400).json({ errors: [{ msg: 'Email is already in use by another account' }] });
      }

      user.email = newEmail;
      await user.save();

      await Otp.deleteOne({ _id: otpRecord._id });

      res.json({
        msg: 'Email address updated successfully.',
        email: newEmail
      });
    } catch (err) {
      console.error('[Server Console Only] Verify email update error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/update-password
// @desc     Directly update user password from Settings (no OTP needed, just matches new and confirm)
// @access   Private
router.post(
  '/update-password',
  [
    auth,
    check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('confirmPassword', 'Confirm password is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ errors: [{ msg: 'Passwords do not match' }] });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ msg: 'Password updated successfully.' });
    } catch (err) {
      console.error('[Server Console Only] Update password error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

export default router;
