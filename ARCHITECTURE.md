# JobNexus — Complete Architecture Document

> **Purpose**: This document provides a complete, exhaustive technical overview of the JobNexus SaaS platform. It is designed so that **any developer, AI assistant, or LLM** reading it will have full context to answer questions, debug issues, add features, or conduct code reviews with zero additional context needed.

---

## 1. PROJECT OVERVIEW

**JobNexus** is a full-stack, production-grade job portal SaaS application built on a **microservices architecture** using the MERN stack (MongoDB, Express, React/Next.js, Node.js). It connects jobseekers with recruiters, provides AI-powered career tools, and includes a premium subscription system.

### Key Business Features
- **Jobseeker Features**: Browse/search jobs, one-click apply, track applications, manage profile/skills/resume, AI career guide, AI ATS resume scorer, premium subscription
- **Recruiter Features**: Create companies, post jobs, view/sort applications (premium users first), update application status (Hired/Rejected), manage job postings
- **AI Features**: Gemini-powered career path advisor and multimodal ATS resume analyzer
- **Payment**: Razorpay-integrated subscription checkout with HMAC signature verification
- **Auth**: JWT-based stateless authentication + Google OAuth 2.0 + password reset via email

### Tech Stack Summary
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | 5x Express.js microservices (TypeScript) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Message Queue | Apache Kafka (via KafkaJS) |
| Cache/Store | Redis (for password reset tokens) |
| File Storage | Cloudinary (images + PDFs) |
| AI | Google Gemini API (text + multimodal) |
| Payment | Razorpay (checkout + webhook verification) |
| Auth | JWT (jsonwebtoken), bcrypt, Google OAuth (google-auth-library) |
| Container | Docker Compose (Kafka + Zookeeper + Redis) |
| Email | Gmail SMTP via Nodemailer |

---

## 2. WHY MICROSERVICES?

### Architecture Decision: Microservices over Monolith

JobNexus uses a **microservices architecture** where the backend is split into 5 independently running services instead of a single monolithic Express app.

### Advantages (Why We Chose Microservices)

1. **Independent Deployment**: Each service can be deployed, scaled, and restarted independently. If the Payment Service crashes, Auth and Jobs still work.

2. **Technology Flexibility**: Each service could theoretically use a different tech stack. Currently all use Express+TS, but the Utils Service (AI/email) could be migrated to Python/FastAPI without affecting others.

3. **Separation of Concerns**: Each service owns its domain:
   - Auth → handles ONLY authentication
   - User → handles ONLY profile/application management
   - Job → handles ONLY company/job CRUD and recruiter operations
   - Utils → handles ONLY infrastructure (uploads, AI, emails)
   - Payment → handles ONLY subscription billing

4. **Fault Isolation**: A bug in the Payment Service's Razorpay integration won't take down job search. A memory leak in AI processing (Utils) won't affect login.

5. **Independent Scaling**: If job search is getting 10x more traffic than payment, only the Job Service needs to scale horizontally.

6. **Team Scalability**: Different developers can work on different services without merge conflicts in a single monolith.

### Disadvantages (Trade-offs We Accept)

1. **Increased Complexity**: 5 services = 5 package.jsons, 5 .env files, 5 ports, 5 deployment configs.

2. **Network Overhead**: Inter-service HTTP calls (Auth → Utils for file upload) add latency vs in-process function calls.

3. **Data Consistency**: Each service has its own MongoDB connection. Some models (Job, Company) are duplicated across services for read independence. Changes must be kept in sync.

4. **Operational Overhead**: Need Docker Compose for Kafka + Redis. More logs to monitor, more processes to manage.

5. **Distributed Debugging**: A single user action (e.g., "apply for job") touches User Service, Job Service, and Utils Service (via Kafka). Tracing requires correlating logs across services.

### In General: When to Use Microservices
- **Use Microservices When**: Large team, complex domain, need independent scaling, high availability requirements, multi-language needs.
- **Use Monolith When**: Small team, MVP/prototype, simple domain, speed of development is priority, budget-constrained.

---

