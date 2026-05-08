import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Activity, Bell, Radio, Clock, LogOut, Lock, Users, Trash2, Plus, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

//const API = "http://127.0.0.1:8000";
const API = "http://192.168.11.148:8000";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return isMobile;
};

function generatePDF(stats, events, byDay) {
  const doc = new jsPDF();
  const now = new Date().toLocaleString();

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(67, 97, 238);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("IoT PIR Dashboard", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Rapport généré le : ${now}`, 14, 28);

  // ── Stats ────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Statistiques Générales", 14, 50);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setFillColor(240, 244, 255);
  doc.rect(14, 55, 85, 25, "F");
  doc.rect(110, 55, 85, 25, "F");

  doc.setTextColor(67, 97, 238);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${stats.total || 0}`, 56, 68, { align: "center" });
  doc.text(`${stats.today || 0}`, 152, 68, { align: "center" });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Total Détections", 56, 75, { align: "center" });
  doc.text("Détections Aujourd'hui", 152, 75, { align: "center" });

  // ── Last seen ────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Dernière détection : ${stats.last_seen ? new Date(stats.last_seen).toLocaleString() : "—"}`, 14, 92);

  // ── Daily Stats Table ────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Détections par Jour", 14, 108);

  autoTable(doc, {
    startY: 113,
    head: [["Date", "Nombre de Détections"]],
    body: byDay.map(d => [d.day, d.count]),
    headStyles: { fillColor: [67, 97, 238], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    styles: { fontSize: 10 },
  });

  // ── Events Table ─────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Historique des Événements (20 derniers)", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [["#", "Statut", "Device", "Timestamp"]],
    body: events.slice(0, 20).map((e, i) => [
      i + 1,
      e.motion ? "⚠️ Mouvement" : "✅ Calme",
      e.device || "ESP32-PIR",
      new Date(e.timestamp).toLocaleString()
    ]),
    headStyles: { fillColor: [67, 97, 238], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    styles: { fontSize: 9 },
  });

  // ── Footer ───────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`IoT PIR Dashboard — Page ${i}/${pageCount}`, 105, 290, { align: "center" });
  }

  doc.save(`rapport-iot-${new Date().toISOString().split("T")[0]}.pdf`);
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("password", password);
      const res = await axios.post(`${API}/login`, form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      onLogin(res.data.access_token, res.data.role);
    } catch {
      setError("❌ Identifiants incorrects !");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f4f6f9", padding: "1rem"
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "2.5rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "100%", maxWidth: "360px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Lock size={40} color="#4361ee" />
          <h2 style={{ margin: "1rem 0 0.25rem" }}>IoT Dashboard</h2>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Connectez-vous pour continuer</p>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Username</label>
          <input style={inputStyle} value={username}
            onChange={e => setUsername(e.target.value)} placeholder="admin" />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Password</label>
          <input style={inputStyle} type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        {error && (
          <p style={{ color: "#e63946", fontSize: "13px", marginBottom: "1rem", textAlign: "center" }}>
            {error}
          </p>
        )}
        <button onClick={handleLogin} disabled={loading} style={{
          width: "100%", padding: "12px", borderRadius: "8px",
          background: "#4361ee", color: "#fff", border: "none",
          fontSize: "15px", fontWeight: "500", cursor: "pointer"
        }}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </div>
    </div>
  );
}

