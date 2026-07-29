# Campus Companion

Student registration, counterpart receipts, staff review with email confirmation,
and a class attendance calendar for social workers and class reps — built for
GitHub + Vercel + Vercel Blob.

## Stack
- **Next.js 14** (App Router) — deploys natively on Vercel
- **PostgreSQL + Prisma** — all data (students, staff, receipts, attendance)
- **Vercel Blob** — receipt file storage
- **Auth.js (NextAuth) credentials login** — email/password, forgot/reset password
- **Nodemailer (SMTP)** — automatic "receipt confirmed" emails, sent from whatever
  inbox your staff configures

## Roles
| Role | Created by | Can do |
|---|---|---|
| Student | Self-registers, picks year (2028/2027/2026) | Submit receipts, view own status |
| Staff | Admin | View all 3 batches, alphabetical roster, confirm/backdate receipts, comment + auto-email |
| Social worker | Admin (assigns them to ONE batch) | Assign the class rep for their batch, view/comment on attendance |
| Class rep | Social worker (flips a flag on a student) | Mark present/absent/excused + note, for their whole batch |
| Admin | Bootstrap (first one) → then other admins | Create staff/social worker/admin accounts, assign social workers to batches |

## 1. Local setup

```bash
npm install
cp .env.example .env   # fill in the values below
npx prisma db push     # creates tables in your database
npm run dev
```

## 2. Environment variables

Set these in `.env` locally and in Vercel → Project → Settings → Environment
Variables when you deploy.

- `DATABASE_URL` — a Postgres connection string. Easiest path: in your Vercel
  project, go to **Storage → Create Database → Postgres** (or connect Neon/
  Supabase) and copy the connection string it gives you.
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32` and paste the result.
- `NEXTAUTH_URL` — `http://localhost:3000` locally, your live URL in Vercel
  (e.g. `https://your-app.vercel.app`).
- `BLOB_READ_WRITE_TOKEN` — in Vercel → Storage → **Create → Blob**, then copy
  the token it generates.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` /
  `SMTP_FROM_NAME` — whoever manages the school inbox fills these in. For
  Gmail: turn on 2-Step Verification, then create an **App Password** at
  https://myaccount.google.com/apppasswords and use that as `SMTP_PASSWORD`
  (not the normal Gmail password).
- `ADMIN_BOOTSTRAP_KEY` — any long random string you make up. Used once to
  create the first admin account.
- `NEXT_PUBLIC_APP_URL` — same value as `NEXTAUTH_URL`, used inside emails.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Campus Companion"
gh repo create campus-companion --private --source=. --push
# (or create a repo on github.com and follow the "push an existing repo" instructions)
```

## 4. Deploy on Vercel

1. Go to vercel.com → **Add New → Project** → import your GitHub repo.
2. Add the environment variables from step 2.
3. Deploy. Vercel runs `prisma generate && next build` automatically
   (already wired up in `package.json`).
4. Once live, visit `https://your-app.vercel.app/admin/bootstrap` and create
   your first admin account using `ADMIN_BOOTSTRAP_KEY`.
5. Sign in as that admin, and create your staff and social worker accounts
   from the **Admin** dashboard. Assign each social worker to a batch.
6. Students can now register themselves from the homepage.

## Notes on how a few features work

- **Backdated receipts**: on the Staff dashboard, open a student, click
  **"+ Add receipt manually"**, and set any past date — useful for periods
  that happened before this system existed.
- **Confirmation emails**: when staff click **"Confirm & email student"**,
  the app sends the email immediately through the SMTP account configured in
  your environment variables. If sending fails (e.g. bad SMTP credentials),
  the receipt is still marked confirmed and the staff member sees a warning
  telling them to check the SMTP settings.
- **Attendance grid**: each cell is one student × one day. Class reps can set
  status and leave an excuse note; social workers can also set status and
  leave their own comment, viewable by both. Only one class rep is active
  per batch at a time — assigning a new one automatically un-assigns the old
  one.
- **Sound effects**: generated on the fly with the Web Audio API (no audio
  files to manage), so clicks, confirmations, and errors all get a distinct
  little chime.

## Project structure
```
prisma/schema.prisma       # all data models
src/app/api/…               # every backend route (auth, receipts, attendance, admin)
src/app/register, /login…   # public auth pages
src/app/student/dashboard   # Counterpart + Class Status tabs
src/app/staff/dashboard     # batch tabs → roster → receipt review
src/app/social-worker/…     # assign class rep + attendance grid
src/app/class-rep/…         # mark attendance for their batch
src/app/admin/…             # create accounts, assign social workers
src/components              # Navbar, Tabs, SoundButton, StatusBadge, AttendanceGrid
src/lib                     # prisma client, auth config, mailer, sound hook
```