## 3. HIGH-LEVEL ARCHITECTURE DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js :3000)                     │
│  App Router │ AppContext │ shadcn/ui │ Google OAuth │ Razorpay   │
└──────────┬──────────┬──────────┬──────────┬──────────┬───────────┘
           │          │          │          │          │
     HTTP  │    HTTP  │    HTTP  │    HTTP  │    HTTP  │
           ▼          ▼          ▼          ▼          ▼
┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐
│ Auth :5000  │ │User :5002│ │Job :5003│ │Utils    │ │Payment    │
│             │ │          │ │         │ │  :5001  │ │  :5004    │
│ - register  │ │ - profile│ │ - CRUD  │ │ - upload│ │ - checkout│
│ - login     │ │ - skills │ │ - search│ │ - AI    │ │ - verify  │
│ - forgot    │ │ - apply  │ │ - apps  │ │ - email │ │ - subscr  │
│ - reset     │ │ - resume │ │ - compy │ │         │ │           │
│ - google    │ │          │ │         │ │         │ │           │
└──────┬──────┘ └─────┬────┘ └────┬────┘ └────┬────┘ └─────┬─────┘
       │              │           │           │            │
       ▼              ▼           ▼           ▼            ▼
┌──────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                             │
│  Collections: users, jobs, companies, applications, payments     │
└──────────────────────────────────────────────────────────────────┘

       │              │                       │
       ▼              ▼                       ▼
┌─────────────┐ ┌──────────────┐     ┌──────────────┐
│    Redis    │ │    Kafka     │     │  Cloudinary  │
│ (pwd reset) │ │ (send-mail)  │     │  (files)     │
└─────────────┘ └──────┬───────┘     └──────────────┘
                       │
                       ▼
              ┌──────────────┐
              │  Gmail SMTP  │
              │ (Nodemailer) │
              └──────────────┘
