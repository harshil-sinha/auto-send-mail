const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jobmailer";
const JWT_SECRET = process.env.JWT_SECRET || "harshil_secret_key_123";

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
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    seedUser();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Application Schema
const applicationSchema = new mongoose.Schema({
  to: String,
  subject: String,
  status: { type: String, enum: ['success', 'failed'] },
  error: String,
  timestamp: { type: Date, default: Date.now }
});

const Application = mongoose.model('Application', applicationSchema);

// Seed function for default user
const seedUser = async () => {
    const defaultUsername = 'harshilsinha17@gmail.com'.toLowerCase();
    const existingUser = await User.findOne({ username: defaultUsername });
    if (!existingUser) {
        const hashedPassword = await bcrypt.hash('Harshil#@123', 10);
        await new User({ username: defaultUsername, password: hashedPassword }).save();
        console.log(`Default user created: ${defaultUsername}`);
    }
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid or expired token" });
        req.user = user;
        next();
    });
};

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Auth Routes
app.get("/debug-db", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const specificUser = await User.findOne({ username: 'harshilsinha17@gmail.com' });
    res.json({ 
      totalUsers: userCount, 
      harshilExists: !!specificUser,
      mongoConnected: mongoose.connection.readyState === 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username: username.toLowerCase() }); // Ignore case
        if (!user) return res.status(404).json({ success: false, message: `User ${username} not found` });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid password" });

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { username: user.username } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

// Routes
app.post("/send-email", authenticateToken, upload.single('resume'), async (req, res) => {
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

        const persistentPath = path.join('uploads', 'persistent_resume.pdf');
        
        if (resume) {
          fs.copyFileSync(resume.path, persistentPath);
          mailOptions.attachments = [
            {
              filename: resume.originalname,
              path: resume.path
            }
          ];
        } else if (fs.existsSync(persistentPath)) {
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

app.get("/resume-status", authenticateToken, (req, res) => {
    const persistentPath = path.join('uploads', 'persistent_resume.pdf');
    res.json({ exists: fs.existsSync(persistentPath) });
});

app.get("/history", authenticateToken, async (req, res) => {
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
