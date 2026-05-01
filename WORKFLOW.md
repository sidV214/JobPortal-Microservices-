# JobNexus — Complete Control Flow & Workflow Document

> Every user action mapped to every file it touches, in order.

---

## 1. APPLICATION STARTUP FLOW

### 1.1 Infrastructure (Docker)
```
docker-compose up -d
  → Zookeeper starts (port 22181)
  → Kafka starts (port 9092), connects to Zookeeper
  → Redis starts (port 6379)
```

### 1.2 Backend Services (each runs `npm run dev`)

**Auth Service (Port 5000)**:
```
services/auth/src/index.ts
  → dotenv.config()
  → connectDB() [utils/db.ts → mongoose.connect(Mongo_URL)]
  → redisClient = createClient() → redisClient.connect()
  → connectProducer() [producer.ts → new Kafka() → producer.connect()]
  → app.listen(5000) [app.ts → Express with routes/auth.ts]
```

**User Service (Port 5002)**:
```
services/user/src/index.ts
  → dotenv.config()
  → connectDB() → connectProducer()
  → app.listen(5002) [app.ts → Express with routes/user.ts]
```

**Job Service (Port 5003)**:
```
services/job/src/index.ts
  → dotenv.config()
  → connectDB() → connectProducer()
  → app.listen(5003) [app.ts → Express with routes/job.ts]
```

**Utils Service (Port 5001)**:
```
services/utils/src/index.ts
  → dotenv.config()
  → cloudinary.config({ cloud_name, api_key, api_secret })
  → connectDB()
  → startConsumer() [consumer.ts → kafka.consumer() → subscribe("send-mail") → run()]
  → app.listen(5001) [routes.ts contains all routes inline]
```

**Payment Service (Port 5004)**:
```
services/payment/src/index.ts
  → dotenv.config()
  → new Razorpay({ key_id, key_secret }) → exported as `instance`
  → connectDB()
  → app.listen(5004)
```

### 1.3 Frontend (Port 3000)
```
frontend/src/app/layout.tsx (renders on every page)
  → <AppProvider>           [context/AppContext.tsx]
    → useEffect on mount:
      → fetchUser()         → GET user_service/api/user/me (with Bearer token from cookie)
      → fetchApplications() → GET user_service/api/user/application/all
    → <GoogleOAuthWrapper>  [components/google-oauth-wrapper.tsx]
      → <ThemeProvider>     [components/theme-provider.tsx, forced dark]
        → <NavBar />        [components/navbar.tsx]
        → {children}        (current page)
        → <Toaster />       (react-hot-toast)
```

---

## 2. USER REGISTRATION FLOW

### Browser Event: User fills register form and clicks "Register"

```
FRONTEND:
  app/(auth)/register/page.tsx
    → User fills: name, email, password, phoneNumber, role, resume (file)
    → Creates FormData object (multipart for file)
    → POST → auth_service (http://localhost:5000) /api/auth/register

BACKEND (Auth Service):
  routes/auth.ts
    → router.post("/register", upload, registerUser)
    → multer middleware [middlewares/multer.ts] processes file → req.file

  controllers/auth.ts → registerUser()
    1. Validate required fields → 400 if missing
    2. User.findOne({ email }) → 409 if exists
    3. bcrypt.hash(password, 10)
    4. IF role === "recruiter":
       → User.create({ name, email, password, phone, role })
    5. IF role === "jobseeker":
       → getBuffer(file) [utils/buffer.ts] → base64 string
       → axios.post(UPLOAD_SERVICE/api/utils/upload, { buffer })
         ──HTTP──→ Utils Service (Port 5001)
           routes.ts → /api/utils/upload handler
             → cloudinary.uploader.upload(buffer)
             → returns { url, public_id }
         ←── response { url, public_id }
       → User.create({ ...fields, resume: url, resume_public_id })
    6. jwt.sign({ id: user._id }, JWT_SEC, { expiresIn: "15d" })
    7. res.json({ message, user, token })

FRONTEND (back in register/page.tsx):
    → Cookies.set("token", data.token)
    → setUser(data.registeredUser)
    → setIsAuth(true)
    → redirect("/")
```

---

## 3. USER LOGIN FLOW

### 3.1 Email/Password Login
```
FRONTEND: app/(auth)/login/page.tsx
  → POST → auth_service/api/auth/login { email, password }

BACKEND: controllers/auth.ts → loginUser()
  1. User.findOne({ email }) → 400 if not found
  2. bcrypt.compare(password, user.password) → 400 if mismatch
  3. jwt.sign({ id: user._id }) → token
  4. res.json({ userObject, token })

FRONTEND:
  → Cookies.set("token", token)
  → setUser(userObject), setIsAuth(true)
  → redirect("/")
```

