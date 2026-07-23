import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';

dotenv.config();

const jobs = [
  {
    title: "Frontend Developer (React)",
    company: "Vercel",
    logo: "▲",
    salary: "$90,000 - $110,000",
    location: "San Francisco, CA",
    experience: "1-3 years",
    type: "Remote",
    description: "We are seeking a Frontend Developer to build engaging user experiences using React.js and Tailwind CSS. You will coordinate with product teams, build re-usable components, and optimize application core web vitals.",
    requiredSkills: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind"],
    applyLink: "https://vercel.com/careers"
  },
  {
    title: "Backend Engineer (Node.js)",
    company: "Stripe",
    logo: "💳",
    salary: "$110,000 - $130,000",
    location: "New York, NY",
    experience: "2-5 years",
    type: "Hybrid",
    description: "Join our core team building high-performance APIs. You will implement microservices, coordinate database operations in PostgreSQL and MongoDB, and manage API security using JWT and Helmet.",
    requiredSkills: ["Node.js", "Express", "JavaScript", "MongoDB", "PostgreSQL", "REST API"],
    applyLink: "https://stripe.com/jobs"
  },
  {
    title: "Full Stack Developer",
    company: "Supabase",
    logo: "⚡",
    salary: "$100,000 - $125,000",
    location: "Austin, TX",
    experience: "2-4 years",
    type: "Onsite",
    description: "Looking for a Full Stack generalist comfortable with modern JS frameworks. You will work on a SaaS product using React on the frontend and Node/Express on the backend, deploying to AWS.",
    requiredSkills: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "AWS", "Git"],
    applyLink: "https://supabase.com/careers"
  },
  {
    title: "AI/ML Engineer",
    company: "Google",
    logo: "🧠",
    salary: "$140,000 - $175,000",
    location: "San Francisco, CA",
    experience: "3+ years",
    type: "Remote",
    description: "Help build and fine-tune next-generation ML models. You will clean datasets, train neural networks using PyTorch, deploy model endpoints using FastAPI and Docker, and integrate LLM wrappers.",
    requiredSkills: ["Python", "FastAPI", "PyTorch", "TensorFlow", "Docker", "Machine Learning", "NLP", "LLM"],
    applyLink: "https://careers.google.com"
  },
  {
    title: "DevOps Specialist",
    company: "GitHub",
    logo: "🐙",
    salary: "$120,000 - $145,000",
    location: "Seattle, WA",
    experience: "3-5 years",
    type: "Remote",
    description: "Manage our cloud scaling operations. You will build and scale CI/CD pipelines, package environments in Docker, automate container clustering with Kubernetes, and orchestrate resources via Terraform.",
    requiredSkills: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Git", "Linux"],
    applyLink: "https://github.com/about/careers"
  },
  {
    title: "Mobile App Developer (Flutter)",
    company: "Discord",
    logo: "🎮",
    salary: "$85,000 - $105,005",
    location: "Denver, CO",
    experience: "1-3 years",
    type: "Hybrid",
    description: "Build beautiful cross-platform applications for iOS and Android. You will manage local states, integrate REST APIs, publish to Play Store/App Store, and ensure 60fps scrolling performance.",
    requiredSkills: ["Flutter", "Kotlin", "Swift", "REST API", "Git"],
    applyLink: "https://discord.com/careers"
  },
  {
    title: "Data Scientist",
    company: "Netflix",
    logo: "🍿",
    salary: "$115,000 - $140,000",
    location: "Boston, MA",
    experience: "2-5 years",
    type: "Remote",
    description: "Help business leads make decisions using structured analytics. You will write SQL queries, build predictive models in Python, write analysis pipelines using Pandas, and build interactive dashboards in Power BI.",
    requiredSkills: ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Tableau", "Power BI"],
    applyLink: "https://jobs.netflix.com"
  },
  {
    title: "Junior Backend Developer",
    company: "Clerk",
    logo: "🔑",
    salary: "$65,000 - $80,000",
    location: "Chicago, IL",
    experience: "0-2 years",
    type: "Onsite",
    description: "Looking for an enthusiastic entry-level developer to join our growing backend team. You will write REST APIs, learn cloud operations, and write unit tests for Node/Express modules.",
    requiredSkills: ["Node.js", "Express", "MongoDB", "JavaScript", "SQL", "Git"],
    applyLink: "https://clerk.com/careers"
  },
  {
    title: "React Native Developer",
    company: "Vercel",
    logo: "▲",
    salary: "$95,000 - $115,000",
    location: "San Jose, CA",
    experience: "2-4 years",
    type: "Remote",
    description: "Develop, design, and optimize React Native applications. Coordinate with core API teams, optimize native bridges, and write push notification endpoints.",
    requiredSkills: ["React Native", "JavaScript", "TypeScript", "Redux", "REST API", "Git"],
    applyLink: "https://vercel.com/careers"
  },
  {
    title: "Python Web Developer",
    company: "OpenAI",
    logo: "🤖",
    salary: "$90,000 - $115,000",
    location: "Portland, OR",
    experience: "2+ years",
    type: "Remote",
    description: "We are seeking a Python backend specialist to build web portals using Django and Flask. You will write ORM database scripts, optimize query caching using Redis, and build custom webhooks.",
    requiredSkills: ["Python", "Django", "Flask", "PostgreSQL", "Redis", "REST API"],
    applyLink: "https://openai.com/careers"
  },
  {
    title: "Cloud Infrastructure Engineer",
    company: "AWS",
    logo: "☁️",
    salary: "$130,000 - $155,000",
    location: "Atlanta, GA",
    experience: "3+ years",
    type: "Hybrid",
    description: "Build robust infrastructure on AWS and Google Cloud. Set up VPC subnets, configure IAM access roles, automate deployment scripts, and manage server backup processes.",
    requiredSkills: ["AWS", "GCP", "Docker", "Linux", "Terraform", "Git"],
    applyLink: "https://aws.amazon.com/careers"
  },
  {
    title: "Database Architect",
    company: "Supabase",
    logo: "⚡",
    salary: "$125,000 - $150,000",
    location: "Dallas, TX",
    experience: "5+ years",
    type: "Onsite",
    description: "Design relational schema layouts and schema structures. Optimize indexing, write robust PostgreSQL triggers and functions, and administer Redis caches.",
    requiredSkills: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "System Design"],
    applyLink: "https://supabase.com/careers"
  },
  {
    title: "DevOps Engineer (Junior)",
    company: "GitHub",
    logo: "🐙",
    salary: "$75,000 - $90,000",
    location: "Austin, TX",
    experience: "0-2 years",
    type: "Hybrid",
    description: "Learn and grow in a fast-paced environment. Help scale build scripts, write simple Dockerfiles, manage GitHub pull requests, and maintain testing environments.",
    requiredSkills: ["Docker", "Git", "Linux", "Bash", "CI/CD"],
    applyLink: "https://github.com/about/careers"
  },
  {
    title: "React Frontend Engineer",
    company: "Stripe",
    logo: "💳",
    salary: "$105,000 - $125,000",
    location: "New York, NY",
    experience: "2-4 years",
    type: "Remote",
    description: "Create front-facing banking platforms using React. Integrate state systems with Redux, build reusable CSS components, and execute accessibility audits.",
    requiredSkills: ["React", "JavaScript", "TypeScript", "Redux", "HTML", "CSS", "Tailwind"],
    applyLink: "https://stripe.com/jobs"
  },
  {
    title: "Data Analyst",
    company: "Netflix",
    logo: "🍿",
    salary: "$70,000 - $90,000",
    location: "Miami, FL",
    experience: "1-3 years",
    type: "Hybrid",
    description: "Clean data, run statistical summaries, and build client reports. Ideal candidates have background writing SQL and Pandas scripts, and using tools like Tableau.",
    requiredSkills: ["SQL", "Python", "Pandas", "NumPy", "Tableau"],
    applyLink: "https://jobs.netflix.com"
  }
];

