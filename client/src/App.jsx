import React, { useState } from "react";
import axios from "axios";
import {
  Send,
  FileText,
  Mail,
  User,
  Type,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:5000";

function App() {
  const [form, setForm] = useState({
    to: "",
    subject:
      "Angular / Full Stack Developer – Harshil Sinha | MEAN/MERN | 2+ Years Production Experience",
    text: `Dear Hiring Team,

I came across the Angular / Full Stack Developer opening and wanted to reach out — the role aligns closely with what I've been doing for the past two years.

I'm currently a Full Stack Engineer at Equality Healthcare, where I independently built and manage a Pharmacy-as-a-Service platform serving clients like 1MG, Bajaj Health, and Visit Health. My day-to-day spans Angular frontends, Node.js/Express backends, MongoDB, and third-party integrations — IVR systems, WhatsApp automation, and more recently, exploring AI-powered workflows.

What I think makes me a useful hire beyond just the stack:
→ I take full ownership — I've handled features from requirement discussions all the way to production deployment
→ I'm comfortable with ambiguity and can work without hand-holding
→ I'm actively learning where the industry is heading — LangChain, RAG pipelines, OpenAI integrations

I'm not locked to any city — open to on-site, hybrid, or remote, anywhere in India. Available to join in immediately.

I've attached my resume. Would love the chance to talk about what you're building.

Warm regards,
Harshil Sinha
harshilsinha17@gmail.com | +91-7004857014
LinkedIn: linkedin.com/in/harshil-sinha`,
  });
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const sendEmail = async (e) => {
    e.preventDefault();

    if (!form.to || !form.subject || !form.text) {
      setStatus({ type: "error", msg: "Please fill all required fields." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const formData = new FormData();
      formData.append("to", form.to);
      formData.append("subject", form.subject);
      formData.append("text", form.text);
      if (resume) {
        formData.append("resume", resume);
      }

      const response = await axios.post(`${API_URL}/send-email`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setStatus({ type: "success", msg: response.data.message });
        // We don't clear subject/body as they are defaults, but clear recipients
        setForm((prev) => ({ ...prev, to: "" }));
      } else {
        setStatus({
          type: "error",
          msg: response.data.message || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        type: "error",
        msg:
          error.response?.data?.message || "Failed to connect to the server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <motion.div
        className="card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <header>
          <h1>JobMail</h1>
          <p className="subtitle">Send personalized applications in bulk.</p>
        </header>

        <form onSubmit={sendEmail}>
          <div className="form-group">
            <label htmlFor="to">
              <Mail
                size={14}
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              />
              HR Email Addresses (comma separated)
            </label>
            <textarea
              id="to"
              name="to"
              placeholder="e.g. hr1@company.com, hr2@company.com"
              value={form.to}
              onChange={handleChange}
              style={{ minHeight: "60px" }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">
              <Type
                size={14}
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              />
              Subject Line
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="Subject"
              value={form.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="text">
              <User
                size={14}
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              />
              Message Content
            </label>
            <textarea
              id="text"
              name="text"
              placeholder="Message"
              value={form.text}
              onChange={handleChange}
              style={{ minHeight: "200px" }}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <FileText
                size={14}
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              />
              Resume / CV (PDF)
            </label>
            <label className="file-upload">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <div className="file-info">
                {resume ? (
                  <>
                    <CheckCircle size={16} color="#22c55e" /> {resume.name}
                  </>
                ) : (
                  <>Click to upload your resume</>
                )}
              </div>
            </label>
          </div>

          <button className="btn-send" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="loader" />
            ) : (
              <>
                <Send size={18} /> Send Application
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {status.msg && (
            <motion.div
              className={`status-msg ${status.type}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {status.type === "success" ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {status.msg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default App;
