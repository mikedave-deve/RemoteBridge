# PremierRemoteBridge

Website, employee portal and admin portal. React 19 + Vite + Tailwind CSS on the front end; Node.js + Express + MongoDB on the back end.

## Run it locally

1. Install Node 20.12 or newer and have a MongoDB database (local install or a free MongoDB Atlas cluster).
2. Copy `.env.example` to `.env` and fill it in (see below).
3. Install and start:

```bash
npm install
npm run dev        # website on http://localhost:5173 and API on http://localhost:8787, together
```

The first time the server starts it creates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Log in at `/login` with those details to reach the admin portal at `/admin`.

## Environment (.env)

| Variable | What it is |
|---|---|
| `SITE_URL` | Public address of the site, used in email links. Locally `http://localhost:5173`. |
| `SESSION_SECRET` | 32+ random characters. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `MONGODB_URI`, `MONGODB_DB` | Database connection and name. |
| `ADMIN_EMAIL` | Receives every résumé, hiring-team message and new sign-up. |
| `ADMIN_PASSWORD`, `ADMIN_NAME` | Used once, to create the admin account. |
| `HOSTINGER_MAILBOX_ADDRESS`, `HOSTINGER_MAILBOX_PASSWORD`, `EMAIL_DISPLAY_NAME` | Hostinger mailbox that sends the emails (smtp.hostinger.com, SSL 465). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Any other SMTP provider instead of Hostinger. |

Without an email password, emails are saved as HTML files in `server/outbox/` instead of being sent, so you can preview them.

## What the back end does

- **Create account** (`/create-account`): saves the account as *pending*, emails the person that an admin will review it, and emails the admin with one-click Approve / Decline buttons.
- **Approval**: approving (from the email or the admin portal) emails the person that they can now log in.
- **Log in** (`/login`): works only for approved accounts with the correct password. Employees go to `/portal`, admins to `/admin`.
- **Submit résumé** (`/submit-resume`) and **Talk to our hiring team** (`/about#contact`): saved in the database and emailed to `ADMIN_EMAIL`, with the résumé attached.
- **Admin portal** (`/admin`): approvals, employee details (shown in their portal), the inbox of résumés and messages, and editable site text and employee announcements.

Security: scrypt-hashed passwords, HttpOnly session cookies, login lockout after 5 failed attempts, generic login errors, same-origin checks on every form, rate-limited public forms, file-type checks on uploads, and escaped user text in emails.

## Production

```bash
npm run build      # builds the website into dist/
npm start          # one server: API + website on PORT
```

Set `SITE_URL` to the real domain and serve it over HTTPS (session cookies are marked Secure in production).

## Project map

| Path | What |
|---|---|
| `src/pages`, `src/components` | Public website |
| `src/portal` | Employee portal (`/portal`) |
| `src/admin` | Admin portal (`/admin`) |
| `server/` | API: `routes/auth.js`, `routes/public.js`, `routes/admin.js`, `mail.js` (email templates), `security.js` |
