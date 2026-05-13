# WhatsNext? - Enterprise Secure Task Management System

WhatsNext? is a simple, secure web-based task management application designed to help users organize their daily chores and schedules. The goal of this project isn't just to make a "to-do list," but to build a functional system where security is integrated into the code from day one, rather than added as an afterthought.

![Project Badge](https://img.shields.io/badge/Security-OWASP_ASVS_V4-blue)
![Project Badge](https://img.shields.io/badge/Status-Complete-green)

A professional, microservice-ready Node.js web application designed with **Defense-in-Depth** and **OWASP-compliant** security practices. 

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

## 🔒 Security Auditing & Verification

To verify that the system is correctly hashing passwords and following **OWASP ASVS** standards, you can run the included security audit script:

```bash
# Direct database audit of password hashes
node verify_passwords.js
```

This script will query the SQLite database and confirm that no plaintext passwords exist and that all users are secured using valid **Bcrypt** hashes.