### 3.2 Google OAuth Login
```
FRONTEND: app/(auth)/login/page.tsx
  → <GoogleLogin> component renders Google button
  → User clicks → Google popup → user authorizes
  → onSuccess({ credential }) → Google returns ID token
  → POST → auth_service/api/auth/google { credential }

BACKEND: controllers/auth.ts → googleLogin()
  1. googleClient.verifyIdToken({ idToken, audience }) → contacts Google servers
  2. Extract { email, name, picture } from payload
  3. User.findOne({ email })
  4. If not exists → User.create({ email, name, role: "jobseeker", password: random, profile_pic: picture })
  5. jwt.sign({ id: user._id }) → token
  6. res.json({ userObject, token })

FRONTEND:
  → Same as email login: store token, set state, redirect
```

---

## 4. FORGOT/RESET PASSWORD FLOW

### Step 1: Request Reset
```
FRONTEND: app/(auth)/forgot/page.tsx
  → POST → auth_service/api/auth/forgot { email }

BACKEND: controllers/auth.ts → forgotPassword()
  1. User.findOne({ email })
  2. jwt.sign({ email, type: "reset" }, JWT_SEC, { expiresIn: "15m" }) → resetToken
  3. Build link: Frontend_Url/reset/{resetToken}
  4. redisClient.set("forgot:{email}", resetToken, { EX: 900 })
  5. Compose email message { to, subject, html: forgotPasswordTemplate(link) }
  6. publishToTopic("send-mail", message)
     ──Kafka──→ Utils Service
       consumer.ts → eachMessage()
         → JSON.parse(message.value)
         → nodemailer.createTransport({ Gmail SMTP })
         → transporter.sendMail({ from, to, subject, html })
         → Email arrives in user's inbox

FRONTEND: Shows "If that email exists, we have sent a reset link"
```

### Step 2: Reset Password
```
USER: Clicks link in email → opens app/(auth)/reset/[token]/page.tsx

FRONTEND: reset/[token]/page.tsx
  → useParams() → extracts token from URL
  → User enters new password
  → POST → auth_service/api/auth/reset/{token} { password }

BACKEND: controllers/auth.ts → resetPassword()
  1. jwt.verify(token, JWT_SEC) → decoded { email, type }
  2. Check decoded.type === "reset"
  3. redisClient.get("forgot:{email}") → storedToken
  4. Compare storedToken === token → 400 if mismatch
  5. User.findOne({ email })
  6. bcrypt.hash(newPassword, 10)
  7. user.password = hashedPassword → user.save()
  8. redisClient.del("forgot:{email}") → single-use enforced
  9. res.json({ message: "Password changed successfully" })
```

---

## 5. JOB SEARCH & BROWSING FLOW

```
FRONTEND: app/jobs/page.tsx
  → useEffect on mount:
    → GET → job_service/api/job/all
    → Optional query: ?title=react&location=bangalore

BACKEND: controllers/job.ts → getAllJobs()
  1. Extract { title, location } from req.query
  2. Build MongoDB query:
     → title: { $regex: title, $options: "i" }   (case-insensitive)
     → location: { $regex: location, $options: "i" }
  3. Job.find(query).sort({ created_at: -1 })
  4. res.json(jobs)

FRONTEND:
  → setJobs(data)
  → Renders grid of <JobCard /> components [components/job-card.tsx]
    → Each card shows: title, company, salary, location
    → "View Details" → Link to /jobs/{job_id}
    → "Easy Apply" → calls applyJob(job_id) from AppContext
```

---

## 6. JOB APPLICATION FLOW

```
FRONTEND: components/job-card.tsx (or jobs/[id]/page.tsx)
  → User clicks "Easy Apply"
  → applyJob(job_id) [context/AppContext.tsx]
    → POST → user_service/api/user/apply/job { job_id } (with Bearer token)

BACKEND (User Service): controllers/user.ts → applyJob()
  1. Find user by req.userId (from isAuth middleware)
  2. Job.findOne({ job_id }) → validate job exists
  3. Company.findOne({ company_id: job.company_id }) → get company name
  4. Application.create({ job_id, applicant_id, status: "Submitted", resume: user.resume, subscribed: hasActiveSubscription })
     → Compound unique index prevents duplicate applications
  5. Compose confirmation email:
     → applicationConfirmationTemplate(user.name, job.title, companyName) [templete.ts]
  6. publishToTopic("send-mail", { to: user.email, subject, html })
     ──Kafka──→ Utils Service → consumer.ts → sends email via SMTP
  7. res.json({ message: "Application submitted" })

FRONTEND:
  → toast.success("Application submitted")
  → fetchApplications() → re-fetches all applications
  → JobCard re-renders: "Easy Apply" → "✓ Applied" badge
```

---

## 7. RECRUITER: CREATE COMPANY FLOW