```

---

## 4. SERVICE-BY-SERVICE BREAKDOWN

### 4.1 Auth Service (Port 5000)
**Path**: `services/auth/`
**Responsibility**: User registration, login, password recovery, Google OAuth

| File | Purpose |
|------|---------|
| `index.ts` | Entry point. Starts server, connects MongoDB, initializes Redis client, connects Kafka producer |
| `app.ts` | Express config: CORS, JSON parser, routes, global error handler |
| `controllers/auth.ts` | Business logic for register, login, forgot, reset, googleLogin |
| `routes/auth.ts` | Maps endpoints: POST /register, /login, /forgot, /reset/:token, /google |
| `models/User.ts` | Mongoose schema: name, email, password, phone, role, resume, profile_pic, skills, subscription |
| `producer.ts` | Kafka producer: connects to broker, publishes messages to "send-mail" topic |
| `templete.ts` | HTML email template for password reset emails |
| `middlewares/multer.ts` | Multer config for in-memory file uploads (resume PDF) |
| `utils/db.ts` | MongoDB connection via Mongoose |
| `utils/buffer.ts` | Converts multer file to base64 data URI string |
| `utils/errorHandler.ts` | Custom Error class with statusCode |
| `utils/TryCatch.ts` | HOF wrapper: wraps async handlers in try/catch, forwards errors to Express |

**Key Flows**:
- Register (jobseeker) → multer → buffer → HTTP POST to Utils Service → Cloudinary upload → save URL in MongoDB
- Forgot Password → JWT reset token → Redis SET (15min TTL) → Kafka publish → Utils Service sends email
- Reset Password → JWT verify + Redis GET → bcrypt hash → MongoDB update → Redis DEL
- Google OAuth → verify ID token with Google → find/create user → issue JWT

**Dependencies**: MongoDB, Redis, Kafka, Utils Service (HTTP), Google Auth Library

---

### 4.2 User Service (Port 5002)
**Path**: `services/user/`
**Responsibility**: Profile management, job applications, skill management

| File | Purpose |
|------|---------|
| `index.ts` | Entry point. Connects MongoDB, Kafka producer, starts server |
| `app.ts` | Express config with CORS, JSON, routes |
| `controllers/user.ts` | Business logic: getMe, getUser, updateProfile, updatePic, updateResume, addSkill, removeSkill, applyJob, getApplications |
| `routes/user.ts` | Maps endpoints with isAuth middleware |
| `middlewares/auth.ts` | JWT verification middleware: extracts Bearer token, verifies, attaches userId to req |
| `models/Application.ts` | Application schema with compound unique index (job_id + applicant_id) |
| `models/Job.ts` | Read-only Job model (duplicate for microservice independence) |
| `models/Company.ts` | Read-only Company model (for email template data) |
| `producer.ts` | Kafka producer for application confirmation emails |
| `templete.ts` | HTML email template for job application confirmation |

**Key Flows**:
- Apply for Job → validate job exists → check not already applied → create Application → Kafka publish email → Utils sends confirmation
- Update Profile Pic → HTTP POST to Utils Service (Cloudinary upload) → update user.profile_pic
- Update Resume → Same flow, updates user.resume

**Dependencies**: MongoDB, Kafka, Utils Service (HTTP for uploads)

---

### 4.3 Job Service (Port 5003)
**Path**: `services/job/`
**Responsibility**: Company CRUD, Job CRUD, application management (recruiter side)

| File | Purpose |
|------|---------|
| `controllers/job.ts` | All business logic: createCompany, getAllCompanies, getCompany, deleteCompany, createJob, getAllJobs, getJob, updateApplicationStatus, getJobApplications |
| `routes/job.ts` | Maps endpoints: public (GET jobs) + private (POST/PUT with isAuth) |

**Key Flows**:
- Create Company → validate recruiter role → multer for logo → HTTP POST to Utils (Cloudinary) → save in MongoDB
- Create Job → validate recruiter owns company → create job document
- Get All Jobs → supports ?title=&location= query params → MongoDB $regex search (case-insensitive)
- Get Job Applications → recruiter only → sorts by `subscribed: -1` (premium applicants first)
- Update Application Status → ownership validation → update status → Kafka publish email notification

**Dependencies**: MongoDB, Kafka, Utils Service (HTTP for logo uploads)

---

### 4.4 Utils Service (Port 5001)
**Path**: `services/utils/`
**Responsibility**: Infrastructure hub — file uploads, AI features, email sending

| File | Purpose |
|------|---------|
| `index.ts` | Entry point. Configures Cloudinary, starts Kafka consumer, starts server |
| `routes.ts` | All routes + controller logic inline: /upload, /career, /resume-analyser |
| `consumer.ts` | Kafka consumer: subscribes to "send-mail" topic, sends emails via Nodemailer |

**Key Flows**:
- File Upload → receives base64 buffer → `cloudinary.uploader.upload()` → returns { url, public_id }
- AI Career Guide → receives skills array → Gemini `generateContent()` with JSON schema prompt → returns career recommendations
- AI Resume Analyser → receives base64 PDF → Gemini multimodal `inlineData` → returns ATS score + breakdown
- Email Consumer → Kafka consumer receives message → parses { to, subject, html } → Nodemailer sends via Gmail SMTP

**Dependencies**: Cloudinary, Google Gemini API, Kafka (consumer), Gmail SMTP

---

### 4.5 Payment Service (Port 5004)
**Path**: `services/payment/`
**Responsibility**: Razorpay subscription checkout and verification

| File | Purpose |
|------|---------|
| `index.ts` | Entry point. Creates Razorpay instance, connects MongoDB, starts server |
| `controllers/payment.ts` | checkOut (create order) and paymentVerification (verify + activate subscription) |
| `routes/payment.ts` | POST /checkout, POST /verify (both require isAuth) |

**Key Flows**:
- Checkout → `instance.orders.create({ amount: 11900, currency: "INR" })` → returns order to frontend
- Verify → receives razorpay_order_id + payment_id + signature → HMAC-SHA256 verification → if valid, update user.subscription with 30-day expiry

**Dependencies**: MongoDB, Razorpay SDK

---

## 5. INTER-SERVICE COMMUNICATION

### 5.1 Synchronous (HTTP)
Direct HTTP calls between services:
```
Auth Service ──HTTP POST──→ Utils Service (/api/utils/upload)     [Resume upload during registration]
User Service ──HTTP POST──→ Utils Service (/api/utils/upload)     [Profile pic / resume update]
Job Service  ──HTTP POST──→ Utils Service (/api/utils/upload)     [Company logo upload]
Frontend     ──HTTP *──→    All 5 Services                        [All API calls]
```

### 5.2 Asynchronous (Kafka)
Event-driven communication via Apache Kafka message queue:
```
Auth Service  ──publish──→ Kafka Topic "send-mail" ──consume──→ Utils Service (sends forgot password email)
User Service  ──publish──→ Kafka Topic "send-mail" ──consume──→ Utils Service (sends application confirmation email)
Job Service   ──publish──→ Kafka Topic "send-mail" ──consume──→ Utils Service (sends status update email)
```

**Why Kafka over direct SMTP?**
1. **Decoupling**: The sending service doesn't need to know SMTP details
2. **Non-blocking**: Email sending doesn't delay the API response
3. **Reliability**: If SMTP is down, messages queue up in Kafka and are retried
4. **Centralization**: All email logic lives in one place (Utils consumer)
5. **Scalability**: Multiple consumers can process emails in parallel

### 5.3 Shared Infrastructure
| Infrastructure | Used By | Purpose |
|----------------|---------|---------|
| MongoDB Atlas | All 5 services | Primary data store |
| Redis | Auth Service only | Password reset token storage with TTL |
| Kafka | Auth, User, Job (producers) + Utils (consumer) | Async email notifications |
| Cloudinary | Utils Service (via SDK), others via HTTP | Media file storage |

---

## 6. DATABASE DESIGN

### Collections
| Collection | Service Owner | Key Fields |
|------------|--------------|------------|
| `users` | Auth (write), User (read/write), Payment (write subscription) | user_id, name, email, password, role, skills[], subscription, resume, profile_pic |
| `jobs` | Job Service (write), User Service (read) | job_id, title, description, salary, location, job_type, work_location, company_id, posted_by_recruiter_id, is_active |
| `companies` | Job Service (write), User Service (read) | company_id, name, description, website, logo, recruiter_id |
| `applications` | User Service (write), Job Service (read/write status) | application_id, job_id, applicant_id, status, resume, subscribed |
| `payments` | Payment Service | order_id, user_id, amount, razorpay_payment_id |

### Model Duplication Strategy
Some models are duplicated across services for **microservice independence**:
- `Job` model exists in both Job Service (read/write) and User Service (read-only)
- `Company` model exists in both Job Service (read/write) and User Service (read-only, for email templates)
- This avoids inter-service HTTP calls for simple reads, at the cost of keeping schemas in sync

### Key Indexes
- `applications`: Compound unique index on `{ job_id, applicant_id }` — prevents duplicate applications
- `users`: Unique index on `email` — prevents duplicate accounts
- `jobs`: Index on `title` and `location` for search queries

---

## 7. AUTHENTICATION & SECURITY

### JWT-Based Stateless Authentication
```
1. User logs in → Auth Service issues JWT with { id: user._id, exp: 15 days }
2. Frontend stores JWT in browser cookie (via js-cookie)
3. Every API request includes header: Authorization: Bearer <token>
4. Each service has its own isAuth middleware that:
   a. Extracts token from Authorization header
   b. Verifies with jwt.verify(token, JWT_SEC)
   c. Attaches userId to req object
   d. Calls next() or returns 401