// Generate remaining mock jobs dynamically to reach 50+ entries
const companies = ["Vercel", "Stripe", "Supabase", "Google", "GitHub", "Discord", "Netflix", "Clerk", "OpenAI"];
const companyUrls = {
  "Vercel": "https://vercel.com/careers",
  "Stripe": "https://stripe.com/jobs",
  "Supabase": "https://supabase.com/careers",
  "Google": "https://careers.google.com",
  "GitHub": "https://github.com/about/careers",
  "Discord": "https://discord.com/careers",
  "Netflix": "https://jobs.netflix.com",
  "Clerk": "https://clerk.com/careers",
  "OpenAI": "https://openai.com/careers"
};
const locations = ["Remote", "Seattle, WA", "New York, NY", "Austin, TX", "San Francisco, CA", "Bangalore, IN", "London, UK", "Chicago, IL"];
const types = ["Remote", "Hybrid", "Onsite"];
const salaries = ["$80,000 - $100,000", "$95,000 - $115,000", "$110,000 - $130,000", "$130,000 - $160,000", "$60,000 - $80,000"];
const experiences = ["0-2 years", "1-3 years", "2-5 years", "3+ years", "5+ years"];

const techStacks = [
  { title: "Node & React Developer", skills: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "HTML", "CSS"] },
  { title: "Machine Learning Specialist", skills: ["Python", "FastAPI", "TensorFlow", "PyTorch", "Machine Learning", "NLP"] },
  { title: "Cloud Ops Engineer", skills: ["AWS", "Docker", "Kubernetes", "Linux", "Bash", "CI/CD", "Terraform"] },
  { title: "Backend Systems Developer", skills: ["Node.js", "Express", "SQL", "PostgreSQL", "Redis", "REST API", "Git"] },
  { title: "UI/UX Front-End Developer", skills: ["React", "JavaScript", "HTML", "CSS", "Tailwind", "Bootstrap"] },
  { title: "Python Data Engineer", skills: ["Python", "SQL", "Pandas", "NumPy", "Docker", "GCP"] }
];

for (let i = 0; i < 40; i++) {
  const stack = techStacks[i % techStacks.length];
  const company = companies[i % companies.length];
  const location = locations[i % locations.length];
  const type = types[i % types.length];
  const salary = salaries[i % salaries.length];
  const experience = experiences[i % experiences.length];
  const applyLink = companyUrls[company] || "https://careers.google.com";

  jobs.push({
    title: `${stack.title} (Level ${i % 3 + 1})`,
    company,
    logo: "🏢",
    salary,
    location,
    experience,
    type,
    description: `We are hiring a ${stack.title} to work on our core database architectures, integrate modern UI layers, and deploy server containers. You will be part of a dynamic, agile engineering team.`,
    requiredSkills: stack.skills,
    applyLink
  });
}

const seedJobs = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume-matcher';
    await mongoose.connect(connStr);
    console.log('Database connected for seeding...');
    
    await Job.deleteMany();
    console.log('Cleared existing jobs.');

    await Job.insertMany(jobs);
    console.log(`Successfully seeded ${jobs.length} jobs in MongoDB.`);
    
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding jobs: ${error.message}`);
    process.exit(1);
  }
};

seedJobs();
