const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

  // Split emails by comma or semicolon and clean them up
  const recipients = to.split(/[;,]+/).map(email => email.trim()).filter(email => email);
  
  console.log(`Attempting to send emails to: ${recipients.join(", ")}`);

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

    // Send emails
    for (const recipient of recipients) {
      try {
        let mailOptions = {
          from: `"Harshil Sinha" <${process.env.EMAIL_USER}>`,
          to: recipient,
          subject,
          text,
        };

        if (resume) {
          mailOptions.attachments = [
            {
              filename: resume.originalname,
              path: resume.path
            }
          ];
        }

        await transporter.sendMail(mailOptions);
        results.successCount++;
        console.log(`Successfully sent to: ${recipient}`);
      } catch (err) {
        console.error(`Failed to send to ${recipient}:`, err.message);
        results.failures.push({ email: recipient, error: err.message });
      }
    }
    
    // Clean up: delete the uploaded file after sending all emails
    if (resume) {
      fs.unlinkSync(resume.path);
    }

    if (results.successCount === 0 && recipients.length > 0) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send any emails.", 
        details: results 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: `Sent ${results.successCount} of ${results.total} emails successfully.`, 
      details: results 
    });
  } catch (error) {
    console.error("Critical error in mail handler:", error);
    res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Job Mailer API is running...");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