5. JWT_SEC secret MUST be identical across all services
```

### Security Patterns
| Pattern | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with 10 salt rounds |
| Token Expiry | JWT: 15 days, Reset token: 15 minutes |
| Single-Use Reset | JWT + Redis double-check (token deleted after use) |
| Email Enumeration Prevention | Same response for existing/non-existing emails |
| Ownership Validation | Recruiter endpoints check user.role === "recruiter" AND database ownership |
| Payment Verification | HMAC-SHA256 signature verification with Razorpay secret |
| Google OAuth | Server-side ID token verification via google-auth-library |
| CORS | Configured per-service to allow frontend origin |

---

## 8. FRONTEND ARCHITECTURE

### Next.js App Router Structure
```
frontend/src/
├── app/
│   ├── layout.tsx              → Root layout (AppProvider, GoogleOAuth, ThemeProvider, NavBar)
│   ├── page.tsx                → Landing page (Hero + CareerGuide + ResumeAnalyzer)
│   ├── globals.css             → Global styles, glassmorphism utilities
│   ├── (auth)/
│   │   ├── login/page.tsx      → Email/Password + Google OAuth login
│   │   ├── register/page.tsx   → Multi-role registration with file upload
│   │   ├── forgot/page.tsx     → Forgot password (email input)
│   │   └── reset/[token]/page.tsx → Reset password (token from email)
│   ├── jobs/
│   │   ├── page.tsx            → Job search with filters
│   │   └── [id]/page.tsx       → Job detail + recruiter application management
│   ├── company/
│   │   └── [id]/page.tsx       → Company profile + recruiter job management (775 lines)
│   ├── account/
│   │   ├── page.tsx            → Own profile (role-based sections)
│   │   ├── [id]/page.tsx       → Other user's profile (read-only)
│   │   └── components/
│   │       ├── info.tsx        → Profile info with edit (431 lines)
│   │       ├── company.tsx     → Company management for recruiters
│   │       ├── skills.tsx      → Skill tag management
│   │       └── appliedJobs.tsx → Application history
│   ├── subscribe/page.tsx      → Razorpay checkout page
│   ├── payment/success/[id]/page.tsx → Payment confirmation
│   └── about/page.tsx          → Static about page
├── components/
│   ├── navbar.tsx              → Responsive nav with auth-conditional rendering
│   ├── hero.tsx                → Landing hero with CTA
│   ├── job-card.tsx            → Reusable job card with apply logic
│   ├── carrer-guide.tsx        → AI career advisor (Dialog-based)
│   ├── resume-analyser.tsx     → AI ATS scorer (Dialog-based)
│   ├── scriptLoader.tsx        → Razorpay SDK dynamic loader hook
│   ├── google-oauth-wrapper.tsx→ Google OAuth provider wrapper
│   └── ui/                     → shadcn/ui components (Button, Card, Dialog, etc.)
├── context/
│   └── AppContext.tsx           → Global state: user, auth, all API functions
├── lib/
│   └── utils.ts                → cn() utility for className merging
└── type.ts                      → All TypeScript interfaces
```

### State Management: React Context API
- Single `AppContext` with `AppProvider` wrapping the entire app
- Custom `useAppData()` hook for typed access
- Stores: user, isAuth, loading, btnLoading, applications
- Exposes 9 API functions (fetchUser, applyJob, updateProfile, etc.)
- JWT stored in cookies via `js-cookie`, sent as Bearer token on every request

### Design System
- **Dark theme only** (forcedTheme="dark")
- Glassmorphism (backdrop-blur, transparent backgrounds)
- Gradient orbs background effect
- shadcn/ui component library
- Lucide React icons
- react-hot-toast notifications

---

## 9. INFRASTRUCTURE SETUP

### Docker Compose (docker-compose.yml)
Runs 3 infrastructure containers:
```yaml
services:
  zookeeper:    # Kafka dependency, port 22181
  kafka:        # Message broker, port 9092 (host) / 29092 (internal)
  redis:        # Key-value store, port 6379
