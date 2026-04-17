const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Setup storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Application Schema
const applicationSchema = new mongoose.Schema({
  to: String,
  subject: String,
  status: { type: String, enum: ['success', 'failed'] },
  error: String,
  timestamp: { type: Date, default: Date.now }
});

const Application = mongoose.model('Application', applicationSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Routes
app.post("/send-email", upload.single('resume'), async (req, res) => {
  const { to, subject, text } = req.body;
  const resume = req.file;

  if (!to) {
    return res.status(400).json({ success: false, message: "Recipient email is required." });
  }

  const recipients = to.split(/[;,]+/).map(email => email.trim()).filter(email => email);
  
  const results = {
    total: recipients.length,
    successCount: 0,
    failures: []
  };

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const recipient of recipients) {
      try {
        let mailOptions = {
          from: `"Harshil Sinha" <${process.env.EMAIL_USER}>`,
          to: recipient,
          subject,
          text,
        };

        // If a new resume is uploaded, use it. Otherwise, look for a saved one.
        const persistentPath = path.join('uploads', 'persistent_resume.pdf');
        
        if (resume) {
          // Save a copy as the persistent resume for future use
          fs.copyFileSync(resume.path, persistentPath);
          mailOptions.attachments = [
            {
              filename: resume.originalname,
              path: resume.path
            }
          ];
        } else if (fs.existsSync(persistentPath)) {
          // Use the saved resume
          mailOptions.attachments = [
            {
              filename: 'Harshil_Sinha_Resume.pdf',
              path: persistentPath
            }
          ];
        }

        await transporter.sendMail(mailOptions);
        results.successCount++;
        
        await new Application({ to: recipient, subject, status: 'success' }).save();
      } catch (err) {
        results.failures.push({ email: recipient, error: err.message });
        await new Application({ to: recipient, subject, status: 'failed', error: err.message }).save();
      }
    }
    
    // Clean up temporary upload only
    if (resume) {
      fs.unlinkSync(resume.path);
    }

    res.status(200).json({ 
      success: true, 
      message: `Sent ${results.successCount} of ${results.total} emails successfully.`, 
      details: results 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
});

app.get("/resume-status", (req, res) => {
    const persistentPath = path.join('uploads', 'persistent_resume.pdf');
    res.json({ exists: fs.existsSync(persistentPath) });
});

app.get("/history", async (req, res) => {
  try {
    const history = await Application.find().sort({ timestamp: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

app.get("/", (req, res) => {
  res.send("Job Mailer API is running...");
});

app.listen(port, () => {
  // console.log(`Server running on http://localhost:${port}`);
});