```
FRONTEND: app/account/components/company.tsx
  → Recruiter fills form: name, description, website, logo (file)
  → Creates FormData → POST → job_service/api/job/company/new (with Bearer token + multer)

BACKEND (Job Service): controllers/job.ts → createCompany()
  1. isAuth middleware verifies JWT → req.userId
  2. Find user → validate role === "recruiter"
  3. getBuffer(req.file) → base64 logo
  4. axios.post(UPLOAD_SERVICE/api/utils/upload, { buffer })
     ──HTTP──→ Utils Service → Cloudinary upload → { url, public_id }
  5. Company.create({ name, description, website, logo: url, recruiter_id })
  6. res.json({ message: "Company created", company })

FRONTEND:
  → toast.success → refreshes company list
```

---

## 8. RECRUITER: POST JOB FLOW

```
FRONTEND: app/company/[id]/page.tsx
  → "Create Job" dialog → fills: title, description, salary, location, job_type, work_location, openings
  → POST → job_service/api/job/new (with Bearer token)

BACKEND: controllers/job.ts → createJob()
  1. Validate recruiter role
  2. Validate recruiter owns the company (Company.findOne + ownership check)
  3. Job.create({ ...fields, company_id, company_name, company_logo, posted_by_recruiter_id })
  4. res.json({ message: "Job created" })
```

---

## 9. RECRUITER: REVIEW APPLICATIONS FLOW

```
FRONTEND: app/jobs/[id]/page.tsx (or company/[id]/page.tsx)
  → Recruiter views job → GET → job_service/api/job/application/{jobId}

BACKEND: controllers/job.ts → getJobApplications()
  1. Verify recruiter owns the job
  2. Application.find({ job_id }).sort({ subscribed: -1 })
     → Premium (subscribed=true) applicants appear FIRST
  3. res.json(applications)

FRONTEND:
  → Renders applications with status dropdown
  → Recruiter changes status → PUT → job_service/api/job/application/update/{appId} { status: "Hired" }

BACKEND: controllers/job.ts → updateApplicationStatus()
  1. Ownership validation
  2. Application.findByIdAndUpdate(id, { status })
  3. publishToTopic("send-mail", { to: applicant.email, subject: "Application Update", html })
     ──Kafka──→ Utils Service → email notification to applicant
  4. res.json({ message: "Status updated" })
```

---

## 10. AI CAREER GUIDE FLOW

```
FRONTEND: components/carrer-guide.tsx
  → User adds skills as tags (local state array)
  → Clicks "Generate Career Guidance"
  → POST → utils_service/api/utils/career { skills: ["React", "Node.js"] }

BACKEND (Utils Service): routes.ts → /career handler
  1. Extract skills from req.body
  2. Build Gemini prompt with JSON schema instructions
  3. model.generateContent(prompt) → Gemini API call
  4. Parse JSON response → { summary, jobOptions, skillsToLearn, learningApproach }
  5. res.json(parsedResponse)

FRONTEND:
  → setResponse(data) → dialog switches from input phase to results phase
  → Renders: Career Summary, Recommended Paths, Skills to Learn, Learning Approach
```

---

## 11. AI RESUME ANALYZER FLOW

```
FRONTEND: components/resume-analyser.tsx
  → User uploads PDF via click-to-upload zone
  → handleFileSelect() validates: PDF only, ≤5MB
  → analyzeResume():
    → convertToBase64(file) → FileReader → base64 string
    → POST → utils_service/api/utils/resume-analyser { pdfBase64: base64 }

BACKEND (Utils Service): routes.ts → /resume-analyser handler
  1. Extract pdfBase64 from req.body
  2. Strip data URI prefix → get raw base64
  3. Build Gemini multimodal request:
     → inlineData: { mimeType: "application/pdf", data: base64 }
     → Prompt: "Analyze this resume for ATS compatibility, return JSON"
  4. model.generateContent([prompt, inlineData]) → Gemini reads the PDF visually
  5. Parse JSON → { atsScore, scoreBreakdown, suggestions, strengths, summary }
  6. res.json(parsedResponse)

FRONTEND:
  → Renders: ATS Score (0-100 with color), Breakdown (4 categories), Strengths, Suggestions
```

---

## 12. SUBSCRIPTION & PAYMENT FLOW