```

### Environment Variables (per service)
Each service has its own `.env` file:

**Auth (.env)**:
```
PORT=5000, Mongo_URL, JWT_SEC, UPLOAD_SERVICE=http://localhost:5001,
Frontend_Url=http://localhost:3000, GOOGLE_CLIENT_ID
```

**User (.env)**:
```
PORT=5002, Mongo_URL, JWT_SEC, UPLOAD_SERVICE=http://localhost:5001
```

**Job (.env)**:
```
PORT=5003, Mongo_URL, JWT_SEC, UPLOAD_SERVICE=http://localhost:5001
```

**Utils (.env)**:
```
PORT=5001, Mongo_URL, Cloud_Name, Cloud_Api, Cloud_Secret,
Gemini_Api, Gmail_User, Gmail_Pass
```

**Payment (.env)**:
```
PORT=5004, Mongo_URL, JWT_SEC, Razorpay_Key, Razorpay_Secret
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

### Startup Order
1. `docker-compose up -d` → Start Kafka, Zookeeper, Redis
2. Wait ~10 seconds for Kafka to initialize
3. Start each service: `npm run dev` in each service directory
4. Start frontend: `npm run dev` in frontend directory

---

## 10. ERROR HANDLING PATTERNS

### Backend Error Pattern
```typescript
// Custom error class
class ErrorHandler extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) { ... }
}

// TryCatch HOF wrapper
const TryCatch = (handler) => async (req, res, next) => {
  try { await handler(req, res, next); }
  catch (error) { next(error); }
};

// Global error handler in app.ts
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message });
});
```

