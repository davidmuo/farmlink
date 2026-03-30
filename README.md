# FarmLink

FarmLink is a full-stack fresh produce marketplace built for smallholder farmers and institutional buyers in Nigeria. It digitises the entire supply chain — from a buyer posting a purchase demand to a farmer committing to supply, delivery tracking, payments, dispute resolution, and post-trade reviews — while keeping accessibility in mind through USSD and SMS support for farmers without smartphones.

---

## Features

**For Buyers**
- Post produce demands (crop, quantity, price per unit, delivery window)
- Review and accept or reject farmer commitments
- Track delivery status in real time
- Leave reviews for farmers after completed orders
- In-app messaging with farmers
- Email notifications on new commitments

**For Farmers**
- Browse open buyer demands and filter by crop, price, and delivery timeline
- Commit to supply (full or partial quantity)
- Track accepted commitments through to delivery
- AI farming assistant — ask questions about crops, pests, diseases, and soil health
- USSD simulator (`*384*1#`) for feature-phone access
- SMS inbox for accepting/cancelling orders via text
- Leave reviews for buyers
- Raise disputes on commitments
- Email notifications on acceptance/rejection

**For Admins**
- Platform overview with live stats
- Full audit log of every action
- Market price management per crop
- Farmer verification
- Dispute resolution with optional resolution notes
- User management — ban or delete accounts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL (hosted on Supabase) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI Assistant | Groq API (Llama 3.3 70B) |
| Email | Resend |
| SMS / USSD | Africa's Talking |
| Deployment | Render (backend) · Vercel (frontend) |

---

## Project Structure

```
farmlink/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Demo data seeder
│   └── src/
│       ├── app.ts              # Express app entry point
│       ├── middleware/
│       │   └── auth.ts         # JWT authentication + ban check
│       ├── lib/
│       │   └── email.ts        # Resend email helpers
│       └── routes/
│           ├── auth.ts
│           ├── demands.ts
│           ├── commitments.ts
│           ├── crops.ts
│           ├── farmRecords.ts
│           ├── notifications.ts
│           ├── messages.ts
│           ├── reviews.ts
│           ├── disputes.ts
│           ├── marketPrices.ts
│           ├── ussd.ts
│           ├── sms.ts
│           ├── ai.ts
│           └── admin.ts
└── frontend/
    └── src/
        ├── pages/
        │   ├── farmer/         # Farmer-specific pages
        │   ├── buyer/          # Buyer-specific pages
        │   └── admin/          # Admin-specific pages
        ├── components/         # Shared UI components
        ├── context/            # Auth, Notifications context
        └── lib/
            └── api.ts          # Axios instance
```

---

## Prerequisites

Make sure you have the following installed before starting:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- A [Supabase](https://supabase.com/) account (free tier is fine) for the PostgreSQL database
- A [Groq](https://console.groq.com/) account for the AI assistant (free)
- A [Resend](https://resend.com/) account for email notifications (free tier)

---

## Setup — Step by Step

### 1. Clone the repository

```bash
git clone https://github.com/davidmuo/farmlink.git
cd farmlink
```

---

### 2. Set up the database (Supabase)

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Once the project is ready, go to **Project Settings → Database**
3. Scroll down to **Connection string** and copy:
   - The **Transaction pooler** URI (port `6543`) — this is your `DATABASE_URL`
   - The **Direct connection** URI (port `5432`) — this is your `DIRECT_URL`

---

### 3. Configure backend environment variables

Navigate into the backend folder and create a `.env` file:

```bash
cd backend
```

Create a file called `.env` with the following content — replace the placeholder values with your own:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
JWT_SECRET="replace-with-a-long-random-secret-string"
PORT=3001
GROQ_API_KEY="your-groq-api-key"
RESEND_API_KEY="your-resend-api-key"
AT_API_KEY="your-africastalking-api-key"
AT_USERNAME="sandbox"
```

**Where to get each key:**

| Key | Where to get it |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase → Project Settings → Database → Connection string |
| `JWT_SECRET` | Any random string (e.g. run `openssl rand -hex 32` in your terminal) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com/) → API Keys → Create API Key |
| `RESEND_API_KEY` | [resend.com](https://resend.com/) → API Keys → Create API Key |
| `AT_API_KEY` | [africastalking.com](https://africastalking.com/) → Sandbox → Settings → API Key |

---

### 4. Install backend dependencies

```bash
# Still inside the backend folder
npm install
```

---

### 5. Push the database schema

This creates all the tables in your Supabase database:

```bash
npx prisma db push
```

---

### 6. Seed demo data

This creates demo accounts for buyers, farmers, and an admin so you can explore the app immediately:

```bash
npx prisma db seed
```

After running this you will have the following accounts (password for all: `password123`):

| Role | Email |
|---|---|
| Admin | admin@demo.com |
| Buyer | buyer@demo.com |
| Buyer | buyer2@demo.com |
| Buyer | buyer3@demo.com |
| Buyer | buyer4@demo.com |
| Farmer | farmer@demo.com |
| Farmer | farmer2@demo.com |
| Farmer | farmer3@demo.com |

---

### 7. Start the backend server

```bash
npm run dev
```

The API will start at `http://localhost:3001`. You should see:

```
FarmLink API running on http://localhost:3001
```

---

### 8. Configure frontend environment variables

Open a new terminal, navigate to the frontend folder, and create a `.env` file:

```bash
cd ../frontend
```

Create a file called `.env`:

```env
VITE_API_URL=http://localhost:3001
```

---

### 9. Install frontend dependencies

```bash
npm install
```

---

### 10. Start the frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Running the full app

You need **two terminals** running simultaneously:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser and sign in with any of the demo accounts listed above.

---

## Demo Accounts

All demo accounts use the password: **`password123`**

| Role | Email | Details |
|---|---|---|
| Admin | admin@demo.com | Full platform access |
| Buyer | buyer@demo.com | Emeka Adeyemi / Eko Hotels & Suites |
| Buyer | buyer2@demo.com | Ngozi Okonkwo / Chicken Republic VI |
| Buyer | buyer3@demo.com | Dr. Segun Bello / Lagos Food Bank |
| Buyer | buyer4@demo.com | Folake Adesanya / Chrisland Schools |
| Farmer | farmer@demo.com | Emeka Okafor / Ifo, Ogun State (8.5 ha) |
| Farmer | farmer2@demo.com | Amaka Nwosu / Ibadan, Oyo State (12 ha) |
| Farmer | farmer3@demo.com | Tunde Adeyemi / Sagamu, Ogun State (6 ha) |

---

## Live Demo

| | URL |
|---|---|
| Frontend | https://farmlink-nine-tau.vercel.app |
| Backend API | https://farmlink-2co1.onrender.com |

> Note: The backend is hosted on Render's free tier and may take up to 50 seconds to wake up after a period of inactivity.

---

## Available Scripts

**Backend (`/backend`)**

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run the compiled production build |
| `npx prisma db push` | Sync schema changes to the database |
| `npx prisma db seed` | Seed demo data |
| `npx prisma studio` | Open Prisma Studio (visual DB browser) |

**Frontend (`/frontend`)**

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
