import { useState, useEffect, useCallback, useRef } from "react";
import _ from "lodash";

// ─── Schedule C Categories ───
const SCHEDULE_C_CATEGORIES = [
  { id: "advertising", label: "Advertising", line: "8" },
  { id: "car_truck", label: "Car & Truck Expenses", line: "9" },
  { id: "commissions", label: "Commissions & Fees", line: "10" },
  { id: "contract_labor", label: "Contract Labor", line: "11" },
  { id: "depreciation", label: "Depreciation & Sec. 179", line: "13" },
  { id: "employee_benefits", label: "Employee Benefit Programs", line: "14" },
  { id: "insurance", label: "Insurance (non-health)", line: "15" },
  { id: "interest_mortgage", label: "Interest (Mortgage)", line: "16a" },
  { id: "interest_other", label: "Interest (Other)", line: "16b" },
  { id: "legal_professional", label: "Legal & Professional Services", line: "17" },
  { id: "office_expense", label: "Office Expense", line: "18" },
  { id: "pension", label: "Pension & Profit-Sharing", line: "19" },
  { id: "rent_vehicles", label: "Rent — Vehicles, Machinery, Equipment", line: "20a" },
  { id: "rent_other", label: "Rent — Other Business Property", line: "20b" },
  { id: "repairs", label: "Repairs & Maintenance", line: "21" },
  { id: "supplies", label: "Supplies", line: "22" },
  { id: "taxes_licenses", label: "Taxes & Licenses", line: "23" },
  { id: "travel", label: "Travel", line: "24a" },
  { id: "meals", label: "Meals (50% deductible)", line: "24b" },
  { id: "utilities", label: "Utilities", line: "25" },
  { id: "wages", label: "Wages", line: "26" },
  { id: "other", label: "Other Expenses", line: "27a" },
];

const categoryMap = Object.fromEntries(SCHEDULE_C_CATEGORIES.map(c => [c.id, c]));

// ─── API Configuration ───
const API_BASE = "http://localhost:8000";

// ─── Utility ───
const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Icons (inline SVG) ───
const Icon = ({ name, size = 18 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
};

// ─── Confidence badge ───
const ConfBadge = ({ val }) => {
  const pct = Math.round(val * 100);
  const color = pct >= 90 ? "var(--conf-high)" : pct >= 75 ? "var(--conf-med)" : "var(--conf-low)";
  return <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: 0.5 }}>{pct}%</span>;
};

// ─── Source badge ───
const SourceBadge = ({ source, gmail_message_id }) => {
  const config = {
    email: { icon: "mail", bg: "var(--source-email-bg)", color: "var(--source-email-fg)", label: "Email" },
    manual: { icon: "edit", bg: "var(--source-manual-bg)", color: "var(--source-manual-fg)", label: "Manual" },
    upload: { icon: "file", bg: "var(--source-upload-bg)", color: "var(--source-upload-fg)", label: "Upload" },
  }[source] || { icon: "alert", bg: "#eee", color: "#666", label: source };

  const badgeStyle = { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: config.bg, color: config.color, fontSize: 11, fontWeight: 600, letterSpacing: 0.3 };

  if (source === "email" && gmail_message_id) {
    const gmailUrl = `https://mail.google.com/mail/u/?authuser=ariephraimfeldman@gmail.com#inbox/${gmail_message_id}`;
    return (
      <a href={gmailUrl} target="_blank" rel="noopener noreferrer" style={{ ...badgeStyle, textDecoration: "none", cursor: "pointer", transition: "all 0.15s" }} className="email-link-badge" title="Open in Gmail">
        <Icon name={config.icon} size={12} /> {config.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2, opacity: 0.7 }}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>
    );
  }

  return (
    <span style={badgeStyle}>
      <Icon name={config.icon} size={12} /> {config.label}
    </span>
  );
};

