# WhatsNext? - Enterprise Secure Task Management System

**WhatsNext?** is a high-performance, secure task management ecosystem designed toe collaboration while maintaining uncompromising security. This project demonstrates a **"Security-by-Design"** philosophy, where defense mechanisms are woven into the core architecture rather than applied as an afterthought.

Built as an enterprise-ready Node.js application, it adheres to **Defense-in-Depth** principles and **OWASP ASVS** standards.

---
🎓 **Academic Context:** Developed as a capstone project for the *Secure Software Development Project Assignment*.


![Project Badge](https://img.shields.io/badge/Security-OWASP_ASVS_V4-blue)
![Project Badge](https://img.shields.io/badge/Status-Complete-green)



## 🛡️ Security Features & Mitigations

### 1. Authentication & Session Management (OWASP A2)
- **Strict Password Policy:** Enforces 8+ characters with uppercase, lowercase, numbers, and special characters.
- **Secure Hashing:** All passwords are hashed using **Bcrypt** with 12 salt rounds.
- **Session Security:** Implements `express-session` with `HttpOnly`, `SameSite: Lax`, and `Secure` cookie flags.
- **Anti-CSRF:** Synchronizer Token Pattern (STP) implemented on all state-changing routes (POST/DELETE).

### 2. Injection & XSS Protection (OWASP A1/A3)
- **SQL Injection:** Fully mitigated using **Sequelize ORM** with parameterized queries.
- **Cross-Site Scripting (XSS):** Context-aware output encoding using EJS and strict input sanitization via `express-validator`.
- **Security Headers:** Implements **Helmet.js** to set secure HTTP headers (CSP, HSTS, X-Frame-Options).

### 3. Broken Access Control & IDOR (OWASP A5)
- **RBAC:** Strict Role-Based Access Control differentiating `Admin` and `User` privileges.
- **Principle of Least Privilege (PoLP):** Strict data isolation where even Admins are blocked from downloading user-specific attachments.
- **IDOR Prevention:** Server-side ownership verification ensures users can only access their own data and attachments.
- **Rate Limiting:** Protects authentication endpoints from brute-force attacks.

### 4. Secure File Handling
- **Multer Integration:** Restricts uploads to 10MB and validates MIME types (PDF, JPG, PNG).
- **UUID Renaming:** All files are renamed to a randomized UUID to prevent filename enumeration and directory traversal.
- **Isolated Storage:** Files are stored outside the public web root to prevent direct execution.

### 5. Advanced UI & Functional Features
- **Dashboard Analytics:** Visual statistics showing Total, Completed, and Pending tasks.
- **Task Priorities:** Categorization of tasks into High, Medium, and Low priorities with visual badges.
- **Success Notifications:** Secure flash-message system for real-time user feedback.
- **Responsive Fluid UI:** Modern Enterprise design using Inter typography and responsive containers.

### 6. Logging & Auditability (OWASP A9)
- **Audit Logging:** Secure logging of all authentication events, administrative changes, and security failures.
- **Admin Dashboard:** Real-time user management and audit log viewing for administrators.

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm**

### Step 1: Clone the Repository
```bash
git clone https://github.com/N3k0sint/WhatsNext.git
cd WhatsNext
```

### Step 2: Install Dependencies
```bash
# Install secure dependencies
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory and add a strong session secret:
```bash
SESSION_SECRET=your_super_secret_random_string_here
PORT=3000
```
*(A `.env.example` file is provided as a template)*

### Step 4: Run the Application
```bash
# Start the production-ready server
npm start
```
The application will be accessible at: `http://localhost:3000`

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** SQLite (Relational) with Sequelize ORM
- **Security:** Bcrypt, Helmet, Csrf-sync, Express-Validator, Winston
- **UI:** EJS, Bootstrap 5 (Custom "Fluid Professional" Theme)

## 📁 Project Structure
- `/config` - Database connection and settings
- `/middleware` - Custom security & auth middleware
- `/models` - Secure data models
- `/public` - Static assets (CSS/JS)
- `/routes` - Controller logic and route handling
- `/uploads` - Secure file storage (Ignored by Git)
- `/utils` - Logging and security utility scripts
- `/views` - EJS templates with secure output encoding

---

## 📸 System Preview & Screenshots

### 1. Workspace Dashboard Overview
Below is the core authenticated workspace dashboard, featuring live workflow metric calculations, task priority segregation, and secure file attachment components.
![Workspace Dashboard Overview](path/to/screenshot_dashboard.png)
*Figure 1: Main task tracking interface (`/tasks`) showing status rows, priority badges, and multi-part upload boundaries.*

### 2. Security Audit Logs & Admin Panel
The central administrative portal manages roles, reviews active user accounts, and tracks security audit logs to enforce total system accountability.
![Security Audit Logs and Admin Control](path/to/screenshot_admin.png)
*Figure 2: Real-time user management console and security event stream (`/admin`) tracking authorization cycles.*

### 3. Account Settings & Password Complexity Controls
The profile management view handles credential updates via strict password rule requirements and client-side modal confirmations.
![Profile Settings and Password Update](path/to/screenshot_profile.png)
*Figure 3: Self-service identity workspace (`/profile`) demonstrating runtime complexity enforcement and anti-CSRF confirmations.*

### 4. Suppressed Information Error Boundary
When errors occur, stack traces are withheld from client views to protect internal system intelligence from threat actors.
![Suppressed Information Error Boundary](path/to/screenshot_error.png)
*Figure 4: Secure custom error view (`error.ejs`) enforcing structural error masking parameters.*

---
This is for Project SSDev
