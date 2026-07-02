# EcoSmart AI — Backend API

The backend server for EcoSmart AI, a waste management platform that uses AI to identify, classify, and value recyclable waste. Built with **Node.js**, **Express**, and **MongoDB**.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **AI:** Google Gemini API (waste classification)
- **Email/SMS:** Brevo (Sendinblue)
- **Auth:** JWT (jsonwebtoken + bcryptjs)

---

## Features

- **Waste Classification** — AI-powered identification of waste type, category, recyclability, and estimated value
- **User Authentication** — Register, login, JWT-based session management
- **Password Reset** — OTP-based password reset via email or SMS
- **OTP Verification** — 6-digit code verification with expiry
- **Recycler Directory** — Browse and search recyclers by location
- **Dashboard** — User stats, scan history, and earnings tracking
- **Rate Limiting** — Protect sensitive endpoints from abuse
- **Security** — Password hashing, token-based auth, input validation

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB instance)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ecosmart-Ai-and-Innnovation/Ecosmart-Ai-Backend.git
cd Ecosmart-Ai-Backend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
BREVO_API_KEY=your_brevo_api_key
BREVO_SMTP_KEY=your_brevo_smtp_key
BREVO_SMTP_USER=your_brevo_smtp_login
```

### Run the Server

```bash
# Development
npm run dev

# The server starts at http://localhost:5000
```

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### OTP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/send` | Send OTP to email or phone |
| POST | `/api/otp/verify` | Verify OTP code |

### Waste Scanning

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/waste/scan` | Analyze waste (text or image) |
| GET | `/api/waste/history` | Get scan history |
| GET | `/api/waste/history/:id` | Get single scan result |

### Recyclers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recyclers` | List recyclers (optional `?state=` filter) |
| GET | `/api/recyclers/:id` | Get recycler details |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get user dashboard stats |

---

## Project Structure

```
src/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   ├── Otp.js             # OTP schema
│   ├── PasswordResetToken.js
│   ├── Recycler.js
│   ├── User.js
│   └── WasteScan.js
├── routes/
│   ├── auth.js            # Auth endpoints
│   ├── otp.js             # OTP endpoints
│   ├── recyclers.js
│   └── waste.js
├── services/
│   ├── brevo.js           # Email/SMS service
│   └── gemini.js          # AI classification service
└── server.js              # Entry point
```

---

## Built With

- **Google Gemini API** — AI-powered waste classification
- **Brevo** — Transactional email and SMS delivery
- **MongoDB Atlas** — Cloud database
