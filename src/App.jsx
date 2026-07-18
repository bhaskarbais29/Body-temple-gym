import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Search, MessageCircle, Pencil, Trash2, X, Dumbbell, LogIn, Users, AlertTriangle, CalendarClock, Receipt, Printer, Settings, ChevronLeft, Download } from "lucide-react";
import { db } from "./firebase.js";
import html2canvas from "html2canvas";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');";

const PLAN_DAYS = { Monthly: 30, Quarterly: 90, "Half-Yearly": 180, Annual: 365, Custom: null };
const PLAN_LIST = Object.keys(PLAN_DAYS);

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function statusOf(member) {
  const today = todayISO();
  const daysLeft = daysBetween(today, member.endDate);
  if (daysLeft < 0) return { label: "Expired", tone: "expired", daysLeft };
  if (daysLeft <= 7) return { label: "Expiring", tone: "expiring", daysLeft };
  return { label: "Active", tone: "active", daysLeft };
}

const TONE_STYLES = {
  active: { bg: "#1F3B2C", fg: "#7FD99A", ring: "#2E5A41" },
  expiring: { bg: "#3E3419", fg: "#E8B84B", ring: "#5C4C1F" },
  expired: { bg: "#3E2020", fg: "#E17B6A", ring: "#5C2A2A" },
};

function whatsappLink(phone, text) {
  let num = phone.replace(/[^\d]/g, "");
  if (num.length === 10) num = "91" + num;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
const UPI_ID = "8827730435@ibl";
const UPI_NAME = "Bhaskar singh bais";
}

function upiLink(amount, note) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_NAME,
    cu: "INR",
    ...(amount ? { am: amount } : {}),
    ...(note ? { tn: note } : {}),
  });
  return `upi://pay?${params.toString()}`;
}

const TEMPLATES = {
  renewal: (m) => `Hi ${m.name}! This is a reminder from Body Temple Health Club — your ${m.plan} membership ends on ${fmtDate(m.endDate)}. Renew soon to keep your progress going.\n\nPay here: ${upiLink("", `${m.name} - ${m.plan} renewal`)}`,
  welcome: (m) => `Welcome to Body Temple Health Club, ${m.name}! Your ${m.plan} membership is active from ${fmtDate(m.startDate)} to ${fmtDate(m.endDate)}. Let's get to work.`,
  payment: (m) => `Hi ${m.name}, this is a payment reminder for your Body Temple Health Club membership.\n\nPay here: ${upiLink("", `${m.name} - dues`)}`,
  custom: () => "",
};


const DEFAULT_BUSINESS = { gymName: "Body Temple Health Club", address: "", phone: "", gstin: "", nextInvoiceNo: 1 };

function useGymData() {
  const [members, setMembers] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [business, setBusiness] = useState(DEFAULT_BUSINESS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ref = doc(db, "gym", "data");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const parsed = snap.data();
          setMembers(parsed.members || []);
          setCheckins(parsed.checkins || []);
          setInvoices(parsed.invoices || []);
          setBusiness({ ...DEFAULT_BUSINESS, ...(parsed.business || {}) });
        }
        setLoaded(true);
      },
      () => {
        setError("Could not sync. Check your connection.");
        setLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  const persist = async (next) => {
    try {
      await setDoc(doc(db, "gym", "data"), next);
      setError(null);
    } catch (e) {
      setError("Could not save. Your last change may not persist.");
    }
  };

  const state = { members, checkins, invoices, business };

  const saveMembers = (next) => { setMembers(next); persist({ ...state, members: next }); };
  const saveCheckins = (next) => { setCheckins(next); persist({ ...state, checkins: next }); };
  const saveInvoices = (next) => { setInvoices(next); persist({ ...state, invoices: next }); };
  const saveBusiness = (next) => { setBusiness(next); persist({ ...state, business: next }); };

  return { members, checkins, invoices, business, saveMembers, saveCheckins, saveInvoices, saveBusiness, loaded, error };
}

function MemberForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [plan, setPlan] = useState(initial?.plan || "Monthly");
  const [startDate, setStartDate] = useState(initial?.startDate || todayISO());
  const [endDate, setEndDate] = useState(initial?.endDate || addDays(todayISO(), 30));
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (PLAN_DAYS[plan] != null) setEndDate(addDays(startDate, PLAN_DAYS[plan]));
  }, [plan, startDate]);

  const valid = name.trim() && phone.trim().replace(/\D/g, "").length >= 10 && startDate && endDate;

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{initial ? "Edit member" : "Add member"}</h2>
          <button style={styles.iconBtn} onClick={onCancel} aria-label="Close"><X size={18} color="#8B8D94" /></button>
        </div>
        <div style={styles.formGrid}>
          <label style={styles.label}>Full name
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohit Sharma" />
          </label>
          <label style={styles.label}>WhatsApp number
            <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
          </label>
          <label style={styles.label}>Plan
            <select style={styles.input} value={plan} onChange={(e) => setPlan(e.target.value)}>
              {PLAN_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label style={styles.label}>Start date
            <input type="date" style={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label style={styles.label}>End date
            <input type="date" style={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={PLAN_DAYS[plan] != null} />
          </label>
          <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Notes (optional)
            <input style={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Goal, injury notes, PT batch, etc." />
          </label>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.secondaryBtn} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.primaryBtn, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}
            disabled={!valid}
            onClick={() => valid && onSave({ id: initial?.id || crypto.randomUUID(), name: name.trim(), phone: phone.trim(), plan, startDate, endDate, notes: notes.trim() })}
          >
            {initial ? "Save changes" : "Add member"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsAppPanel({ member, onClose }) {
  const [templateKey, setTemplateKey] = useState("renewal");
  const [text, setText] = useState(TEMPLATES.renewal(member));

  useEffect(() => { setText(templateKey === "custom" ? "" : TEMPLATES[templateKey](member)); }, [templateKey]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Message {member.name}</h2>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close"><X size={18} color="#8B8D94" /></button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[["renewal", "Renewal reminder"], ["welcome", "Welcome"], ["payment", "Payment due"], ["custom", "Custom"]].map(([k, label]) => (
            <button key={k} onClick={() => setTemplateKey(k)} style={{ ...styles.chip, ...(templateKey === k ? styles.chipActive : {}) }}>{label}</button>
          ))}
        </div>
        <textarea style={styles.textarea} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your message..." />
        <div style={styles.modalFooter}>
          <button style={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <a
            href={text.trim() ? whatsappLink(member.phone, text) : undefined}
            target="_blank" rel="noopener noreferrer"
            style={{ ...styles.primaryBtn, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, opacity: text.trim() ? 1 : 0.5, pointerEvents: text.trim() ? "auto" : "none" }}
            onClick={onClose}
          >
            <MessageCircle size={16} /> Open in WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function PlateBadge({ daysLeft, tone }) {
  const t = TONE_STYLES[tone];
  const label = daysLeft < 0 ? `${Math.abs(daysLeft)}d over` : `${daysLeft}d left`;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 64, padding: "4px 10px", borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.ring}`, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 0.2 }}>{label}</span>
  );
}

function InvoiceForm({ member, business, nextInvoiceNo, onSave, onCancel }) {
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [gstPercent, setGstPercent] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  const amt = parseFloat(amount) || 0;
  const disc = parseFloat(discount) || 0;
  const gstP = parseFloat(gstPercent) || 0;
  const taxable = Math.max(amt - disc, 0);
  const gstAmt = (taxable * gstP) / 100;
  const total = taxable + gstAmt;
  const valid = amt > 0;

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Invoice for {member.name}</h2>
          <button style={styles.iconBtn} onClick={onCancel} aria-label="Close"><X size={18} color="#8B8D94" /></button>
        </div>
        <div style={styles.formGrid}>
          <label style={styles.label}>Amount (₹)
            <input style={styles.input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${member.plan} plan fee`} />
          </label>
          <label style={styles.label}>Discount (₹, optional)
            <input style={styles.input} inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </label>
          <label style={styles.label}>GST % (0 if not registered)
            <input style={styles.input} inputMode="decimal" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
          </label>
          <label style={styles.label}>Payment mode
            <select style={styles.input} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              {["Cash", "UPI", "Card", "Bank Transfer"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label style={styles.label}>Invoice date
            <input type="date" style={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label style={styles.label}>Invoice no.
            <input style={{ ...styles.input, opacity: 0.6 }} value={`${business.gymName ? "BT-" : "INV-"}${String(nextInvoiceNo).padStart(4, "0")}`} disabled />
          </label>
          <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Notes (optional)
            <input style={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Includes PT sessions" />
          </label>
        </div>
        <div style={styles.totalBox}>
          <div style={styles.totalRow}><span>Taxable amount</span><span>{rupee(taxable)}</span></div>
          {gstP > 0 && <div style={styles.totalRow}><span>GST ({gstP}%)</span><span>{rupee(gstAmt)}</span></div>}
          <div style={{ ...styles.totalRow, fontWeight: 700, color: "#F2F1ED", fontSize: 15, marginTop: 4 }}><span>Total</span><span>{rupee(total)}</span></div>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.secondaryBtn} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.primaryBtn, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}
            disabled={!valid}
            onClick={() => valid && onSave({
              id: crypto.randomUUID(), number: nextInvoiceNo, memberId: member.id, memberName: member.name, memberPhone: member.phone,
              plan: member.plan, periodStart: member.startDate, periodEnd: member.endDate,
              amount: amt, discount: disc, gstPercent: gstP, gstAmount: gstAmt, total, paymentMode, date, notes: notes.trim(),
            })}
          >
            Generate invoice
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceView({ invoice, business, onClose }) {
  const printRef = useRef(null);
  const handleShare = async () => {
  const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], `${invoiceNoStr}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Invoice ${invoiceNoStr}` }); } catch (e) {}
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNoStr}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, "image/png");
};
  const invoiceNoStr = `BT-${String(invoice.number).padStart(4, "0")}`;

    return (
    <div id="gt-invoice-overlay" style={styles.modalOverlay} onClick={onClose}>
      <style>{`
  @page { margin: 10mm; }
  @media print {
    html, body { height: auto !important; overflow: visible !important; }
    body * { visibility: hidden; }
    #gt-invoice-print, #gt-invoice-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    #gt-invoice-overlay { position: static !important; background: none !important; padding: 0 !important; display: block !important; }
    #gt-invoice-modal { max-height: none !important; overflow: visible !important; padding: 0 !important; max-width: none !important; }
    #gt-invoice-print {
      position: static !important; width: 100%; margin: 0; padding: 24px; background: #fff !important;
      page-break-after: avoid; break-after: avoid;
    }
  }
`}</style>
   <div id="gt-invoice-modal" style={{ ...styles.modal, maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
       <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Invoice {invoiceNoStr}</h2>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close"><X size={18} color="#8B8D94" /></button>
        </div>
        <div id="gt-invoice-print" ref={printRef} style={styles.invoicePaper}>
          <div style={styles.invoiceTopRow}>
            <div>
              <div style={styles.invoiceGymName}>{business.gymName || "Gym"}</div>
              {business.address && <div style={styles.invoiceMuted}>{business.address}</div>}
              {business.phone && <div style={styles.invoiceMuted}>{business.phone}</div>}
              {business.gstin && <div style={styles.invoiceMuted}>GSTIN: {business.gstin}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={styles.invoiceLabel}>INVOICE</div>
              <div style={styles.invoiceMuted}>{invoiceNoStr}</div>
              <div style={styles.invoiceMuted}>{fmtDate(invoice.date)}</div>
            </div>
          </div>

          <div style={styles.invoiceDivider} />

          <div style={styles.invoiceTopRow}>
            <div>
              <div style={styles.invoiceLabelSmall}>Billed to</div>
              <div style={styles.invoiceBoldRow}>{invoice.memberName}</div>
              <div style={styles.invoiceMuted}>{invoice.memberPhone}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={styles.invoiceLabelSmall}>Payment mode</div>
              <div style={styles.invoiceBoldRow}>{invoice.paymentMode}</div>
            </div>
          </div>

          <table style={styles.invoiceTable}>
            <thead>
              <tr>
                <th style={styles.invoiceTh}>Description</th>
                <th style={{ ...styles.invoiceTh, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.invoiceTd}>
                  {invoice.plan} membership<br />
                  <span style={styles.invoiceMutedSmall}>{fmtDate(invoice.periodStart)} – {fmtDate(invoice.periodEnd)}</span>
                  {invoice.notes && <><br /><span style={styles.invoiceMutedSmall}>{invoice.notes}</span></>}
                </td>
                <td style={{ ...styles.invoiceTd, textAlign: "right" }}>{rupee(invoice.amount)}</td>
              </tr>
              {invoice.discount > 0 && (
                <tr>
                  <td style={styles.invoiceTd}>Discount</td>
                  <td style={{ ...styles.invoiceTd, textAlign: "right" }}>−{rupee(invoice.discount)}</td>
                </tr>
              )}
              {invoice.gstPercent > 0 && (
                <tr>
                  <td style={styles.invoiceTd}>GST ({invoice.gstPercent}%)</td>
                  <td style={{ ...styles.invoiceTd, textAlign: "right" }}>{rupee(invoice.gstAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={styles.invoiceDivider} />
          <div style={styles.invoiceTotalRow}>
            <span>Total paid</span>
            <span>{rupee(invoice.total)}</span>
          </div>
          <div style={styles.invoiceFooter}>Thank you for training with {business.gymName || "us"}.</div>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.secondaryBtn} onClick={onClose}>Close</button>
          <button style={{ ...styles.primaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={handleShare}>
  <Printer size={16} /> Share / Save Invoice
</button>
        </div>
      </div>
    </div>
  );
}

function BusinessSettingsForm({ business, onSave, onCancel }) {
  const [gymName, setGymName] = useState(business.gymName);
  const [address, setAddress] = useState(business.address);
  const [phone, setPhone] = useState(business.phone);
  const [gstin, setGstin] = useState(business.gstin);

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Invoice details</h2>
          <button style={styles.iconBtn} onClick={onCancel} aria-label="Close"><X size={18} color="#8B8D94" /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={styles.label}>Gym name (shown on invoice)
            <input style={styles.input} value={gymName} onChange={(e) => setGymName(e.target.value)} />
          </label>
          <label style={styles.label}>Address
            <input style={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label style={styles.label}>Phone
            <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label style={styles.label}>GSTIN (leave blank if not registered)
            <input style={styles.input} value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </label>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.secondaryBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.primaryBtn} onClick={() => onSave({ ...business, gymName: gymName.trim() || "Gym", address: address.trim(), phone: phone.trim(), gstin: gstin.trim() })}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function GymTracker() {
  const { members, checkins, invoices, business, saveMembers, saveCheckins, saveInvoices, saveBusiness, loaded, error } = useGymData();
  const [tab, setTab] = useState("members");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [waMember, setWaMember] = useState(null);
  const [invoiceMember, setInvoiceMember] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleInstalled = () => { setInstallPrompt(null); setIsInstalled(true); };
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const today = todayISO();
  const enriched = useMemo(() => members.map((m) => ({ ...m, status: statusOf(m) })), [members, today]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = enriched;
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
    if (tab === "expiring") list = list.filter((m) => m.status.tone === "expiring" || m.status.tone === "expired");
    return list.sort((a, b) => a.status.daysLeft - b.status.daysLeft);
  }, [enriched, query, tab]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...invoices].sort((a, b) => b.number - a.number);
    if (q) list = list.filter((i) => i.memberName.toLowerCase().includes(q) || String(i.number).includes(q));
    return list;
  }, [invoices, query]);

  const checkedInToday = checkins.filter((c) => c.date === today);
  const activeCount = enriched.filter((m) => m.status.tone === "active").length;
  const expiringCount = enriched.filter((m) => m.status.tone === "expiring" || m.status.tone === "expired").length;
  const isCheckedIn = (id) => checkedInToday.some((c) => c.memberId === id);

  const toggleCheckin = (member) => {
    if (isCheckedIn(member.id)) saveCheckins(checkins.filter((c) => !(c.memberId === member.id && c.date === today)));
    else saveCheckins([...checkins, { memberId: member.id, date: today, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
  };

  const upsertMember = (m) => {
    const exists = members.some((x) => x.id === m.id);
    saveMembers(exists ? members.map((x) => (x.id === m.id ? m : x)) : [...members, m]);
    setShowForm(false);
    setEditing(null);
  };

  const deleteMember = (id) => {
    saveMembers(members.filter((m) => m.id !== id));
    saveCheckins(checkins.filter((c) => c.memberId !== id));
    setConfirmDelete(null);
  };

  const saveInvoice = (inv) => {
    saveInvoices([...invoices, inv]);
    saveBusiness({ ...business, nextInvoiceNo: business.nextInvoiceNo + 1 });
    setInvoiceMember(null);
    setViewInvoice(inv);
  };

  return (
    <div style={styles.page}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        body { margin: 0; }
        input:focus, select:focus, textarea:focus, button:focus-visible { outline: 2px solid #C9A24B; outline-offset: 1px; }
        input::placeholder, textarea::placeholder { color: #6B6D74; }
        @media (max-width: 640px) { .gt-hide-sm { display: none !important; } }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}><Dumbbell size={20} color="#14151A" /></div>
          <div>
            <div style={styles.gymName}>{business.gymName?.toUpperCase() || "GYM"}</div>
            <div style={styles.gymSub}>Member Tracker</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {installPrompt && !isInstalled && (
            <button
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#C9A24B", color: "#14151A", border: "none", borderRadius: 999, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              onClick={handleInstallClick}
            >
              <Download size={14} /> Install
            </button>
          )}
          <button style={styles.iconBtn} onClick={() => setShowSettings(true)} aria-label="Invoice settings"><Settings size={17} color="#8B8D94" /></button>
          <div style={styles.dateBadge}>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</div>
        </div>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {!loaded ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8B8D94", fontFamily: "'Inter', sans-serif" }}>Loading...</div>
      ) : (
        <>
          <div style={styles.statsRow}>
            <StatCard icon={<Users size={16} color="#C9A24B" />} label="Active" value={activeCount} />
            <StatCard icon={<AlertTriangle size={16} color="#C9A24B" />} label="Expiring / Expired" value={expiringCount} />
            <StatCard icon={<LogIn size={16} color="#C9A24B" />} label="Checked in today" value={checkedInToday.length} />
          </div>

          <div style={styles.toolbar}>
            <div style={styles.searchWrap}>
              <Search size={16} color="#6B6D74" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input style={styles.searchInput} placeholder={tab === "invoices" ? "Search by name or invoice #" : "Search by name or number"} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {tab !== "invoices" && (
              <button style={styles.primaryBtn} onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Add member</button>
            )}
          </div>

          <div style={styles.tabs}>
            <button style={{ ...styles.tab, ...(tab === "members" ? styles.tabActive : {}) }} onClick={() => setTab("members")}>All members ({members.length})</button>
            <button style={{ ...styles.tab, ...(tab === "expiring" ? styles.tabActive : {}) }} onClick={() => setTab("expiring")}>
              <CalendarClock size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Needs renewal ({expiringCount})
            </button>
            <button style={{ ...styles.tab, ...(tab === "invoices" ? styles.tabActive : {}) }} onClick={() => setTab("invoices")}>
              <Receipt size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Invoices ({invoices.length})
            </button>
          </div>

          {tab !== "invoices" ? (
            <div style={styles.list}>
              {filtered.length === 0 && (
                <div style={styles.emptyState}>{members.length === 0 ? "No members yet. Add your first member to start tracking." : "No members match your search."}</div>
              )}
              {filtered.map((m) => (
                <div key={m.id} style={styles.card}>
                  <div style={styles.cardMain}>
                    <div style={styles.avatar}>{m.name.trim().charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={styles.memberName}>{m.name}</div>
                      <div style={styles.memberMeta}>{m.plan} · {fmtDate(m.startDate)} → {fmtDate(m.endDate)}</div>
                      <div style={styles.memberMetaSub} className="gt-hide-sm">{m.phone}</div>
                    </div>
                    <PlateBadge daysLeft={m.status.daysLeft} tone={m.status.tone} />
                  </div>
                  <div style={styles.cardActions}>
                    <button style={{ ...styles.actionBtn, ...(isCheckedIn(m.id) ? styles.actionBtnActive : {}) }} onClick={() => toggleCheckin(m)}>
                      <LogIn size={14} /> {isCheckedIn(m.id) ? "Checked in" : "Check in"}
                    </button>
                    <button style={styles.actionBtnGhost} onClick={() => setWaMember(m)}><MessageCircle size={14} /> Message</button>
                    <button style={styles.actionBtnGhost} onClick={() => setInvoiceMember(m)}><Receipt size={14} /> Invoice</button>
                    <button style={styles.iconBtn} onClick={() => { setEditing(m); setShowForm(true); }} aria-label="Edit"><Pencil size={15} color="#8B8D94" /></button>
                    <button style={styles.iconBtn} onClick={() => setConfirmDelete(m)} aria-label="Delete"><Trash2 size={15} color="#8B8D94" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.list}>
              {filteredInvoices.length === 0 && <div style={styles.emptyState}>No invoices generated yet. Tap Invoice on any member to create one.</div>}
              {filteredInvoices.map((inv) => (
                <div key={inv.id} style={styles.card} onClick={() => setViewInvoice(inv)}>
                  <div style={styles.cardMain}>
                    <div style={styles.avatar}><Receipt size={16} color="#C9A24B" /></div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={styles.memberName}>BT-{String(inv.number).padStart(4, "0")} · {inv.memberName}</div>
                      <div style={styles.memberMeta}>{inv.plan} · {fmtDate(inv.date)} · {inv.paymentMode}</div>
                    </div>
                    <div style={{ fontFamily: "'Oswald', sans-serif", color: "#F2F1ED", fontWeight: 600, fontSize: 15 }}>{rupee(inv.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && <MemberForm initial={editing} onSave={upsertMember} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      {waMember && <WhatsAppPanel member={waMember} onClose={() => setWaMember(null)} />}
      {invoiceMember && (
        <InvoiceForm member={invoiceMember} business={business} nextInvoiceNo={business.nextInvoiceNo} onSave={saveInvoice} onCancel={() => setInvoiceMember(null)} />
      )}
      {viewInvoice && <InvoiceView invoice={viewInvoice} business={business} onClose={() => setViewInvoice(null)} />}
      {showSettings && <BusinessSettingsForm business={business} onSave={(b) => { saveBusiness(b); setShowSettings(false); }} onCancel={() => setShowSettings(false)} />}
      {confirmDelete && (
        <div style={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...styles.modal, maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Remove {confirmDelete.name}?</h2>
            <p style={{ color: "#8B8D94", fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.5 }}>This deletes their membership record and check-in history. Past invoices are kept. This can't be undone.</p>
            <div style={styles.modalFooter}>
              <button style={styles.secondaryBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={{ ...styles.primaryBtn, background: "#C1553D" }} onClick={() => deleteMember(confirmDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>{icon}<span style={styles.statLabel}>{label}</span></div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#14151A", fontFamily: "'Inter', sans-serif", paddingBottom: 40 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px", borderBottom: "1px solid #23252C" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 8, background: "#C9A24B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  gymName: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 1.5, color: "#F2F1ED", lineHeight: 1.1, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  gymSub: { fontSize: 11, color: "#8B8D94", letterSpacing: 0.5, marginTop: 2 },
  dateBadge: { fontSize: 12, color: "#8B8D94", border: "1px solid #2A2C34", padding: "5px 10px", borderRadius: 999 },
  errorBanner: { margin: "12px 16px 0", padding: "10px 14px", background: "#3E2020", color: "#E17B6A", borderRadius: 8, fontSize: 13 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "16px 16px 0" },
  statCard: { background: "#1E2027", border: "1px solid #262832", borderRadius: 12, padding: "12px 12px" },
  statTop: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 },
  statLabel: { fontSize: 11, color: "#8B8D94", letterSpacing: 0.2 },
  statValue: { fontFamily: "'Oswald', sans-serif", fontSize: 26, fontWeight: 600, color: "#F2F1ED" },
  toolbar: { display: "flex", gap: 10, padding: "16px 16px 0" },
  searchWrap: { position: "relative", flex: 1 },
  searchInput: { width: "100%", background: "#1E2027", border: "1px solid #262832", borderRadius: 10, padding: "10px 12px 10px 34px", color: "#F2F1ED", fontSize: 14 },
  tabs: { display: "flex", gap: 8, padding: "16px 16px 0", flexWrap: "wrap" },
  tab: { background: "transparent", border: "1px solid #262832", color: "#8B8D94", borderRadius: 999, padding: "7px 14px", fontSize: 12.5, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500 },
  tabActive: { background: "#C9A24B", borderColor: "#C9A24B", color: "#14151A", fontWeight: 600 },
  list: { display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px 0" },
  emptyState: { textAlign: "center", color: "#6B6D74", padding: "40px 20px", fontSize: 14, border: "1px dashed #262832", borderRadius: 12 },
  card: { background: "#1E2027", border: "1px solid #262832", borderRadius: 14, padding: 14, cursor: "default" },
  cardMain: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "#2A2C34", color: "#C9A24B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 16, flexShrink: 0 },
  memberName: { color: "#F2F1ED", fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  memberMeta: { color: "#9A9CA3", fontSize: 12.5, marginTop: 2 },
  memberMetaSub: { color: "#6B6D74", fontSize: 12, marginTop: 1 },
  cardActions: { display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" },
  actionBtn: { display: "flex", alignItems: "center", gap: 6, background: "#262832", color: "#C9CACE", border: "1px solid #2E313C", borderRadius: 8, padding: "7px 11px", fontSize: 12.5, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500 },
  actionBtnActive: { background: "#1F3B2C", borderColor: "#2E5A41", color: "#7FD99A" },
  actionBtnGhost: { display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "#8B8D94", border: "1px solid #2E313C", borderRadius: 8, padding: "7px 11px", fontSize: 12.5, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500 },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto" },
  primaryBtn: { display: "flex", alignItems: "center", gap: 6, background: "#C9A24B", color: "#14151A", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
  secondaryBtn: { background: "transparent", color: "#8B8D94", border: "1px solid #2E313C", borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(10,10,12,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 },
  modal: { background: "#1B1C22", border: "1px solid #262832", borderRadius: 16, padding: 20, width: "100%", maxWidth: 440, maxHeight: "88vh", overflowY: "auto" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontFamily: "'Oswald', sans-serif", color: "#F2F1ED", fontSize: 18, fontWeight: 600, margin: 0 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#8B8D94", fontWeight: 500 },
  input: { background: "#14151A", border: "1px solid #2E313C", borderRadius: 8, padding: "9px 10px", color: "#F2F1ED", fontSize: 13.5, fontFamily: "'Inter', sans-serif" },
  textarea: { width: "100%", background: "#14151A", border: "1px solid #2E313C", borderRadius: 8, padding: "10px", color: "#F2F1ED", fontSize: 13.5, fontFamily: "'Inter', sans-serif", resize: "vertical" },
  chip: { background: "#262832", border: "1px solid #2E313C", color: "#9A9CA3", borderRadius: 999, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
  chipActive: { background: "#C9A24B", borderColor: "#C9A24B", color: "#14151A", fontWeight: 600 },
  totalBox: { background: "#14151A", border: "1px solid #2E313C", borderRadius: 10, padding: "12px 14px", marginTop: 6 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#9A9CA3", padding: "2px 0" },
  invoicePaper: { background: "#F7F5F0", color: "#1A1A1A", borderRadius: 10, padding: 22, fontFamily: "'Inter', sans-serif" },
  invoiceTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  invoiceGymName: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: 0.5 },
  invoiceLabel: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 1.5, color: "#8A6A1F" },
  invoiceLabelSmall: { fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.6, color: "#8A8A8A", marginBottom: 3 },
  invoiceMuted: { fontSize: 12, color: "#5A5A5A", marginTop: 2 },
  invoiceMutedSmall: { fontSize: 11, color: "#7A7A7A" },
  invoiceBoldRow: { fontSize: 14, fontWeight: 600 },
  invoiceDivider: { height: 1, background: "#D8D3C6", margin: "14px 0" },
  invoiceTable: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  invoiceTh: { textAlign: "left", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.5, color: "#8A8A8A", borderBottom: "1px solid #D8D3C6", padding: "6px 0" },
  invoiceTd: { fontSize: 13, padding: "10px 0", borderBottom: "1px solid #E8E4D8", verticalAlign: "top" },
  invoiceTotalRow: { display: "flex", justifyContent: "space-between", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, marginTop: 4 },
  invoiceFooter: { fontSize: 11.5, color: "#8A8A8A", marginTop: 18, textAlign: "center" },
};