```
FRONTEND: app/subscribe/page.tsx
  → useRazorpay() [components/scriptLoader.tsx] → loads Razorpay Checkout.js
  → User clicks "Subscribe Now"
  → POST → payment_service/api/payment/checkout (with Bearer token)

BACKEND (Payment Service): controllers/payment.ts → checkOut()
  1. instance.orders.create({ amount: 11900, currency: "INR" }) → Razorpay API
  2. res.json({ order })

FRONTEND:
  → Receives order → creates Razorpay options object:
    { key: Razorpay_Key, amount, order_id, name: "JobNexus", handler: callback }
  → new window.Razorpay(options).open() → Razorpay modal appears
  → User enters card details → Razorpay processes payment
  → handler callback receives: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  → POST → payment_service/api/payment/verify { order_id, payment_id, signature }

BACKEND: controllers/payment.ts → paymentVerification()
  1. Construct expected signature:
     → body = razorpay_order_id + "|" + razorpay_payment_id
     → expectedSig = HMAC-SHA256(body, Razorpay_Secret).toString("hex")
  2. Compare expectedSig === razorpay_signature
  3. If match → valid payment:
     → Calculate subscription expiry: Date.now() + 30 days
     → User.findByIdAndUpdate(userId, { subscription: expiryDate })
     → Payment.create({ orderId, paymentId, userId, amount })
  4. res.json({ message: "Payment verified", paymentId })

FRONTEND:
  → router.push("/payment/success/{paymentId}")
  → app/payment/success/[id]/page.tsx → shows confirmation card
```

---

## 13. PROFILE MANAGEMENT FLOWS

### Update Profile Picture
```
account/components/info.tsx → click avatar → file input → updateProfilePic(formData)
  → AppContext → PUT user_service/api/user/update/pic (multipart)
  → controllers/user.ts → axios.post(UPLOAD_SERVICE/upload) → Cloudinary → update user.profile_pic
```

### Update Resume
```
account/components/info.tsx → click resume section → updateResume(formData)
  → Same flow as profile pic, updates user.resume
```

### Update Profile Info
```
account/components/info.tsx → edit dialog → updateUser(name, phone, bio)
  → AppContext → PUT user_service/api/user/update/profile
  → controllers/user.ts → User.findByIdAndUpdate()
```

### Add/Remove Skills
```
account/components/skills.tsx → input + add button → addSkill(skill)
  → AppContext → POST user_service/api/user/skill/add { skillName }
  → controllers/user.ts → User.findByIdAndUpdate({ $push: { skills: skillName } })

Remove: same but $pull operation
```

---

## 14. LOGOUT FLOW

```
FRONTEND: components/navbar.tsx → Logout button → logoutUser()
  → AppContext.logoutUser():
    → Cookies.set("token", "")    ← Clears JWT from cookie
    → setUser(null)
    → setIsAuth(false)
    → toast.success("Logged out")
  No API call needed — JWT is stateless. Server doesn't track sessions.
```

---

## 15. KAFKA EMAIL EVENT FLOW (Shared Across Services)

```
PRODUCER (Auth/User/Job Service):
  producer.ts
    → const kafka = new Kafka({ clientId, brokers: ["localhost:9092"] })
    → const producer = kafka.producer()
    → producer.connect()
    → publishToTopic(topic, message):
      → producer.send({ topic: "send-mail", messages: [{ value: JSON.stringify(message) }] })

KAFKA BROKER:
  → Receives message on "send-mail" topic
  → Stores in partition, assigns offset

CONSUMER (Utils Service):
  consumer.ts
    → const consumer = kafka.consumer({ groupId: "email-group" })
    → consumer.subscribe({ topic: "send-mail" })
    → consumer.run({ eachMessage: async ({ message }) => {
        const { to, subject, html } = JSON.parse(message.value)
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: Gmail_User, pass: Gmail_Pass }
        })
        transporter.sendMail({ from: Gmail_User, to, subject, html })
      }})
```

**Events that trigger emails**:
| Event | Producer | Email Content |
|-------|----------|--------------|
| Forgot Password | Auth Service | Reset link with JWT token |
| Job Application | User Service | Application confirmation with job title |
| Status Update (Hired/Rejected) | Job Service | Status notification to applicant |

---

## 16. AUTH MIDDLEWARE FLOW (isAuth)

Used by User, Job, and Payment services on protected routes:

```
middlewares/auth.ts → isAuth(req, res, next)
  1. Extract header: req.headers.authorization → "Bearer eyJhbG..."
  2. Split: token = header.split(" ")[1]
  3. jwt.verify(token, JWT_SEC) → decoded { id, iat, exp }
  4. req.userId = decoded.id
  5. next() → control passes to controller
  
  If no token → 401 "Login first"
  If invalid/expired → 401 "Invalid token"
```

---

## 17. FILE STRUCTURE → CONTROL FLOW MAP

```
Request arrives at service
  → app.ts (Express middleware: cors, json parser, cookie parser)
    → routes/*.ts (matches URL to controller function)
      → middlewares/auth.ts [if protected route] (JWT verification)
        → middlewares/multer.ts [if file upload] (file processing)
          → controllers/*.ts (business logic)
            → models/*.ts (MongoDB operations)
            → producer.ts [if email needed] (Kafka publish)
            → axios → Utils Service [if file upload] (Cloudinary)
          → res.json() (response sent)
    → Global error handler in app.ts (catches any thrown ErrorHandler)
```