// ══════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════
export default function ScheduleCTracker() {
  const [view, setView] = useState("log"); // log | add | report
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({ vendor: "", amount: "", date: "", category: "", notes: "" });
  const [toast, setToast] = useState(null);
  const [gmailStatus, setGmailStatus] = useState("disconnected");
  const [lastSync, setLastSync] = useState(null);

  // Report state
  const [reportYear, setReportYear] = useState("2026");
  const [reportQuarter, setReportQuarter] = useState("all");

  // Add form state
  const [addForm, setAddForm] = useState({ vendor: "", amount: "", date: "", category: "other", notes: "" });
  const [pdfParsing, setPdfParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch expenses from API on mount ──
  useEffect(() => {
    fetchExpenses();
    checkGmailStatus();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses?limit=2000`);
      const data = await res.json();
      setExpenses(data);
    } catch (e) {
      console.error("Failed to fetch expenses:", e);
      showToast("Failed to load expenses", "info");
    } finally {
      setLoading(false);
    }
  };

  const checkGmailStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gmail/status`);
      const data = await res.json();
      setGmailStatus(data.status === "watching" ? "connected" : data.status === "connected" ? "connected" : "disconnected");
      if (data.last_sync) setLastSync(new Date(data.last_sync));
    } catch (e) {
      console.error("Gmail status check failed:", e);
    }
  };

  // ── Sorting helper ──
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir(field === "date" ? "desc" : "asc"); }
  };

  // ── CRUD (API-connected) ──
  const addExpense = async (exp) => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exp),
      });
      const newExp = await res.json();
      setExpenses(prev => [...prev, newExp]);
      showToast("Expense added");
    } catch (e) {
      console.error("Failed to add expense:", e);
      showToast("Failed to save expense", "info");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await fetch(`${API_BASE}/api/expenses/${id}`, { method: "DELETE" });
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast("Expense deleted", "info");
    } catch (e) {
      console.error("Failed to delete expense:", e);
    }
  };

  const updateExpense = async (id, fields) => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Update failed:", res.status, err);
        showToast("Failed to save — check your inputs", "info");
        return;
      }
      const updated = await res.json();
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
      setEditingId(null);
      showToast("Expense updated");
    } catch (e) {
      console.error("Failed to update expense:", e);
      showToast("Failed to save changes", "info");
    }
  };

  const startEditing = (exp) => {
    setEditingId(exp.id);
    setEditFields({
      vendor: exp.vendor,
      amount: exp.amount.toString(),
      date: (exp.date || "").slice(0, 10),
      category: exp.category,
      notes: exp.notes || "",
    });
  };

  const saveEditing = async () => {
    const orig = expenses.find(e => e.id === editingId);
    if (!orig) return;
    
    const updates = {};
    if (editFields.vendor !== orig.vendor) updates.vendor = editFields.vendor;
    if (parseFloat(editFields.amount) !== orig.amount) updates.amount = parseFloat(editFields.amount);
    // Only send date if it actually changed (compare as strings, both YYYY-MM-DD)
    const origDate = (orig.date || "").slice(0, 10);
    const newDate = (editFields.date || "").slice(0, 10);
    if (newDate && newDate !== origDate) updates.date = newDate;
    if (editFields.category !== orig.category) updates.category = editFields.category;
    if (editFields.notes !== (orig.notes || "")) updates.notes = editFields.notes;
    
    if (Object.keys(updates).length > 0) {
      await updateExpense(editingId, updates);
    } else {
      setEditingId(null);
    }
  };

  // ── Gmail connection ──
  const connectGmail = () => {
    window.open(`${API_BASE}/auth/google`, "_blank");
    setGmailStatus("connecting");
    // Poll for connection status
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/gmail/status`);
        const data = await res.json();
        if (data.status === "watching" || data.status === "connected") {
          setGmailStatus("connected");
          setLastSync(new Date());
          showToast("Gmail connected — watching for receipts");
          clearInterval(poll);
        }
      } catch (e) {}
    }, 3000);
    setTimeout(() => clearInterval(poll), 60000);
  };

  // ── PDF Upload handler (API-connected) ──
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfParsing(true);
    setParsedPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/parse-receipt`, {
        method: "POST",
        body: formData,
      });
      const parsed = await res.json();
      setParsedPreview({ ...parsed, source: "upload" });
      setAddForm({
        vendor: parsed.vendor,
        amount: parsed.amount.toString(),
        date: parsed.date,
        category: parsed.category,
        notes: parsed.notes,
      });
    } catch (e) {
      console.error("Receipt parsing failed:", e);
      showToast("Failed to parse receipt", "info");
    } finally {
      setPdfParsing(false);
    }
  };

  // ── Duplicate detection ──
  const detectDuplicates = (allExpenses) => {
    const dominated = new Set();
    for (let i = 0; i < allExpenses.length; i++) {
      if (dominated.has(allExpenses[i].id)) continue;
      // Skip expenses already reviewed as not-duplicate
      if (allExpenses[i].duplicate_reviewed) continue;
      for (let j = i + 1; j < allExpenses.length; j++) {
        if (dominated.has(allExpenses[j].id)) continue;
        if (allExpenses[j].duplicate_reviewed) continue;
        const a = allExpenses[i];
        const b = allExpenses[j];
        // Must be the same amount
        if (a.amount !== b.amount) continue;
        // Must have similar vendor names
        const va = (a.vendor || "").toLowerCase().trim();
        const vb = (b.vendor || "").toLowerCase().trim();
        const vendorMatch = va === vb || va.includes(vb) || vb.includes(va);
        if (!vendorMatch) continue;
        // Must be within 2 days (catches same-day or next-day duplicates from email chains)
        // but NOT recurring monthly charges (which are 28+ days apart)
        const da = new Date(a.date);
        const db = new Date(b.date);
        const dayDiff = Math.abs(da - db) / (1000 * 60 * 60 * 24);
        if (dayDiff <= 2) {
          // Same vendor, same amount, within 2 days — likely a duplicate
          dominated.add(b.id);
        }
      }
    }
    return dominated;
  };

  const duplicateIds = detectDuplicates(expenses);

  // Clean expenses = non-duplicates
  const cleanExpenses = expenses.filter(e => !duplicateIds.has(e.id));
  const duplicateExpenses = expenses.filter(e => duplicateIds.has(e.id));

  const approveDuplicate = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicate_reviewed: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        setExpenses(prev => prev.map(e => e.id === id ? updated : e));
        showToast("Expense approved — added to log");
      }
    } catch (e) {
      console.error("Failed to approve duplicate:", e);
    }
  };

  const deleteDuplicate = async (id) => {
    await deleteExpense(id);
    showToast("Duplicate removed", "info");
  };

  // Find the "original" for a duplicate
  const findOriginal = (dup) => {
    return expenses.find(e =>
      e.id !== dup.id &&
      e.amount === dup.amount &&
      !duplicateIds.has(e.id) &&
      ((e.vendor || "").toLowerCase().includes((dup.vendor || "").toLowerCase()) ||
       (dup.vendor || "").toLowerCase().includes((e.vendor || "").toLowerCase()) ||
       Math.abs(new Date(e.date) - new Date(dup.date)) / (1000 * 60 * 60 * 24) <= 3)
    );
  };

  // ── Filtering & sorting (uses cleanExpenses, after duplicate detection) ──
  const filtered = cleanExpenses.filter(e => {
    if (filterCat !== "all" && e.category !== filterCat) return false;
    if (filterSource !== "all" && e.source !== filterSource) return false;
    if (searchTerm && !e.vendor.toLowerCase().includes(searchTerm.toLowerCase()) && !(e.notes || "").toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const sorted = _.orderBy(filtered, [sortField], [sortDir]);

  // ── Report data (excludes flagged duplicates) ──
  const getReportExpenses = () => {
    return cleanExpenses.filter(e => {
      if (!e.date) return false;
      const y = e.date.slice(0, 4);
      if (y !== reportYear) return false;
      if (reportQuarter === "all") return true;
      const m = parseInt(e.date.slice(5, 7));
      const q = Math.ceil(m / 3);
      return q === parseInt(reportQuarter);
    });
  };

  const reportData = () => {
    const exps = getReportExpenses();
    const byCategory = {};
    SCHEDULE_C_CATEGORIES.forEach(c => { byCategory[c.id] = { ...c, total: 0, count: 0 }; });
    exps.forEach(e => {
      if (byCategory[e.category]) {
        byCategory[e.category].total += e.amount;
        byCategory[e.category].count += 1;
      }
    });
    return Object.values(byCategory).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  };

  const totalExpenses = getReportExpenses().reduce((s, e) => s + e.amount, 0);

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "var(--bg)",
      color: "var(--fg)",
      minHeight: "100vh",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg: #0B0F14;
          --fg: #E2E8F0;
          --fg-muted: #8494A7;
          --fg-dim: #4A5568;
          --surface: #131921;
          --surface-hover: #1A2332;
          --surface-raised: #1E2A3A;
          --border: #1E2A3A;
          --border-subtle: #162030;
          --accent: #10B981;
          --accent-dim: rgba(16, 185, 129, 0.12);
          --accent-hover: #34D399;
          --accent2: #3B82F6;
          --accent2-dim: rgba(59, 130, 246, 0.12);
          --danger: #EF4444;
          --danger-dim: rgba(239, 68, 68, 0.1);
          --warning: #F59E0B;
          --conf-high: #10B981;
          --conf-med: #F59E0B;
          --conf-low: #EF4444;
          --source-email-bg: rgba(59, 130, 246, 0.12);
          --source-email-fg: #60A5FA;
          --source-manual-bg: rgba(16, 185, 129, 0.12);
          --source-manual-fg: #34D399;
          --source-upload-bg: rgba(168, 85, 247, 0.12);
          --source-upload-fg: #C084FC;
          --mono: 'DM Mono', 'Consolas', monospace;
          --radius: 8px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, textarea, button { font-family: inherit; }

        .nav-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; border: none; border-radius: 6px;
          background: transparent; color: var(--fg-muted);
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s ease;
          letter-spacing: 0.3px;
        }
        .nav-btn:hover { background: var(--surface-hover); color: var(--fg); }
        .nav-btn.active { background: var(--accent-dim); color: var(--accent); }

        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          text-align: left; padding: 10px 14px; font-size: 11px;
          font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;
          color: var(--fg-dim); border-bottom: 1px solid var(--border);
          cursor: pointer; user-select: none; white-space: nowrap;
        }
        .data-table th:hover { color: var(--fg-muted); }
        .data-table td {
          padding: 12px 14px; border-bottom: 1px solid var(--border-subtle);
          font-size: 13px; vertical-align: middle;
        }
        .data-table tr:hover td { background: var(--surface-hover); }

        .input-field {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; padding: 10px 12px; color: var(--fg);
          font-size: 13px; width: 100%; outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: var(--accent); }
        .input-field::placeholder { color: var(--fg-dim); }

        .btn-primary {
          background: var(--accent); color: #0B0F14; border: none;
          border-radius: 6px; padding: 10px 20px; font-weight: 600;
          font-size: 13px; cursor: pointer; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 6px;
          letter-spacing: 0.3px;
        }
        .btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-outline {
          background: transparent; color: var(--fg-muted);
          border: 1px solid var(--border); border-radius: 6px;
          padding: 8px 14px; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-outline:hover { border-color: var(--fg-dim); color: var(--fg); }

        .btn-icon {
          background: none; border: none; color: var(--fg-dim);
          cursor: pointer; padding: 4px; border-radius: 4px;
          transition: all 0.15s; display: flex; align-items: center;
        }
        .btn-icon:hover { color: var(--fg-muted); background: var(--surface-hover); }
        .btn-icon.danger:hover { color: var(--danger); background: var(--danger-dim); }

        .cat-select {
          background: var(--surface); border: 1px solid var(--accent);
          border-radius: 4px; color: var(--fg); font-size: 12px;
          padding: 4px 6px; outline: none;
        }

        .toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 999;
          padding: 12px 20px; border-radius: 8px; font-size: 13px;
          font-weight: 500; animation: slideUp 0.3s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .toast.success { background: var(--accent); color: #0B0F14; }
        .toast.info { background: var(--accent2); color: white; }

        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        .report-row { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
        .report-row:hover { background: var(--surface-hover); }

        .sync-dot {
          width: 8px; height: 8px; border-radius: 50%;
          display: inline-block; margin-right: 6px;
        }
        .sync-dot.connected { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
        .sync-dot.disconnected { background: var(--fg-dim); }
        .sync-dot.connecting { background: var(--warning); animation: pulse 1s infinite; }

        .upload-zone {
          border: 2px dashed var(--border); border-radius: 12px;
          padding: 40px 20px; text-align: center; cursor: pointer;
          transition: all 0.2s;
        }
        .upload-zone:hover { border-color: var(--accent); background: var(--accent-dim); }

        .bar-fill {
          height: 24px; border-radius: 4px; background: var(--accent);
          transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          min-width: 2px;
        }

        select.filter-select {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; padding: 8px 10px; color: var(--fg);
          font-size: 12px; outline: none; cursor: pointer;
        }

        .stat-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 20px;
        }
        .email-link-badge:hover {
          filter: brightness(1.3);
          text-decoration: none !important;
        }

        .print-btn {
          background: transparent; color: var(--fg-muted);
          border: 1px solid var(--border); border-radius: 6px;
          padding: 8px 14px; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .print-btn:hover { border-color: var(--fg-dim); color: var(--fg); }

        /* ═══ PRINT STYLES ═══ */
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000 !important; }

          body, html { background: white !important; margin: 0; padding: 0; font-family: 'Times New Roman', Georgia, serif !important; }

          /* Hide everything except the report */
          header, nav, .stat-card, .no-print, .print-btn, .filter-select, .toast,
          .screen-report, .bar-fill, .report-row, button, select { display: none !important; }

          main { padding: 0.5in !important; max-width: 100% !important; background: white !important; }

          /* Print report container */
          .print-report { display: block !important; background: white !important; color: #000 !important; }

          .print-report * { color: #000 !important; background: transparent !important; }

          .print-report-header {
            text-align: center; padding: 20px 0 14px; border-bottom: 2px solid #000;
            margin-bottom: 24px;
          }
          .print-report-header h1 {
            font-size: 18pt; font-weight: 700; color: #000 !important; margin: 0 0 4px;
            font-family: 'Times New Roman', Georgia, serif;
          }
          .print-report-header h2 {
            font-size: 11pt; font-weight: 400; color: #333 !important; margin: 0 0 2px;
            font-family: 'Times New Roman', Georgia, serif;
          }
          .print-report-header p {
            font-size: 9pt; color: #555 !important; margin: 3px 0 0;
            font-family: 'Times New Roman', Georgia, serif;
          }

          .print-meta-row {
            display: flex; justify-content: space-between; padding: 4px 0;
            font-size: 10pt; font-family: 'Times New Roman', Georgia, serif;
            border-bottom: 1px dotted #ccc;
          }
          .print-meta-row span:first-child { font-weight: 700; }

          .print-section-header {
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 11pt; font-weight: 700; padding: 10px 0 4px;
            border-bottom: 1.5px solid #000; margin-top: 20px; margin-bottom: 2px;
            page-break-after: avoid;
          }

          .print-cat-header {
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 10pt; font-weight: 700; padding: 8px 0 3px;
            border-bottom: 1px solid #999; margin-top: 12px;
            display: flex; justify-content: space-between;
            page-break-after: avoid;
          }

          .print-item-row {
            display: flex; align-items: baseline; padding: 3px 0 3px 16px;
            font-size: 9pt; font-family: 'Times New Roman', Georgia, serif;
            border-bottom: 1px dotted #ddd;
          }
          .print-item-date { width: 80px; flex-shrink: 0; font-family: 'Courier New', monospace; font-size: 8pt; }
          .print-item-vendor { flex: 1; }
          .print-item-amount { width: 80px; text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }

          .print-cat-subtotal {
            display: flex; justify-content: flex-end; padding: 4px 0;
            font-size: 9.5pt; font-weight: 700;
            font-family: 'Times New Roman', Georgia, serif;
            border-top: 1px solid #999;
          }
          .print-cat-subtotal span { font-family: 'Courier New', monospace; margin-left: 12px; }

          .print-grand-total {
            display: flex; justify-content: space-between; align-items: baseline;
            padding: 10px 0; margin-top: 16px;
            border-top: 2.5px double #000; border-bottom: 2.5px double #000;
            font-size: 12pt; font-weight: 700;
            font-family: 'Times New Roman', Georgia, serif;
          }
          .print-grand-total span:last-child { font-family: 'Courier New', monospace; }

          .print-footer {
            margin-top: 28px; padding-top: 10px; border-top: 1px solid #ccc;
            font-size: 8pt; color: #888 !important; text-align: center;
            font-family: 'Times New Roman', Georgia, serif;
          }
        }

        /* Only show print report on screen when not printing */
        .print-report { display: none; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
            <Icon name="dollar" size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>Schedule C Tracker</h1>
            <p style={{ fontSize: 11, color: "var(--fg-dim)", letterSpacing: 0.3 }}>Automated receipt logging & expense reporting</p>
          </div>
        </div>

        {/* Gmail status */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {gmailStatus === "connected" && lastSync && (
            <span style={{ fontSize: 11, color: "var(--fg-dim)" }}>
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={gmailStatus === "disconnected" ? connectGmail : undefined}
            className="btn-outline"
            style={gmailStatus === "connected" ? { borderColor: "var(--accent)", color: "var(--accent)", cursor: "default" } : gmailStatus === "connecting" ? { cursor: "wait" } : {}}
          >
            <span className={`sync-dot ${gmailStatus}`} />
            {gmailStatus === "disconnected" ? "Connect Gmail" : gmailStatus === "connecting" ? "Connecting..." : "Gmail Active"}
          </button>
        </div>
      </header>

      {/* ═══ NAV ═══ */}
      <nav style={{ display: "flex", gap: 4, padding: "12px 28px", borderBottom: "1px solid var(--border)" }}>
        <button className={`nav-btn ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>
          <Icon name="list" size={16} /> Expense Log
        </button>
        <button className={`nav-btn ${view === "add" ? "active" : ""}`} onClick={() => setView("add")}>
          <Icon name="plus" size={16} /> Add Expense
        </button>
        <button className={`nav-btn ${view === "report" ? "active" : ""}`} onClick={() => setView("report")}>
          <Icon name="chart" size={16} /> Schedule C Report
        </button>
        {duplicateExpenses.length > 0 && (
          <button className={`nav-btn ${view === "duplicates" ? "active" : ""}`} onClick={() => setView("duplicates")} style={view !== "duplicates" ? { color: "var(--warning)" } : {}}>
            <Icon name="alert" size={16} /> Possible Duplicates
            <span style={{ background: "var(--warning)", color: "#0B0F14", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginLeft: 4 }}>{duplicateExpenses.length}</span>
          </button>
        )}
      </nav>

      {/* ═══ CONTENT ═══ */}
      <main style={{ padding: "24px 28px", maxWidth: 1200 }}>

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--fg-dim)" }}>
            <Icon name="zap" size={28} />
            <p style={{ marginTop: 12, fontSize: 14 }}>Loading expenses from server...</p>
          </div>
        )}

        {/* ────────── LOG VIEW ────────── */}
        {!loading && view === "log" && (
          <div>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Expenses", value: fmt(cleanExpenses.reduce((s, e) => s + e.amount, 0)), icon: "dollar", color: "var(--accent)" },
                { label: "This Quarter", value: fmt(cleanExpenses.filter(e => { const m = parseInt(e.date.slice(5,7)); return e.date.startsWith("2026") && Math.ceil(m/3) === Math.ceil(new Date().getMonth()/3 + 1); }).reduce((s,e)=>s+e.amount,0)), icon: "calendar", color: "var(--accent2)" },
                { label: "From Email", value: cleanExpenses.filter(e => e.source === "email").length, icon: "mail", color: "#60A5FA" },
                { label: "Total Entries", value: cleanExpenses.length, icon: "list", color: "var(--fg-muted)" },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--fg-dim)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</span>
                    <span style={{ color: s.color, opacity: 0.6 }}><Icon name={s.icon} size={16} /></span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fg-dim)" }}><Icon name="search" size={14} /></span>
                <input className="input-field" placeholder="Search vendors or notes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 32 }} />
              </div>
              <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {SCHEDULE_C_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select className="filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                <option value="all">All Sources</option>
                <option value="email">Email</option>
                <option value="manual">Manual</option>
                <option value="upload">Upload</option>
              </select>
              <span style={{ fontSize: 12, color: "var(--fg-dim)", marginLeft: "auto" }}>{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Table */}
            <div style={{ background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("date")}>Date {sortField === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                    <th onClick={() => toggleSort("vendor")}>Vendor {sortField === "vendor" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                    <th onClick={() => toggleSort("amount")}>Amount {sortField === "amount" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                    <th>Category</th>
                    <th>Source</th>
                    <th>Conf.</th>
                    <th>Notes</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(exp => (
                    <tr key={exp.id}>
                      {editingId === exp.id ? (
                        <>
                          <td><input className="input-field" type="date" value={editFields.date} onChange={e => setEditFields(f => ({ ...f, date: e.target.value }))} style={{ fontSize: 12, padding: "4px 6px", width: 130, fontFamily: "var(--mono)" }} /></td>
                          <td><input className="input-field" value={editFields.vendor} onChange={e => setEditFields(f => ({ ...f, vendor: e.target.value }))} style={{ fontSize: 12, padding: "4px 6px" }} /></td>
                          <td><input className="input-field" type="number" step="0.01" value={editFields.amount} onChange={e => setEditFields(f => ({ ...f, amount: e.target.value }))} style={{ fontSize: 12, padding: "4px 6px", width: 90, fontFamily: "var(--mono)" }} /></td>
                          <td>
                            <select className="cat-select" value={editFields.category} onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))}>
                              {SCHEDULE_C_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                          </td>
                          <td><SourceBadge source={exp.source} gmail_message_id={exp.gmail_message_id} /></td>
                          <td><ConfBadge val={exp.confidence} /></td>
                          <td><input className="input-field" value={editFields.notes} onChange={e => setEditFields(f => ({ ...f, notes: e.target.value }))} style={{ fontSize: 12, padding: "4px 6px" }} /></td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <button className="btn-icon" onClick={saveEditing} title="Save"><Icon name="check" size={14} /></button>
                            <button className="btn-icon" onClick={() => setEditingId(null)} title="Cancel"><Icon name="x" size={14} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td onClick={() => startEditing(exp)} style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--fg-muted)", whiteSpace: "nowrap", cursor: "pointer" }}>{fmtDate(exp.date)}</td>
                          <td onClick={() => startEditing(exp)} style={{ fontWeight: 500, cursor: "pointer" }}>{exp.vendor}</td>
                          <td onClick={() => startEditing(exp)} style={{ fontFamily: "var(--mono)", fontWeight: 600, color: "var(--accent)", cursor: "pointer" }}>{fmt(exp.amount)}</td>
                          <td>
                            <span
                              onClick={() => startEditing(exp)}
                              style={{ cursor: "pointer", fontSize: 12, color: "var(--fg-muted)", padding: "3px 8px", borderRadius: 4, background: "var(--surface-raised)", display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              {categoryMap[exp.category]?.label || exp.category}
                              <span style={{ fontSize: 10, color: "var(--fg-dim)" }}>L{categoryMap[exp.category]?.line}</span>
                            </span>
                          </td>
                          <td><SourceBadge source={exp.source} gmail_message_id={exp.gmail_message_id} /></td>
                          <td><ConfBadge val={exp.confidence} /></td>
                          <td onClick={() => startEditing(exp)} style={{ color: "var(--fg-dim)", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>{exp.notes}</td>
                          <td>
                            <button className="btn-icon danger" onClick={() => deleteExpense(exp.id)} title="Delete"><Icon name="trash" size={14} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--fg-dim)" }}>No expenses match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ────────── ADD VIEW ────────── */}
        {!loading && view === "add" && (
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Add Expense</h2>
            <p style={{ fontSize: 13, color: "var(--fg-dim)", marginBottom: 28 }}>Enter manually or upload a receipt/invoice to auto-fill</p>

            {/* Upload zone */}
            <div
              className="upload-zone"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  // Trigger the same handler as the file input
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileRef.current.files = dt.files;
                  handlePdfUpload({ target: { files: dt.files } });
                }
              }}
              style={{ marginBottom: 28, borderColor: dragging ? "var(--accent)" : undefined, background: dragging ? "var(--accent-dim)" : undefined }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={handlePdfUpload} />
              {pdfParsing ? (
                <div>
                  <div style={{ color: "var(--accent)", marginBottom: 8 }}><Icon name="zap" size={28} /></div>
                  <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: 14 }}>Parsing receipt with AI...</p>
                  <p style={{ color: "var(--fg-dim)", fontSize: 12, marginTop: 4 }}>Extracting vendor, amount, date, and category</p>
                </div>
              ) : parsedPreview ? (
                <div>
                  <div style={{ color: "var(--accent)", marginBottom: 8 }}><Icon name="check" size={28} /></div>
                  <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: 14 }}>Receipt parsed — review fields below</p>
                  <p style={{ color: "var(--fg-dim)", fontSize: 12, marginTop: 4 }}>
                    Confidence: <ConfBadge val={parsedPreview.confidence} /> — adjust any fields before saving
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ color: "var(--fg-dim)", marginBottom: 8 }}><Icon name="upload" size={28} /></div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Drop a receipt or invoice here</p>
                  <p style={{ color: "var(--fg-dim)", fontSize: 12, marginTop: 4 }}>PDF, PNG, or JPG — AI will extract the details</p>
                </div>
              )}
            </div>

            {/* Form */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--fg-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Vendor</label>
                <input className="input-field" placeholder="e.g. Amazon, Delta, Uber" value={addForm.vendor} onChange={e => setAddForm(f => ({ ...f, vendor: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--fg-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Amount</label>
                <input className="input-field" type="number" step="0.01" placeholder="0.00" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--fg-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</label>
                <input className="input-field" type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--fg-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Category (Schedule C Line)</label>
                <select className="input-field" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
                  {SCHEDULE_C_CATEGORIES.map(c => <option key={c.id} value={c.id}>L{c.line} — {c.label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--fg-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</label>
                <input className="input-field" placeholder="Optional description or context" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button
                className="btn-primary"
                disabled={!addForm.vendor || !addForm.amount || !addForm.date}
                onClick={() => {
                  addExpense({
                    vendor: addForm.vendor,
                    amount: parseFloat(addForm.amount),
                    date: addForm.date,
                    category: addForm.category,
                    notes: addForm.notes,
                    source: parsedPreview ? "upload" : "manual",
                    confidence: parsedPreview ? parsedPreview.confidence : 1.0,
                  });
                  setAddForm({ vendor: "", amount: "", date: "", category: "other", notes: "" });
                  setParsedPreview(null);
                  setView("log");
                }}
              >
                <Icon name="check" size={15} /> Save Expense
              </button>
              <button className="btn-outline" onClick={() => { setAddForm({ vendor: "", amount: "", date: "", category: "other", notes: "" }); setParsedPreview(null); }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ────────── REPORT VIEW ────────── */}
        {!loading && view === "report" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Schedule C Report</h2>
                <p style={{ fontSize: 13, color: "var(--fg-dim)" }}>Expense totals by IRS category for your tax filing</p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <select className="filter-select" value={reportYear} onChange={e => setReportYear(e.target.value)}>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
                <select className="filter-select" value={reportQuarter} onChange={e => setReportQuarter(e.target.value)}>
                  <option value="all">Full Year</option>
                  <option value="1">Q1 (Jan–Mar)</option>
                  <option value="2">Q2 (Apr–Jun)</option>
                  <option value="3">Q3 (Jul–Sep)</option>
                  <option value="4">Q4 (Oct–Dec)</option>
                </select>
                <button className="print-btn" onClick={() => window.print()}>
                  <Icon name="download" size={14} /> Print Report
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="stat-card screen-report" style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--fg-dim)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
                  Total Deductible Expenses — {reportQuarter === "all" ? reportYear : `Q${reportQuarter} ${reportYear}`}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--accent)" }}>{fmt(totalExpenses)}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-dim)" }}>
                {getReportExpenses().length} expense{getReportExpenses().length !== 1 ? "s" : ""} across {reportData().length} categor{reportData().length !== 1 ? "ies" : "y"}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="screen-report" style={{ background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--fg-dim)" }}>Part II — Expenses</span>
                <span style={{ fontSize: 11, color: "var(--fg-dim)" }}>Schedule C (Form 1040)</span>
              </div>

              {reportData().length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "var(--fg-dim)" }}>No expenses for this period</div>
              ) : (
                reportData().map((cat, i) => {
                  const maxTotal = reportData()[0]?.total || 1;
                  const pct = (cat.total / maxTotal) * 100;
                  return (
                    <div key={cat.id} className="report-row">
                      <div style={{ width: 44, fontSize: 11, fontFamily: "var(--mono)", color: "var(--fg-dim)", fontWeight: 600, flexShrink: 0 }}>L{cat.line}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{cat.label}</div>
                        <div style={{ background: "var(--surface-raised)", borderRadius: 4, overflow: "hidden", height: 24 }}>
                          <div className="bar-fill" style={{ width: `${pct}%`, opacity: 0.85 }} />
                        </div>
                      </div>
                      <div style={{ width: 50, textAlign: "center", fontSize: 12, color: "var(--fg-dim)", flexShrink: 0 }}>{cat.count}×</div>
                      <div style={{ width: 110, textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "var(--accent)", flexShrink: 0 }}>{fmt(cat.total)}</div>
                    </div>
                  );
                })
              )}

              {reportData().length > 0 && (
                <div style={{ padding: "16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--fg-dim)" }}>Total Expenses (Line 28)</span>
                  <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>{fmt(totalExpenses)}</span>
                </div>
              )}
            </div>

            {/* ═══ PRINTABLE REPORT ═══ */}
            <div className="print-report">
              <div className="print-report-header">
                <h1>Schedule C — Business Expense Summary</h1>
                <h2>Profit or Loss From Business (Form 1040)</h2>
                <p>Part II — Expenses | {reportQuarter === "all" ? `Full Year ${reportYear}` : `Q${reportQuarter} ${reportYear}`}</p>
                <p>Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div className="print-meta-row"><span>Report Period:</span><span>{reportQuarter === "all" ? `January 1 – December 31, ${reportYear}` : `Q${reportQuarter} ${reportYear} (${["Jan–Mar","Apr–Jun","Jul–Sep","Oct–Dec"][parseInt(reportQuarter)-1]})`}</span></div>
                <div className="print-meta-row"><span>Total Expenses:</span><span>{fmt(totalExpenses)}</span></div>
                <div className="print-meta-row"><span>Number of Entries:</span><span>{getReportExpenses().length}</span></div>
                <div className="print-meta-row"><span>Categories Used:</span><span>{reportData().length}</span></div>
              </div>

              {/* ── Category Summary ── */}
              <div className="print-section-header">Category Summary</div>
              {(() => {
                const allCats = [];
                SCHEDULE_C_CATEGORIES.forEach(c => {
                  const exps = getReportExpenses().filter(e => e.category === c.id);
                  allCats.push({ ...c, total: exps.reduce((s, e) => s + e.amount, 0), count: exps.length });
                });
                return allCats.filter(c => c.total > 0).map(cat => (
                  <div key={cat.id} className="print-item-row" style={{ paddingLeft: 0 }}>
                    <span className="print-item-date" style={{ width: 40, fontFamily: "'Courier New', monospace", fontSize: "8pt" }}>{cat.line}</span>
                    <span className="print-item-vendor">{cat.label} ({cat.count})</span>
                    <span className="print-item-amount">{fmt(cat.total)}</span>
                  </div>
                ));
              })()}

              <div className="print-grand-total">
                <span>Line 28 — Total Expenses</span>
                <span>{fmt(totalExpenses)}</span>
              </div>

              {/* ── Itemized by Category ── */}
              {reportData().length > 0 && (
                <>
                  <div className="print-section-header" style={{ marginTop: 32 }}>Itemized Expenses by Category</div>
                  {(() => {
                    const reportExps = getReportExpenses();
                    return SCHEDULE_C_CATEGORIES.map(cat => {
                      const catExps = _.orderBy(reportExps.filter(e => e.category === cat.id), ["date"], ["asc"]);
                      if (catExps.length === 0) return null;
                      const catTotal = catExps.reduce((s, e) => s + e.amount, 0);
                      return (
                        <div key={cat.id}>
                          <div className="print-cat-header">
                            <span>Line {cat.line} — {cat.label}</span>
                            <span style={{ fontFamily: "'Courier New', monospace" }}>{fmt(catTotal)}</span>
                          </div>
                          {catExps.map(exp => (
                            <div key={exp.id} className="print-item-row">
                              <span className="print-item-date">{fmtDate(exp.date)}</span>
                              <span className="print-item-vendor">{exp.vendor}{exp.notes ? ` — ${exp.notes}` : ""}</span>
                              <span className="print-item-amount">{fmt(exp.amount)}</span>
                            </div>
                          ))}
                          <div className="print-cat-subtotal">
                            Subtotal ({catExps.length} item{catExps.length !== 1 ? "s" : ""}): <span>{fmt(catTotal)}</span>
                          </div>
                        </div>
                      );
                    }).filter(Boolean);
                  })()}

                  <div className="print-grand-total" style={{ marginTop: 24 }}>
                    <span>Total All Categories</span>
                    <span>{fmt(totalExpenses)}</span>
                  </div>
                </>
              )}

              <div className="print-footer">
                This report was generated by Schedule C Tracker. All amounts should be verified against original receipts before filing.
                <br />This document is for record-keeping purposes only and does not constitute tax advice.
              </div>
            </div>
          </div>
        )}

        {/* ────────── DUPLICATES VIEW ────────── */}
        {!loading && view === "duplicates" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Possible Duplicates</h2>
              <p style={{ fontSize: 13, color: "var(--fg-dim)" }}>
                These expenses look like duplicates — same amount with a similar vendor or close date.
                They're excluded from your Schedule C totals until you review them.
              </p>
            </div>

            {duplicateExpenses.length === 0 ? (
              <div style={{ background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", padding: 48, textAlign: "center", color: "var(--fg-dim)" }}>
                <Icon name="check" size={28} />
                <p style={{ marginTop: 12 }}>No duplicates detected — you're all clear</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {duplicateExpenses.map(dup => {
                  const orig = findOriginal(dup);
                  return (
                    <div key={dup.id} style={{ background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", padding: 20, borderLeft: "3px solid var(--warning)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--warning)", textTransform: "uppercase", letterSpacing: 0.5 }}>Flagged Duplicate</span>
                            <SourceBadge source={dup.source} gmail_message_id={dup.gmail_message_id} />
                          </div>
                          <div style={{ display: "flex", gap: 24, alignItems: "baseline", marginBottom: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 600 }}>{dup.vendor}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{fmt(dup.amount)}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--fg-muted)" }}>{fmtDate(dup.date)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--fg-dim)", marginBottom: 4 }}>
                            {categoryMap[dup.category]?.label || dup.category} · Line {categoryMap[dup.category]?.line}
                          </div>
                          {dup.notes && <div style={{ fontSize: 12, color: "var(--fg-dim)" }}>{dup.notes}</div>}

                          {orig && (
                            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--surface-raised)", borderRadius: 6, fontSize: 12 }}>
                              <span style={{ color: "var(--fg-dim)", fontWeight: 600 }}>Matches: </span>
                              <span style={{ color: "var(--fg-muted)" }}>
                                {orig.vendor} · {fmt(orig.amount)} · {fmtDate(orig.date)}
                                {orig.notes ? ` · ${orig.notes}` : ""}
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: 12, padding: "8px 14px" }}
                            onClick={() => approveDuplicate(dup.id)}
                          >
                            <Icon name="check" size={13} /> Not a Duplicate
                          </button>
                          <button
                            className="btn-outline"
                            style={{ fontSize: 12, padding: "8px 14px", borderColor: "var(--danger)", color: "var(--danger)" }}
                            onClick={() => deleteDuplicate(dup.id)}
                          >
                            <Icon name="trash" size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 12, padding: 16, background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--fg-dim)" }}>
                    {duplicateExpenses.length} possible duplicate{duplicateExpenses.length !== 1 ? "s" : ""} · {fmt(duplicateExpenses.reduce((s, e) => s + e.amount, 0))} excluded from totals
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
