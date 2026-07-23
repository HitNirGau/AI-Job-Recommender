import nodemailer from 'nodemailer';

/**
 * Sends a high-priority verification OTP email to a user using Nodemailer.
 * Falls back safely to terminal console printing if credentials are not configured yet.
 */
export async function sendOtpEmail(toEmail, otpCode, purpose = 'Verification') {
  const service = process.env.EMAIL_SERVICE || 'gmail';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log(`[Email Service Log] Generated Verification OTP: [ ${otpCode} ] for: ${toEmail} (Purpose: ${purpose})`);

  if (!user || !pass || user.includes('placeholder') || pass.includes('placeholder')) {
    console.warn(`
======================================================================
⚠️  Nodemailer SMTP Credentials NOT fully configured in server/.env.
📧  To enable live email delivery, please set:
    EMAIL_SERVICE=gmail
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_gmail_app_password
👉  TESTING OTP: [ ${otpCode} ]
======================================================================
    `);
    return { success: true, loggedToConsole: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service,
      auth: {
        user,
        pass
      }
    });

    const mailOptions = {
      from: `"AI Career Hub" <${user}>`,
      to: toEmail,
      subject: `[AI Career Hub] Your Verification OTP Code: ${otpCode}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Verification Required</h2>
          <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">Use the following security code to complete your ${purpose.toLowerCase()}. This code is valid for 10 minutes.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otpCode}</span>
          </div>
          <p style="color: #94a3b8; font-size: 11px;">If you did not initiate this request, you can safely ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service Success] Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email via SMTP:`, error.message);
    // Return success to allow testing fallback in dev mode even on SMTP failure
    return { success: false, error: error.message };
  }
}