### Frontend Error Pattern
```typescript
try {
  const { data } = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
  toast.success(data.message);
} catch (error: any) {
  toast.error(error.response.data.message);
}
```

---

## 11. COMPLETE API REFERENCE

### Auth Service (Port 5000)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No (multer) | Register new user |
| POST | /api/auth/login | No | Email/password login |
| POST | /api/auth/forgot | No | Send reset email |
| POST | /api/auth/reset/:token | No | Reset password |
| POST | /api/auth/google | No | Google OAuth login |

### User Service (Port 5002)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/user/me | Yes | Get own profile |
| GET | /api/user/:id | Yes | Get user by ID |
| PUT | /api/user/update/profile | Yes | Update name/phone/bio |
| PUT | /api/user/update/pic | Yes (multer) | Update profile picture |
| PUT | /api/user/update/resume | Yes (multer) | Update resume |
| POST | /api/user/skill/add | Yes | Add skill |
| PUT | /api/user/skill/delete | Yes | Remove skill |
| POST | /api/user/apply/job | Yes | Apply to job |
| GET | /api/user/application/all | Yes | Get all applications |

### Job Service (Port 5003)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/job/company/new | Yes (multer) | Create company |
| GET | /api/job/company/all | Yes | Get recruiter's companies |
| GET | /api/job/company/:id | No | Get company by ID |
| DELETE | /api/job/company/:id | Yes | Delete company |
| POST | /api/job/new | Yes | Create job posting |
| GET | /api/job/all | No | Search/list all jobs |
| GET | /api/job/:jobId | No | Get job by ID |
| PUT | /api/job/:jobId | Yes | Update job |
| GET | /api/job/application/:jobId | Yes | Get job applications (recruiter) |
| PUT | /api/job/application/update/:id | Yes | Update application status |

### Utils Service (Port 5001)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/utils/upload | No | Upload file to Cloudinary |
| POST | /api/utils/career | No | AI career guide |
| POST | /api/utils/resume-analyser | No | AI ATS resume analysis |

### Payment Service (Port 5004)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/payment/checkout | Yes | Create Razorpay order |
| POST | /api/payment/verify | Yes | Verify payment + activate subscription |

---

## 12. KEY DESIGN DECISIONS

| Decision | Why |
|----------|-----|
| Microservices over Monolith | Independent scaling, fault isolation, team scalability |
| Kafka over direct SMTP | Decoupled, non-blocking, reliable email delivery |
| Redis for reset tokens | Auto-expiry TTL, single-use enforcement, fast lookups |
| JWT in cookies (not localStorage) | Cross-tab persistence, easier cleanup |
| Model duplication across services | Avoid inter-service HTTP for simple reads |
| Compound unique index on applications | Database-level prevention of duplicate applications |
| Sorted applications by subscription | Business logic — premium users get priority visibility |
| Base64 file transfer | Simplifies file passing between services without shared filesystem |
| Gemini multimodal for resume | PDF analysis without text extraction — AI reads the PDF directly |
| HMAC-SHA256 for payment | Industry-standard tamper-proof verification |

---

## 13. KNOWN CONSIDERATIONS & DEBUGGING TIPS

1. **JWT_SEC must be identical** across Auth, User, Job, and Payment services. Mismatch causes `JsonWebTokenError: jwt malformed`.
2. **Kafka must be running** before starting Auth, User, or Job services, otherwise the Kafka producer connection will fail.
3. **Cloudinary credentials** must be set in Utils Service .env. File uploads will fail without them.
4. **Gemini API key** is required for AI features. Without it, career guide and resume analyzer will throw 500 errors.
5. **Gmail App Password** (not regular password) is needed for SMTP. Enable 2FA on Google account first.
6. **Razorpay Test Mode**: Use test keys during development. Test card: 4111 1111 1111 1111.
7. **MongoDB connection**: All services connect to the SAME MongoDB database. The Mongo_URL should be identical across services.
8. **CORS errors**: Each service has `cors({ origin: "http://localhost:3000" })`. Update for production.
9. **Port conflicts**: Services use 5000-5004. Ensure no other apps use these ports.
10. **Redis must be running** for forgot password flow. Without it, reset tokens can't be stored/verified.
