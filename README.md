# JobNexus - Premium Job Portal Platform

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue)
![Architecture](https://img.shields.io/badge/Architecture-Microservices-orange)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black)
![Message Broker](https://img.shields.io/badge/Messaging-Kafka-red)

JobNexus is a full-stack, production-grade SaaS application built on a **microservices architecture**. It connects jobseekers with recruiters, provides AI-powered career tools, and includes a premium subscription system to highlight top candidates.

---

## 🌟 Key Features

### For Jobseekers
*   **Smart Job Search:** Browse and filter jobs with real-time application tracking.
*   **AI Career Guide:** Get personalized career path recommendations powered by Google Gemini.
*   **AI Resume Analyzer:** Upload your PDF resume for an instant, multimodal ATS score and actionable feedback.
*   **Premium Subscriptions:** Upgrade via Razorpay to appear at the top of recruiters' candidate lists.
*   **Profile Management:** Manage skills, update resumes, and track all your applications in one place.

### For Recruiters
*   **Company Management:** Register multiple companies, upload logos, and manage brand profiles.
*   **Job Postings:** Create detailed job listings with specific requirements and locations.
*   **Applicant Tracking:** View, sort, and manage applicants. Premium candidates are automatically highlighted.
*   **Status Updates:** Easily move candidates through "Submitted", "Hired", and "Rejected" stages with automated email notifications.

---

## 🛠️ Tech Stack

**Frontend:**
*   Next.js 14+ (App Router), React 19
*   TypeScript
*   Tailwind CSS & shadcn/ui
*   Google OAuth (`@react-oauth/google`)

**Backend (5 Microservices):**
*   Node.js & Express.js
*   TypeScript
*   MongoDB Atlas & Mongoose ODM
*   Apache Kafka (Event-driven email notifications)
*   Redis (Password reset token caching)
*   Cloudinary (Image and PDF resume storage)
*   Google Gemini API (AI text and multimodal processing)
*   Razorpay (Subscription checkout and HMAC verification)
*   JSON Web Tokens (Stateless authentication)

---

## 🏗️ Architecture Overview

JobNexus moves away from the traditional monolith by splitting the backend into 5 independently scalable services:

1.  **Auth Service (5000):** Registration, login, JWT issuance, Google OAuth, password resets.
2.  **Utils Service (5001):** The infrastructure hub. Handles Cloudinary file uploads, Gemini AI generation, and runs the Kafka Consumer to send SMTP emails.
3.  **User Service (5002):** Jobseeker profile management, resume uploads, and job application submission.
4.  **Job Service (5003):** Recruiter controls, company management, job postings, and application status updates.
5.  **Payment Service (5004):** Razorpay checkout and secure webhook/signature verification for premium subscriptions.

For a deep dive into the architecture, data flow, and database design, please read the [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18 or higher)
*   Docker & Docker Compose (for Kafka, Zookeeper, and Redis)
*   A MongoDB Atlas cluster (or local instance)
*   Accounts for Cloudinary, Razorpay, and Google Gemini Studio.

### 1. Clone the Repository
```bash
git clone https://github.com/sidV214/JobPortal-Microservices-.git
cd JobPortal-Microservices-
```

### 2. Install Dependencies
Run the root package script to install dependencies for the frontend and all 5 microservices:
```bash
npm run install:all
```

### 3. Start Infrastructure Containers
You must start the Kafka, Zookeeper, and Redis containers before starting the Node services.
```bash
docker-compose up -d
```

### 4. Environment Variables
You must create `.env` files in each service directory (`services/auth`, `services/job`, etc.) and a `.env.local` in the `frontend` directory. Refer to the Architecture document for the required keys (MongoDB URI, JWT Secret, Cloudinary keys, Razorpay keys, Gemini API key, etc.).

### 5. Start the Application
Run the root dev script. This uses `concurrently` to spin up the frontend and all 5 backend microservices in a single terminal with color-coded outputs:
```bash
npm run dev:all
```

The frontend will be available at `http://localhost:3000`.

---

## 📚 Documentation Reference

This repository includes extensive documentation to help you understand the codebase:

*   **[ARCHITECTURE.md](./ARCHITECTURE.md):** Exhaustive technical overview, database design, and microservice breakdown.
*   **[WORKFLOW.md](./WORKFLOW.md):** Step-by-step control flow mapping every user action to the backend files it touches.
*   **[USER_GUIDE.md](./USER_GUIDE.md):** Functional guide on how to use the platform as a jobseeker vs. a recruiter.
*   **[INTERVIEW_QUESTIONS.md](./INTERVIEW_QUESTIONS.md):** 80+ potential interview questions, real-world bugs we faced (like the Kafka lock issue and Cloudinary PDF blocks), and complete technical Q&A.
