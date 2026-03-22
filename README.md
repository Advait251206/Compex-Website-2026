<div align="center">
  <h1>🚀 Compex 2026 Event Registration System</h1>
  <p>
    I created this comprehensive, full-stack event management ecosystem for <b>Compex 2026</b>, which is the biggest tech fair in Central India, during my one-month internship period. It is designed for seamless attendee registration, real-time administration, and engaging live event features.
  </p>
</div>

<div align="center">

[![Node JS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express JS](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)

<br />

  <a href="#-frontend_user">
    <img src="frontend_user/public/Landing%20Page.png?v=2" alt="Compex 2026 User Landing Page" width="90%" />
  </a>
  <p><em>The immersive Sci-Fi themed public portal, bringing aesthetics and speed together.</em></p>

</div>

---

## ✨ Why I Built This

> **Compex 2026 required a platform as advanced as the tech fair itself.**  
> Taking ownership during my one-month internship, I engineered this system from the ground up to guarantee a zero-friction attendee experience, highly secure administration, and visual excellence. Every piece of the architecture was chosen to ensure blazing-fast load times and real-time reliability.

---

## 🌟 Key Features

| 💎 Feature                    | 📖 What It Means                                                                                                    |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| 🛡 **Role-Based Access**      | Strict separation between public users and admin capabilities, ensuring secure data operations.                     |
| 📲 **Live Check-In**          | Admins can manually check users in via the dashboard or seamlessly scan QR codes at the door.                       |
| 🎲 **Interactive Lucky Draw** | A standalone 3D application designed to hype up the crowd and transparently pick winners from checked-in attendees. |
| 🧹 **Self-Healing DB**        | Automated scripts that continuously monitor and clean up duplicate or malformed registration data.                  |
| ✉️ **Dual-Channel Auth**      | Attendees verify their identity via Email or Phone (OTP) before receiving their unique digital Entry Pass.          |

---

## 🏗 Project Architecture

This repository is structured as a monorepo containing four robust applications. Click below to expand details about each core component:

<details>
<summary><b>1. 🖥️ backend (Node.js & Express)</b></summary>
<br>
The central nervous system of the platform.
<ul>
<li><b>Authentication:</b> Secure admin access via Clerk.</li>
<li><b>Database:</b> MongoDB integration for storing users, tickets, and event data.</li>
<li><b>Email Service:</b> Automated ticketing mailing via <b>Brevo</b> (formerly Sendinblue).</li>
<li><b>SMS Service:</b> High-speed OTP and notification delivery via Pinnacle (HTTP API).</li>
<li><b>API:</b> RESTful endpoints for registration, validation, and analytics.</li>
</ul>
</details>

<details id="-frontend_user">
<summary><b>2. 🌐 frontend_user (React & Vite)</b></summary>
<br>
The public-facing portal for attendees.
<ul>
<li><b>Features:</b> Event information, seamless registration flow, and OTP verification (Email & WhatsApp/SMS).</li>
<li><b>Design:</b> Immersive "Sci-Fi" aesthetic using <b>React Three Fiber</b> for engaging 3D backgrounds.</li>
<li><b>Ticket System:</b> Dynamic QR code generation and PDF download capability straight from the browser.</li>
</ul>
</details>

<details>
<summary><b>3. 🛠️ frontend_admin (React & Vite)</b></summary>
<br>
The command center for event organizers.
<ul>
<li><b>Dashboard:</b> Real-time stats on registrations, check-ins, and pending verifications.</li>
<li><b>Scanner:</b> Built-in QR code scanner for instant ticket validation at entry points.</li>
<li><b>Database Access:</b> Searchable table of all attendees with manual <b>Check-In/Check-Out</b> toggle and hourly time span filters.</li>
<li><b>Security:</b> Protected routes ensuring only authorized personnel can access sensitive insights.</li>
</ul>
</details>

<details>
<summary><b>4. 🎲 frontend_lucky_draw (React & Vite)</b></summary>
<br>
A visual spectacle for live events.
<ul>
<li><b>Purpose:</b> Randomly select winners from a pool of candidates on a main stage screen.</li>
<li><b>Mode:</b> File Upload (Excel/CSV/JSON) for flexible, offline-capable draws.</li>
<li><b>Visuals:</b> High-impact 3D visuals with canvas confetti celebrations and privacy-focused winner displays.</li>
</ul>
</details>

---

## ⚙️ Configuration & Environment

To run this project locally, you need to configure Environment Variables in `.env` files for each container. Expand to see required keys.

<details>
<summary><b>Backend (<code>/backend/.env</code>)</b></summary>
<br>

| Variable                  | Description                               |
| :------------------------ | :---------------------------------------- |
| `PORT`                    | Server port (e.g., 5000)                  |
| `MONGO_URI`               | MongoDB connection string                 |
| `CLERK_SECRET_KEY`        | Secret key for local Clerk Authentication |
| `CLERK_WEBHOOK_SECRET`    | Webhook secret for processing user events |
| `BREVO_API_KEY`           | API Key for sending emails reliably       |
| `SMS_API_KEY`             | Credential for Pinnacle SMS service       |
| `FRONTEND_USER_URL`       | CORS allowed origin for the user app      |
| `FRONTEND_ADMIN_URL`      | CORS allowed origin for the admin app     |
| `FRONTEND_LUCKY_DRAW_URL` | CORS allowed origin for lucky draw app    |
| `JWT_SECRET`              | Secret for securing tokens                |

</details>

<details>
<summary><b>Frontend User (<code>/frontend_user/.env</code>)</b></summary>
<br>

- `VITE_API_URL`: URL of the deployed backend used for all API calls.

</details>

<details>
<summary><b>Frontend Admin (<code>/frontend_admin/.env</code>)</b></summary>
<br>

- `VITE_API_URL`: URL of the deployed backend.
- `VITE_CLERK_PUBLISHABLE_KEY`: Public key for the Clerk Authentication UI.

</details>

<details>
<summary><b>Frontend Lucky Draw (<code>/frontend_lucky_draw/.env</code>)</b></summary>
<br>

- `VITE_API_URL`: URL of the deployed backend.

</details>

---

## 👨‍💻 Made By

| Developer               | Contact                                                  | GitHub                                           |
| :---------------------- | :------------------------------------------------------- | :----------------------------------------------- |
| **Advait Kawale**       | ✉️ advaitkawale@gmail.com <br> 📞 +91 93594 19281        | [@Advait251206](https://github.com/Advait251206) |
| **Pravesh Shrivastava** | ✉️ praveshpshrivastava@gmail.com <br> 📞 +91 90217 93584 | [@Pravesh-21](https://github.com/Pravesh-21)     |