function UsersPage({ headers, onBack }) {
  const isMobile = useIsMobile();
  const [users, setUsers]     = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "viewer" });
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, { headers });
    setUsers(res.data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    try {
      await axios.post(`${API}/users`, newUser, { headers });
      setMessage("✅ Utilisateur créé !");
      setNewUser({ username: "", password: "", role: "viewer" });
      fetchUsers();
    } catch (e) {
      setMessage("❌ " + e.response?.data?.detail);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = async (username) => {
    try {
      await axios.delete(`${API}/users/${username}`, { headers });
      fetchUsers();
    } catch (e) {
      setMessage("❌ " + e.response?.data?.detail);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: isMobile ? "1rem" : "2rem", background: "#f4f6f9", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button onClick={onBack} style={{
          padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd",
          background: "#fff", cursor: "pointer", fontSize: "13px"
        }}>← Retour</button>
        <h1 style={{ margin: 0, fontSize: isMobile ? "18px" : "24px" }}>👤 Utilisateurs</h1>
      </div>

      {message && (
        <div style={{
          padding: "12px 20px", borderRadius: "8px", marginBottom: "1rem",
          background: message.includes("✅") ? "#d4edda" : "#f8d7da",
          color: message.includes("✅") ? "#155724" : "#721c24"
        }}>{message}</div>
      )}

      <div style={{ ...cardStyle, marginBottom: "2rem" }}>
        <h3 style={{ marginTop: 0 }}>➕ Créer un utilisateur</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr auto",
          gap: "1rem", alignItems: "end"
        }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input style={inputStyle} value={newUser.username}
              onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="username" />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="••••••••" />
          </div>
          <div>
            <label style={labelStyle}>Rôle</label>
            <select style={inputStyle} value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={handleCreate} style={{
            padding: "10px 20px", borderRadius: "8px", background: "#4361ee",
            color: "#fff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            width: isMobile ? "100%" : "auto"
          }}>
            <Plus size={16} /> Créer
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>👥 Utilisateurs ({users.length})</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#f1f3f5" }}>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Rôle</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{u.username}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: "3px 10px", borderRadius: "12px", fontSize: "12px",
                    background: u.role === "admin" ? "#cfe2ff" : "#d4edda",
                    color: u.role === "admin" ? "#084298" : "#155724"
                  }}>
                    {u.role === "admin" ? "👑 Admin" : "👁️ Viewer"}
                  </span>
                </td>
                <td style={tdStyle}>
                  {u.username !== "admin" && (
                    <button onClick={() => handleDelete(u.username)} style={{
                      padding: "5px 10px", borderRadius: "6px", border: "none",
                      background: "#f8d7da", color: "#721c24", cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: "4px"
                    }}>
                      <Trash2 size={14} /> {!isMobile && "Supprimer"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [token, setToken]   = useState(localStorage.getItem("token"));
  const [role, setRole]     = useState(localStorage.getItem("role"));
  const [page, setPage]     = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [latest, setLatest] = useState(null);
  const [stats, setStats]   = useState({});
  const [byHour, setByHour] = useState([]);
  const [byDay, setByDay]   = useState([]);
  const [online, setOnline] = useState(false);
  const [alert, setAlert]   = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://${API.replace("http://", "")}/ws`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.motion) {
        setAlert("⚠️ Mouvement détecté !");
        setTimeout(() => setAlert(null), 4000);
      }
    };
    return () => ws.close();
  }, [token]);

  const fetchData = async () => {
    try {
      const [evRes, latRes, stRes, hrRes, dayRes] = await Promise.all([
        axios.get(`${API}/events`, { headers }),
        axios.get(`${API}/events/latest`, { headers }),
        axios.get(`${API}/events/stats`, { headers }),
        axios.get(`${API}/events/by-hour`, { headers }),
        axios.get(`${API}/events/by-day`, { headers }),
      ]);
      setEvents(evRes.data.slice(0, 20).reverse());
      setLatest(latRes.data);
      setStats(stRes.data);
      setByHour(hrRes.data);
      setByDay(dayRes.data);
      setOnline(true);
    } catch {
      setOnline(false);
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setToken(null);
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleLogin = (t, r) => { setToken(t); setRole(r); };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null); setRole(null);
  };

  if (!token) return <Login onLogin={handleLogin} />;
  if (page === "users") return <UsersPage headers={headers} onBack={() => setPage("dashboard")} />;

  const activityData = events.map((e, i) => ({ name: i + 1, motion: e.motion ? 1 : 0 }));

  return (
    <div style={{ fontFamily: "sans-serif", padding: isMobile ? "1rem" : "2rem", background: "#f4f6f9", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem"
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? "18px" : "24px" }}>🏠 IoT PIR Dashboard</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500",
            background: online ? "#d4edda" : "#f8d7da",
            color: online ? "#155724" : "#721c24"
          }}>
            {online ? "🟢 Online" : "🔴 Offline"}
          </span>
          <span style={{
            padding: "6px 12px", borderRadius: "20px", fontSize: "12px",
            background: role === "admin" ? "#cfe2ff" : "#d4edda",
            color: role === "admin" ? "#084298" : "#155724"
          }}>
            {role === "admin" ? "👑 Admin" : "👁️ Viewer"}
          </span>
          {role === "admin" && (
            <button onClick={() => setPage("users")} style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "6px 12px", borderRadius: "20px", border: "1px solid #ddd",
              background: "#fff", cursor: "pointer", fontSize: "12px", color: "#666"
            }}>
              <Users size={13} /> {!isMobile && "Utilisateurs"}
            </button>
          )}
          <button onClick={() => generatePDF(stats, events, byDay)} style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "6px 12px", borderRadius: "20px", border: "1px solid #ddd",
            background: "#fff", cursor: "pointer", fontSize: "12px", color: "#666"
          }}>
            <FileText size={13} /> {!isMobile && "PDF"}
          </button>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "6px 12px", borderRadius: "20px", border: "1px solid #ddd",
            background: "#fff", cursor: "pointer", fontSize: "12px", color: "#666"
          }}>
            <LogOut size={13} /> {!isMobile && "Logout"}
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{
          background: "#e63946", color: "#fff", padding: "12px 16px",
          borderRadius: "12px", marginBottom: "1rem", fontSize: "14px",
          fontWeight: "500", textAlign: "center"
        }}>🚨 {alert}</div>
      )}

      {/* Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: "1rem", marginBottom: "1.5rem"
      }}>
        <div style={cardStyle}>
          <Activity size={20} color="#4361ee" />
          <p style={statLabelStyle}>Total</p>
          <h2 style={valueStyle}>{stats.total || 0}</h2>
        </div>
        <div style={cardStyle}>
          <Clock size={20} color="#f4a261" />
          <p style={statLabelStyle}>Aujourd'hui</p>
          <h2 style={valueStyle}>{stats.today || 0}</h2>
        </div>
        <div style={cardStyle}>
          <Bell size={20} color={latest?.motion ? "#e63946" : "#2a9d8f"} />
          <p style={statLabelStyle}>Statut</p>
          <h2 style={{ ...valueStyle, color: latest?.motion ? "#e63946" : "#2a9d8f", fontSize: "16px" }}>
            {latest?.motion ? "⚠️ Mvt!" : "✅ Calme"}
          </h2>
        </div>
        <div style={cardStyle}>
          <Radio size={20} color="#7209b7" />
          <p style={statLabelStyle}>Dernière détection</p>
          <h2 style={{ ...valueStyle, fontSize: "11px", color: "#555" }}>
            {stats.last_seen ? new Date(stats.last_seen).toLocaleString() : "—"}
          </h2>
        </div>
      </div>

      {/* Charts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "1rem", marginBottom: "1.5rem"
      }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "14px" }}>⏰ Par heure (24h)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4361ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "14px" }}>📅 Par jour</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f4a261" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity */}
      <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0, fontSize: "14px" }}>📈 Activité temps réel</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => v === 1 ? "Mouvement" : "Calme"} />
            <Line type="monotone" dataKey="motion" stroke="#e63946" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, fontSize: "14px" }}>📋 Historique</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f1f3f5" }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Statut</th>
                {!isMobile && <th style={thStyle}>Device</th>}
                <th style={thStyle}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {[...events].reverse().map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "3px 8px", borderRadius: "12px", fontSize: "11px",
                      background: e.motion ? "#f8d7da" : "#d4edda",
                      color: e.motion ? "#721c24" : "#155724"
                    }}>
                      {e.motion ? "⚠️ Mvt" : "✅ Calme"}
                    </span>
                  </td>
                  {!isMobile && <td style={tdStyle}>{e.device}</td>}
                  <td style={tdStyle}>{new Date(e.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff", borderRadius: "12px",
  padding: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)"
};
const statLabelStyle = { margin: "6px 0 2px", color: "#666", fontSize: "12px" };
const valueStyle = { margin: 0, fontSize: "26px", fontWeight: "600" };
const labelStyle = { display: "block", fontSize: "13px", color: "#555", marginBottom: "6px", fontWeight: "500" };
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box"
};
const thStyle = { padding: "8px 10px", textAlign: "left", fontWeight: "500", fontSize: "13px" };
const tdStyle = { padding: "8px 10px" };