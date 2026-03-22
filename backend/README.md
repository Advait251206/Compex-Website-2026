# Compex Registration Backend

Shared backend API for Compex Registration admin and user websites.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:

- `MONGODB_URI`: MongoDB connection string
- `CLERK_SECRET_KEY`: Clerk secret key for admin auth
- `BREVO_API_KEY`: Brevo API key for emails
- `JWT_SECRET`: Secret for token signing
- `FRONTEND_USER_URL`: User frontend URL
- `FRONTEND_ADMIN_URL`: Admin frontend URL

4. Run development server:

```bash
npm run dev
```

## API Endpoints

### User Routes (Public)

- `POST /api/user/register` - Submit registration and send OTP
- `POST /api/user/verify-otp` - Verify OTP and create ticket
- `POST /api/user/resend-otp` - Resend OTP

### Admin Routes (Clerk Protected)

- `POST /api/admin/validate-ticket` - Validate scanned QR code
- `POST /api/admin/checkin` - Mark ticket as checked in
- `GET /api/admin/tickets` - Get all tickets

## Features

- ✅ One email = one ticket validation
- ✅ Email verification via OTP (10-minute expiry)
- ✅ QR code generation
- ✅ PDF ticket generation
- ✅ Email delivery (Brevo)
- ✅ Clerk authentication for admin
- ✅ Rate limiting
- ✅ CORS configured for dual frontends
