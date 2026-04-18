import React, { useState, useEffect } from "react";
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
  History as HistoryIcon,
  PlusCircle,
  Clock,
  ExternalLink,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Background3D from "./components/Background3D";

const API_URL = "http://localhost:5000";

function App() {
  const [activeTab, setActiveTab] = useState("apply"); // 'apply' or 'history'
  const [history, setHistory] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
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
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [resume, setResume] = useState(null);
  const [hasPersistentResume, setHasPersistentResume] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
        checkResumeStatus();
        fetchHistory();
    }
  }, [activeTab, token]);


  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.post(`${API_URL}/login`, loginForm);
        if (response.data.success) {
            const { token, user } = response.data;
            setToken(token);
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setStatus({ type: '', msg: '' });
        }
    } catch (error) {
        setStatus({ type: 'error', msg: error.response?.data?.message || 'Login failed' });
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const checkResumeStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/resume-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasPersistentResume(response.data.exists);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    }
  };

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
          Authorization: `Bearer ${token}`
        },
      });

      if (response.data.success) {
        setStatus({ type: "success", msg: response.data.message });
        setForm((prev) => ({ ...prev, to: "" }));
        setResume(null);
        checkResumeStatus();
        fetchHistory(); // Update history counter immediately after success
        
        setTimeout(() => {
          setStatus({ type: "", msg: "" });
        }, 15000);
      } else {
        setStatus({
          type: "error",
          msg: response.data.message || "Something went wrong.",
        });
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
      setStatus({
        type: "error",
        msg: error.response?.data?.message || "Failed to connect to the server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Background3D />
      <motion.div
        className="card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {!token ? (
          <div className="login-view">
            <header>
              <h1>Login</h1>
              <p className="subtitle">Secure access to JobMail.</p>
            </header>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Email Address</label>
                <input
                  id="username"
                  name="username"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="username"
                  value={loginForm.username}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button className="btn-send" type="submit" disabled={loading}>
                {loading ? <Loader2 className="loader" /> : "Login"}
              </button>
              {status.msg && status.type === 'error' && (
                <div className="status-msg error" style={{ marginTop: '1rem' }}>
                    <AlertCircle size={16} /> {status.msg}
                </div>
              )}
            </form>
          </div>
        ) : (
          <>
            <header>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center", // Align items to center
                  paddingBottom: "1.5rem",
                  borderBottom: "1px solid var(--glass-border)",
                  marginBottom: "2rem"
                }}
              >
                <div>
                  <h1 style={{ marginBottom: '0.2rem' }}>JobMail</h1>
                  <div className="user-pill">
                    <User size={12} /> {user?.username}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div className="tabs">
                    <button
                      className={`tab-btn ${activeTab === "apply" ? "active" : ""}`}
                      onClick={() => setActiveTab("apply")}
                    >
                      <PlusCircle size={16} /> New Application
                    </button>
                    <button
                      className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                      onClick={() => setActiveTab("history")}
                    >
                      <HistoryIcon size={16} /> History ({history.length})
                    </button>
                  </div>
                  <button onClick={handleLogout} className="logout-btn-premium" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {activeTab === "apply" ? (
                <motion.div
                  key="apply"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 10, opacity: 0 }}
                >
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
                          ) : hasPersistentResume ? (
                            <>
                              <CheckCircle size={16} color="#6366f1" /> Resume already saved (Click to update)
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

                    <AnimatePresence>
                      {status.msg && (
                        <motion.div
                          className={`status-msg ${status.type}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ marginTop: '1rem' }}
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
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  className="history-view"
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -10, opacity: 0 }}
                >
                  {history.length === 0 ? (
                    <div className="empty-history">
                      <Clock size={48} color="var(--text-muted)" />
                      <p>No applications sent yet.</p>
                    </div>
                  ) : (
                    <div className="history-list">
                      {history.map((item, index) => (
                        <div className="history-item" key={index}>
                          <div className="history-main">
                            <div className="history-to">
                              <Mail size={14} /> {item.to}
                            </div>
                            <div className="history-subj">{item.subject}</div>
                            <div className="history-time">
                              <Clock size={12} />{" "}
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className={`history-status ${item.status}`}>
                            {item.status === "success" ? (
                              <CheckCircle size={16} />
                            ) : (
                              <AlertCircle size={16} />
                            )}
                            {item.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default App;
