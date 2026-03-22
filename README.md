# 🎓 CapstoneDesk: Advanced Project Management System 🚀

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Made with](https://img.shields.io/badge/Made%20with-React%20%26%20Node-blue)
![State](https://img.shields.io/badge/Status-Beta-purple)

A **comprehensive, AI-powered full-stack web application** designed to streamline university project group registration, file submission, WebRTC video calling, supervisor assignment, and administrative management.

This system replaces manual workflows with a smart, fully digital solution featuring real-time communication, AI chatbots, and Excel data processing.

---

## ✨ Key Features

### 🧑‍🎓 Student Portal
- **Group Registration:** Register teams of exactly 5 members. Validation ensures no duplicate registrations.
- **AI Mentor Chatbot:** A Gemini-powered AI assistant that answers project-related queries and provides guidance.
- **Project Submissions:** Drag-and-drop Cloudinary uploading for PPTs and PDFs (up to 10MB).
- **Live Video Calls:** Start direct WebRTC video calls with assigned supervisors (powered by Socket.IO signaling).

### 👨‍🏫 Supervisor Portal
- **Group Management:** View assigned groups, student details, and enter milestone review marks.
- **AI PDF Summarizer:** One-click Gemini AI summaries for submitted student documents, saving countless reading hours.
- **Video Conferencing:** Participate in live, browser-to-browser WebRTC video calls with student groups.
- **Profile Security:** Secure password management and customizable group-load preferences.

### ⚙️ Admin Panel
- **Bulk Import (Excel):** Instantly upload `.xlsx` files to onboard hundreds of Students and Supervisors.
- **Smart Assignment Engine:** Run the auto-assignment algorithm to perfectly balance supervisor loads and group needs.
- **Entity Management:** Manually create, delete (with cascade data wipe), and oversee all supervisors and groups.
- **Sentry Health Tracking:** Comprehensive production error tracking and rate-limiting security.

---

## 💻 Tech Stack

| Category        | Technology                                |
|-----------------|--------------------------------------------|
| 🎨 **Frontend** | React.js (Vite), Tailwind CSS, Socket.IO Client |
| ⚙️ **Backend**  | Node.js, Express.js, Socket.IO, Multer, Sentry |
| 🗄️ **Database** | PostgreSQL (NeonDB), node-postgres (`pg`)       |
| 🤖 **AI & Media** | Google Gemini API (`@google/generative-ai`), Cloudinary |
| 🔑 **Security** | JWT (JSON Web Tokens), Bcryptjs, Express-Rate-Limit |
| 🔄 **DevOps**   | GitHub Actions (CI build/lint pipeline)    |

---

## 📂 Project Structure

```bash
📦 CapstoneDesk
 ┣ 📂 backend
 ┃ ┣ 📂 routes         # Express API routes (groups, supervisors, admin, chatbot, videoCall...)
 ┃ ┣ 📂 middleware     # JWT Auth & Rate Limiters
 ┃ ┣ 📜 db.js          # PostgreSQL connection pool
 ┃ ┣ 📜 index.js       # Main server & Socket.IO initialization
 ┃ ┣ 📜 db_schema.sql  # Run this in your DB to create all tables
 ┃ ┗ 📜 .env           # (Must be created by user)
 ┣ 📂 frontend
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 components   # React UI elements (Dashboards, AIChatbot, VideoCall, FileUpload)
 ┃ ┃ ┣ 📜 App.jsx      # React Router declarations
 ┃ ┃ ┣ 📜 index.css    # Tailwind CSS & custom glassmorphism styles
 ┃ ┃ ┗ 📜 api.js       # Axios instance with centralized JWT interceptors
 ┃ ┗ 📜 .env           # Frontend environment vars
 ┗ 📜 .github/workflows/ci.yml # CI setup
```

---

## 🛠️ Getting Started

Follow these instructions to set up and run the project locally.

### ✅ Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Git](https://git-scm.com/)
- PostgreSQL Database (e.g., [Neon](https://neon.tech/) or [Supabase](https://supabase.com/))
- Api Keys for: [Google Gemini AI](https://aistudio.google.com/), [Cloudinary](https://cloudinary.com/), and [Sentry](https://sentry.io/).

---

### 🚀 Installation & Setup

#### 1️⃣ Clone the Repository 📂
```bash
https://github.com/GitH22Ash/CapstoneDesk.git
cd CapstoneDesk
```

---

#### 2️⃣ Backend Setup ⚙️

Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder and configure:
```env
# Database
DATABASE_URL="postgres://postgres:[YOUR-PASSWORD]@db.example.co:5432/neondb"

# Auth
JWT_SECRET="generate_a_strong_secret_string"
ADMIN_EMAIL="admin@university.edu"
ADMIN_PASSWORD="supersecretpassword"

# Google Gemini API
GEMINI_API_KEY="your_google_gemini_api_key"

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Error Tracking (Optional but recommended)
SENTRY_DSN="your_sentry_dsn_url"
```

> ⚠️ **Run the Database Schema:** Execute the SQL statements inside `backend/db_schema.sql` on your PostgreSQL provider to correctly build the tables (`supervisors`, `students`, `project_groups`, `submissions`, `video_rooms`, etc.).

Start the backend server:
```bash
npm run dev
```
> Server runs at 👉 `http://localhost:5000`

---

#### 3️⃣ Frontend Setup 🖥️

Open a new terminal tab and navigate to the frontend:
```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` folder:
```env
VITE_BACKEND_URL="http://localhost:5000"
```

Start the Vite development server:
```bash
npm run dev
```

> Frontend runs at 👉 `http://localhost:5173`

---

### 🎉 Usage Flow

1. **Admin Init:** Log into the Admin panel (`/admin/login`) utilizing the `.env` credentials. Upload students and supervisors via Excel using the new Bulk Import feature.
2. **Student Signup:** Students go to the landing page and register a 5-member group. They generate a custom group password for future logins.
3. **Admin Assortment:** Admin clicks "Assign Groups" to automatically distribute student teams balancing supervisor loads.
4. **Collaboration:** Students log into their dashboard. They can chat with the AI Mentor, drop files into the submission portal, or start a live Video call with their supervisor.
5. **Supervisor Review:** Supervisors log in to see submissions, trigger AI-summaries on long PDFs, conduct video calls, and enter passing marks.

---

## 🎨 UI & Aesthetics
The project leverages a heavily customized **Glassmorphism design language**, employing deep, dynamic gradients (`#3b82f6` to `#06b6d4`), translucent frosted-glass modal cards, subtle border opacities, and fluid keyframe animations (fade-in, scale up, hover glow effects) designed carefully in pure CSS paired with Tailwind utilities.

## 🤝 Contributing
Contributions are always welcome! Please create a pull request with detailed commit references describing your changes.

## 📄 License
This project is licensed under the MIT License.
