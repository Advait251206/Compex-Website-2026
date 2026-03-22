# Frontend - Registration System

React + TypeScript frontend for the Registration System with a beautiful 3D background using Spline.

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript (Vite)
- **Styling**: Vanilla CSS (Glassmorphism)
- **3D Graphics**: Spline (@splinetool/react-spline)
- **HTTP Client**: Axios
- **Routing**: React Router DOM (prepared)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env` file (optional if using default localhost:5000):

```bash
cp .env.example .env
```

Set `VITE_API_URL` if your backend is running on a different port.

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## ✨ Features

- **3D Background**: Interactive Spline scene
- **Glassmorphism UI**: Modern, translucent card design
- **Step-by-Step Flow**:
  1. **Registration**: Collects user details
  2. **OTP Verification**: Verifies email and phone OTPs
  3. **Success**: Confirmation screen
- **Real-time Feedback**: Loading states and error messages
- **Responsive**: Adapts to mobile and desktop screens

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── RegistrationForm.tsx   # Sign-up form
│   │   │   └── OTPVerification.tsx    # OTP input & timer
│   │   ├── Layout/
│   │   │   └── Background.tsx         # Spline integration
│   ├── services/
│   │   └── api.ts                     # API configuration
│   ├── App.tsx                        # Main logic & state
│   ├── index.css                      # Global styles
│   └── main.tsx                       # Entry point
```
