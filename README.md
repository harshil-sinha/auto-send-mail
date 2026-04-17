# JobMail - Automated Job Application Tool

A premium web application to automate sending job applications to HRs with PDF attachments.

## Project Structure
- `client/`: React frontend (Vite + Framer Motion + Lucide Icons)
- `server/`: Node.js backend (Express + Nodemailer + Multer)

## Getting Started

### 1. Setup Backend
1. Go to the `server` directory.
2. Create a `.env` file from the `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your details:
   - `EMAIL_USER`: Your Gmail address.
   - `EMAIL_PASS`: Your Gmail App Password (see below).

#### Gmail App Password Setup:
1. Enable **2-Step Verification** in your Google Account.
2. Search for **"App Passwords"** in your Google Account settings.
3. Select **"Mail"** as the app and **"Other"** as the device (name it "JobMail").
4. Copy the **16-character password** and paste it into `EMAIL_PASS` in your `.env`.

### 2. Run the App

#### Start Backend:
```bash
cd server
node index.js
```

#### Start Frontend:
```bash
cd client
npm run dev
```

## Features Implemented
- ✅ **Sleek UI**: Modern glassmorphism design with animations.
- ✅ **Email Sending**: Integration with Nodemailer.
- ✅ **PDF Support**: Upload and attach your resume automatically.
- ✅ **Form Validation**: Client-side and server-side safety.
- ✅ **Status Tracking**: Real-time feedback on email delivery.

## Next Steps
- [ ] **Bulk Send**: Send to multiple HRs at once.
- [ ] **Templates**: Save and reuse email body content.
- [ ] **History**: Track which companies you've applied to.
- [ ] **Delay**: Add random delays to avoid spam filters.
