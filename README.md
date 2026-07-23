# AI-Powered Resume Matcher & Job Recommendation System

An advanced, full-stack application designed to parse resumes, audit ATS compatibility, match candidate skills with job listings, and leverage generative AI to generate tailored career materials and prep candidates for interviews.

---

## 🚀 Key Features

*   **📄 Intelligent Resume Parsing:** Extract raw text, contact information, skills, and structure from PDF and DOCX files using a dedicated Python FastAPI NLP microservice.
*   **🎯 ATS Compatibility Auditor:** Scrapes and checks documents for formatting compatibility, action verbs, single-column alignment, and quantifiable metrics, providing a comprehensive ATS score.
*   **💼 Smart Job Matching:** Compares candidate skills against job requirements to calculate overlap percentage and highlight missing keywords.
*   **🤖 Generative AI Copilot (Powered by Google Gemini):**
    *   **Custom Cover Letters:** Instantly writes highly tailored, professional cover letters matching job descriptions.
    *   **Interactive Learning Roadmaps:** Generates step-by-step custom roadmaps to bridge candidate skill gaps.
    *   **Targeted Interview Prep:** Curates 5 technical and 5 behavioral/HR questions customized to the target role.
*   **📊 Analytics Dashboard:** Interactive statistics and progress charts using **Chart.js** and styled with **Framer Motion** animations.

---

## 🛠️ Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Chart.js, React Router |
| **Backend API** | Node.js, Express, MongoDB (Mongoose), JWT, Cloudinary, Multer, Nodemailer |
| **NLP Microservice** | Python 3, FastAPI, Uvicorn, PyPDF, python-docx |
| **AI Engine** | Google Gemini API (`@google/generative-ai` SDK & REST fallback) |

---

## 📂 Project Structure

```text
├── client/          # React SPA (Vite + Tailwind v4)
├── server/          # Express.js REST API
├── nlp-service/     # FastAPI Python service for text extraction & matching
├── package.json     # Root workspace configuration
└── README.md        # Documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (v3.9 or higher)
*   **MongoDB** (Local instance or Atlas URI)
*   **Google Gemini API Key** (Get one free at [Google AI Studio](https://aistudio.google.com/))
*   **Cloudinary Account** (For secure file hosting)

### 1. Clone & Install Dependencies
From the root directory, run the workspace setup command:
```bash
npm run install:all
```
*This command automatically runs `npm install` inside the `client/` and `server/` directories, and installs Python requirements.*

### 2. Configure Environment Variables

#### Backend Server (`server/.env`)
Create a `.env` file in the `server/` directory and configure the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signature_secret

# Email Verification (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Engine
GEMINI_API_KEY=your_google_gemini_api_key
```

#### NLP Python Service Setup (`nlp-service/`)
For the NLP service to run, it is recommended to set up a virtual environment inside the `nlp-service/` folder:
```bash
cd nlp-service
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

---

## 🏃 Running the Application

To run the entire ecosystem (Frontend, Express Backend, and Python NLP Service) concurrently, simply run the following command in the **root directory**:

```bash
npm run dev
```

The services will start up on the following ports:
*   **Frontend (React Client):** `http://localhost:5173`
*   **Backend API Server:** `http://localhost:5000`
*   **NLP Microservice:** `http://localhost:8000`

---

## 🧪 Service Endpoints

### 🐍 FastAPI Microservice (NLP)
*   `POST /parse` - Accepts a file upload (`file`) and returns extracted text, parsed contact info, skills, and ATS formatting audits.
*   `POST /match` - Accepts a list of candidate skills and target job skills, returning match metrics.

### ⚡ Express API Server
*   `/api/auth` - User registration, OTP verification, and JWT login.
*   `/api/resumes` - Resume upload, history storage, and Cloudinary syncing.
*   `/api/jobs` - Job board listing, seeding, and recommendation queries.
*   `/api/ai` - AI cover letter, roadmap, and interview prep generators.
