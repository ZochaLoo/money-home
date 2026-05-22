import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const DEFAULT_INCOME_CATS = {
  薪水: { icon: "💰", kw: ["薪水","salary","工资","pay","月薪"] },
  副业: { icon: "💼", kw: ["副业","freelance","外快","接单","side","客户","client","咨询费","宝典"] },
  投资: { icon: "📈", kw: ["投资","investment","股息","dividend","利息","回报"] },
};

const DEFAULT_SAVINGS_CATS = {
  "RYT Bank": { icon: "🏦", kw: ["ryt","ryt bank"] },
  TNG: { icon: "📱", kw: ["tng存","tng储蓄","tng go+","go+"] },
  银行: { icon: "🏛️", kw: ["银行存","bank存","maybank存","hlb存","public bank"] },
  Funds: { icon: "📊", kw: ["fund","fd","定存","基金","fixed deposit"] },
};

const DEFAULT_EXPENSE_CATS = {
  餐饮: { icon: "🍜", kw: ["吃","午餐","晚餐","早餐","喝","cafe","饭","餐","咖啡","tea","奶茶","饮料","宵夜","nasi","makan","food","lunch","dinner"] },
  交通: { icon: "🚗", kw: ["toll","parking","grab","uber","bus","train","mrt","lrt","车费","过路费","停车"] },
  车油: { icon: "⛽", kw: ["油","petrol","fuel","加油","shell","petronas","caltex"] },
  日常用品: { icon: "🛒", kw: ["超市","日用","grocery","watson","guardian","aeon","tesco","纸巾","清洁"] },
  租金: { icon: "🏠", kw: ["租金","rent","房租"] },
  Household: { icon: "🏡", kw: ["household","maintenance","维护费","管理费"] },
  保健: { icon: "💊", kw: ["药","医","clinic","pharmacy","doctor","保健","vitamin","中药","看病"] },
  保险: { icon: "🛡️", kw: ["保险","insurance","aia","prudential","allianz"] },
  娱乐: { icon: "🎬", kw: ["电影","玩","游戏","movie","game","karaoke","concert","酒吧"] },
  Shopee: { icon: "🛍️", kw: ["shopee","lazada","淘宝","taobao","网购"] },
  贷款: { icon: "🏦", kw: ["贷款","loan","还贷","分期","installment","供车","ptptn","供期"] },
  家用: { icon: "👩‍👧", kw: ["家用","给爸","给妈","family","父母","家里","给家"] },
  水电费: { icon: "💡", kw: ["电费","水费","electricity","water","tnb","tenaga"] },
  网费: { icon: "🌐", kw: ["网费","wifi","broadband","internet","unifi"] },
  手机费: { icon: "📱", kw: ["手机费","话费","topup","reload","电话费","celcom","digi","hotlink","phone bill"] },
  网盘: { icon: "☁️", kw: ["网盘","cloud","icloud","google drive","storage","dropbox"] },
  美容: { icon: "💅", kw: ["美容","美甲","护肤","skincare","facial","美发","haircut","理发","化妆品","salon"] },
  书本: { icon: "📚", kw: ["书","book","读物","杂志","kindle"] },
  学习: { icon: "🎓", kw: ["课程","学习","course","培训","workshop","学费","教程"] },
  AI工具: { icon: "🤖", kw: ["ai","claude","chatgpt","openai","anthropic","midjourney","canva pro","gpt","copilot","max plan","pro plan"] },
  工作开支: { icon: "💼", kw: ["google business","google meet","办公","business","zoom"] },
};

const DEFAULT_FIXED = [
  { name: "保险", amount: 0, category: "保险", icon: "🛡️" },
  { name: "电费", amount: 0, category: "水电费", icon: "💡" },
  { name: "水费", amount: 0, category: "水电费", icon: "💡" },
  { name: "网费", amount: 0, category: "网费", icon: "🌐" },
];

const COLORS = ["#FF8A00","#015697","#FFF2DF","#bf5af2","#ffcc02","#E85555","#4A9FD6","#D4A574","#ff9f0a","#ac8e68","#5e5ce6","#C47E5A","#2A7BC4","#ffd60a","#8B6F47","#da8fff","#FFa040","#3A8FBF"];
const STORAGE_KEY = "zocha-expenses";
const fDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fTime = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
const dayNames = ["日","一","二","三","四","五","六"];

const glow = (color, intensity = 12) => `0 0 ${intensity}px ${color}40, 0 0 ${intensity * 2}px ${color}20`;
const cardStyle = { background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" };

export default function App() {
  const [entries, setEntries] = useState([]);
  const [incomeCats, setIncomeCats] = useState(DEFAULT_INCOME_CATS);
  const [expenseCats, setExpenseCats] = useState(DEFAULT_EXPENSE_CATS);
  const [savingsCats, setSavingsCats] = useState(DEFAULT_SAVINGS_CATS);
  const [fixed, setFixed] = useState(DEFAULT_FIXED);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [view, setView] = useState("chat");
  const [selMonth, setSelMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [pending, setPending] = useState(null);
  const [fixedChecked, setFixedChecked] = useState({});
  const [fixedAmounts, setFixedAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [settingsTab, setSettingsTab] = useState("expense");
  const [newItem, setNewItem] = useState({ name: "", icon: "", kw: "" });
  const [newFixed, setNewFixed] = useState({ name: "", amount: "", category: "" });
  const [editingId, setEditingId] = useState(null);
  const [editAmt, setEditAmt] = useState("");
  const [editKey, setEditKey] = useState(null);
  const [editData, setEditData] = useState({ name: "", icon: "", kw: "" });
  const [editFixedIdx, setEditFixedIdx] = useState(null);
  const [editFixedData, setEditFixedData] = useState({ name: "", amount: "", category: "" });
  const [showQuery, setShowQuery] = useState(false);
  const [qStart, setQStart] = useState("");
  const [qEnd, setQEnd] = useState("");
  const [qType, setQType] = useState("expense");
  const [qCat, setQCat] = useState("all");
  const [budget, setBudget] = useState(0);
  const [editBudget, setEditBudget] = useState(false);
  const [trendCat, setTrendCat] = useState("all");
  const [trendType, setTrendType] = useState("expense");
  const chatEnd = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.entries) setEntries(d.entries.map(e => ({ ...e, type: e.type || (e.isTransfer ? "transfer" : "expense") })));
        if (d.incomeCats) setIncomeCats(d.incomeCats);
        if (d.expenseCats) setExpenseCats(d.expenseCats);
        if (d.savingsCats) setSavingsCats(d.savingsCats);
        if (d.fixed) setFixed(d.fixed);
        if (d.fixedAmounts) setFixedAmounts(d.fixedAmounts);
        if (d.budget) setBudget(d.budget);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, incomeCats, expenseCats, savingsCats, fixed, fixedAmounts, budget })); } catch (e) {}
    }
  }, [entries, incomeCats, expenseCats, savingsCats, fixed, fixedAmounts, budget, loading]);

  useEffect(() => { if (!loading && messages.length === 0) setMessages([{ type: "bot", time: fTime(new Date()), text: "嗨！记账、记收入、记储蓄都行 😊\n\n💸「午餐 12」→ 支出\n💰「薪水 8000」→ 收入\n🏦「储蓄 ryt 2000」→ 储蓄\n✏️「改」修改上一条\n🗑️「删除」删除上一条\n\n默认Debit，可写tng或信用卡" }]); }, [loading]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setFixedAmounts(p => { const n = { ...p }; fixed.forEach((f, i) => { if (n[i] === undefined) n[i] = f.amount; }); return n; }); }, [fixed]);

  const addMsg = (type, text, extra) => setMessages(p => [...p, { type, text, time: fTime(new Date()), ...(extra || {}) }]);

  function detectType(t) {
    const l = t.toLowerCase();
    if (/储蓄|存钱|save|存入/.test(l)) return "savings";
    if (/收入|income/.test(l)) return "income";
    for (const [, info] of Object.entries(incomeCats)) { for (const k of info.kw) { if (l.includes(k)) return "income"; } }
    for (const [, info] of Object.entries(savingsCats)) { for (const k of info.kw) { if (l.includes(k)) return "savings"; } }
    return "expense";
  }

  function detectCategory(t, type) {
    const l = t.toLowerCase();
    const catMap = type === "income" ? incomeCats : type === "savings" ? savingsCats : expenseCats;
    for (const [c, info] of Object.entries(catMap)) { for (const k of (info.kw || [])) { if (l.includes(k)) return c; } }
    return null;
  }

  function detectPayment(t) {
    const l = t.toLowerCase();
    if (l.includes("tng") || l.includes("touch n go")) return "TNG";
    if (l.includes("信用卡") || l.includes("credit")) return "信用卡";
    if (l.includes("cash") || l.includes("现金")) return "现金";
    return "Debit";
  }

  function getCatMap(type) { return type === "income" ? incomeCats : type === "savings" ? savingsCats : expenseCats; }

  function parseInput(text) {
    const l = text.toLowerCase().trim();
    const m = l.match(/(\d+\.?\d*)/);
    if (!m) return null;
    const amount = parseFloat(m[1]);
    if (amount <= 0 || isNaN(amount)) return null;
    const type = detectType(l);
    const category = detectCategory(l, type);
    const payment = type === "expense" ? detectPayment(l) : "Debit";
    const catMap = getCatMap(type);
    if (category) return { amount, type, category, payment, icon: catMap[category]?.icon || "📝", raw: text };
    return { amount, type, category: null, payment, icon: "❓", raw: text };
  }

  function saveEntry(data) {
    const now = new Date();
    const entry = { ...data, id: Date.now() + Math.random(), date: fDate(now), time: fTime(now) };
    setEntries(p => [...p, entry]);
    return entry;
  }

  function handleCatSelect(cat) {
    if (!pending) return;
    const catMap = getCatMap(pending.data.type);
    const icon = catMap[cat]?.icon || "📝";
    if (pending.mode === "new") {
      const s = saveEntry({ ...pending.data, category: cat, icon });
      const prefix = s.type === "income" ? "💰" : s.type === "savings" ? "🏦" : "💸";
      addMsg("user", cat);
      addMsg("bot", `${prefix} ${icon} ${cat} RM${s.amount.toFixed(2)} · ${parseInt(s.date.split("-")[2])}/${parseInt(s.date.split("-")[1])}`);
    } else if (pending.mode === "edit") {
      setEntries(p => p.map(e => e.id === pending.data.id ? { ...e, category: cat, icon } : e));
      addMsg("user", cat);
      addMsg("bot", `✅ 已改为 ${icon} ${cat}`);
    }
    setPending(null);
  }

  function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    const lower = text.toLowerCase();
    setInput("");

    if (/^(改|改分类|换分类|edit)$/i.test(lower)) {
      const last = entries.slice(-1)[0];
      addMsg("user", text);
      if (last) {
        setPending({ mode: "edit", data: last, catType: last.type });
        addMsg("bot", `✏️「${last.raw}」${last.icon} ${last.category} RM${last.amount.toFixed(2)}\n\n改成哪个？`, { showCats: true, catType: last.type });
      } else addMsg("bot", "没有可修改的记录");
      return;
    }
    if (/^(删除|删|delete|undo)$/i.test(lower)) {
      addMsg("user", text);
      if (entries.length > 0) { const last = entries[entries.length - 1]; setEntries(p => p.slice(0, -1)); addMsg("bot", `🗑️ 已删除：「${last.raw}」RM${last.amount.toFixed(2)}`); }
      else addMsg("bot", "没有记录可删除");
      return;
    }

    addMsg("user", text);
    const lines = text.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean);
    const ok = []; let ask = null;
    for (const line of lines) {
      const p = parseInput(line);
      if (!p) continue;
      if (p.category === null) { ask = p; } else { ok.push(saveEntry(p)); }
    }
    if (ok.length > 0) {
      const res = ok.map(r => {
        const prefix = r.type === "income" ? "💰 收入" : r.type === "savings" ? "🏦 储蓄" : "💸 支出";
        return `${prefix} ${r.icon} ${r.category} RM${r.amount.toFixed(2)} · ${parseInt(r.date.split("-")[2])}/${parseInt(r.date.split("-")[1])}`;
      });
      addMsg("bot", res.join("\n"));
    }
    if (ask) {
      setPending({ mode: "new", data: ask, catType: ask.type });
      const label = ask.type === "income" ? "收入" : ask.type === "savings" ? "储蓄" : "支出";
      addMsg("bot", `🤔「${ask.raw}」RM${ask.amount.toFixed(2)}（${label}）\n归到哪个分类？`, { showCats: true, catType: ask.type });
    } else if (ok.length === 0 && !ask) {
      addMsg("bot", "🤔 没识别到金额\n\n支出：「午餐 12」\n收入：「薪水 8000」\n储蓄：「储蓄 ryt 2000」");
    }
  }

  function recordFixed() {
    const now = new Date();
    const sel = Object.entries(fixedChecked).filter(([, v]) => v).map(([i]) => parseInt(i));
    if (!sel.length) return;
    const added = [];
    for (const i of sel) {
      const f = fixed[i]; if (!f) continue;
      const amt = fixedAmounts[i] !== undefined ? fixedAmounts[i] : f.amount;
      if (amt <= 0) continue;
      added.push({ amount: amt, type: "expense", category: f.category, payment: "Debit", icon: f.icon, raw: f.name, id: Date.now() + Math.random() + i, date: fDate(now), time: fTime(now) });
    }
    setEntries(p => [...p, ...added]);
    setView("chat");
    const total = added.reduce((s, e) => s + e.amount, 0);
    addMsg("bot", `📌 已记录 ${added.length} 笔：\n\n${added.map(e => `${e.icon} ${e.raw} RM${e.amount.toFixed(2)}`).join("\n")}\n\n💸 固定开销共 RM${total.toFixed(2)}`);
    setFixedChecked({});
  }

  function getCatListForSettings() {
    if (settingsTab === "income") return [incomeCats, setIncomeCats];
    if (settingsTab === "savings") return [savingsCats, setSavingsCats];
    return [expenseCats, setExpenseCats];
  }

  // Computed
  const isAll = selMonth === "all";
  const me = isAll ? entries : entries.filter(e => e.date.startsWith(selMonth));
  const incomeTotal = me.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expenseTotal = me.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const savingsTotal = me.filter(e => e.type === "savings").reduce((s, e) => s + e.amount, 0);
  const balance = incomeTotal - expenseTotal - savingsTotal;
  const expEntries = me.filter(e => e.type === "expense");
  const cT = {}; expEntries.forEach(e => { cT[e.category] = (cT[e.category] || 0) + e.amount; });
  const pie = Object.entries(cT).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 })).sort((a, b) => b.value - a.value);
  const incEntries = me.filter(e => e.type === "income");
  const incT = {}; incEntries.forEach(e => { incT[e.category] = (incT[e.category] || 0) + e.amount; });
  const incBreakdown = Object.entries(incT).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 })).sort((a, b) => b.value - a.value);
  const savEntries = me.filter(e => e.type === "savings");
  const savT = {}; savEntries.forEach(e => { savT[e.category] = (savT[e.category] || 0) + e.amount; });
  const savBreakdown = Object.entries(savT).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 })).sort((a, b) => b.value - a.value);
  const todayT = entries.filter(e => e.date === fDate(new Date()) && e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const mons = [...new Set(entries.map(e => e.date.slice(0, 7)))].sort().reverse();
  if (!mons.includes(selMonth) && selMonth !== "all") mons.unshift(selMonth);
  const expCatList = Object.keys(expenseCats);
  const incCatList = Object.keys(incomeCats);
  const savCatList = Object.keys(savingsCats);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh", background: "#08090d", color: "#fff", fontFamily: "'Noto Sans SC',sans-serif" }}><p>加载中...</p></div>;

  const tabBtn = k => ({
    flex: 1, padding: "7px 0", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
    background: view === k ? "linear-gradient(135deg, #FF8A00, #FFa040)" : "rgba(255,255,255,0.05)",
    color: view === k ? "#fff" : "#666",
    boxShadow: view === k ? glow("#FF8A00", 8) : "none",
  });
  const monBtn = m => ({
    padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0,
    background: selMonth === m ? "linear-gradient(135deg, #FF8A00, #FFa040)" : "rgba(255,255,255,0.05)",
    color: selMonth === m ? "#fff" : "#666",
    boxShadow: selMonth === m ? glow("#FF8A00", 6) : "none",
  });
  const iS = { padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e0e0e0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #08090d 0%, #0d0e14 50%, #0a0b10 100%)", color: "#e0e0e0", fontFamily: "'Noto Sans SC','SF Pro Display',sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.5, background: "linear-gradient(135deg, #FF8A00, #FFB347)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🏠 Money Home</h1>
          <div style={{ fontSize: 12, color: "#666" }}>今日支出 <span style={{ color: "#FF8A00", fontWeight: 600 }}>RM{todayT.toFixed(2)}</span></div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
          {[{ k: "chat", l: "记账" }, { k: "fixed", l: "固定" }, { k: "stats", l: "统计" }, { k: "history", l: "记录" }, { k: "settings", l: "⚙️" }].map(t =>
            <button key={t.k} onClick={() => setView(t.k)} style={tabBtn(t.k)}>{t.l}</button>
          )}
        </div>
      </div>

      {/* CHAT */}
      {view === "chat" && (<>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 8px" }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start", marginBottom: msg.showCats ? 6 : 10 }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line",
                  background: msg.type === "user" ? "linear-gradient(135deg, #FF8A00, #FFa040)" : "rgba(255,255,255,0.06)",
                  color: msg.type === "user" ? "#fff" : "#e0e0e0",
                  boxShadow: msg.type === "user" ? glow("#FF8A00", 6) : "none",
                  borderBottomRightRadius: msg.type === "user" ? 4 : 16, borderBottomLeftRadius: msg.type === "bot" ? 4 : 16
                }}>
                  {msg.text}
                  <div style={{ fontSize: 10, marginTop: 3, textAlign: "right", color: msg.type === "user" ? "rgba(255,255,255,0.6)" : "#444" }}>{msg.time}</div>
                </div>
              </div>
              {msg.showCats && pending && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10, paddingLeft: 4 }}>
                  {Object.keys(getCatMap(msg.catType || "expense")).map(c => {
                    const catMap = getCatMap(msg.catType || "expense");
                    return <button key={c} onClick={() => handleCatSelect(c)} style={{ padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e0e0e0", fontSize: 11, cursor: "pointer" }}>{catMap[c]?.icon} {c}</button>;
                  })}
                </div>
              )}
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", gap: 8, alignItems: "center" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="午餐 12 / 薪水 8000 / 改 / 删除"
            style={{ flex: 1, padding: "11px 16px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e0e0e0", fontSize: 15, outline: "none", fontFamily: "inherit" }} />
          <button onClick={handleSend} style={{
            width: 42, height: 42, borderRadius: "50%", border: "none",
            background: "linear-gradient(135deg, #FF8A00, #FFa040)", color: "#fff", fontSize: 18,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            boxShadow: glow("#FF8A00", 8)
          }}>↑</button>
        </div>
      </>)}

      {/* FIXED */}
      {view === "fixed" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: "#666" }}>勾选要记录的</span>
            <button onClick={() => { const allOn = fixed.every((_, i) => fixedChecked[i]); const n = {}; if (!allOn) fixed.forEach((_, i) => { n[i] = true; }); setFixedChecked(n); }}
              style={{ padding: "4px 12px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e0e0e0", fontSize: 12, cursor: "pointer" }}>
              {fixed.every((_, i) => fixedChecked[i]) ? "取消全选" : "全选"}
            </button>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, overflowY: "auto" }}>
            {fixed.map((f, i) => (
              <div key={i} onClick={() => setFixedChecked(p => ({ ...p, [i]: !p[i] }))} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                background: fixedChecked[i] ? "rgba(255,138,0,0.08)" : "rgba(255,255,255,0.04)",
                border: fixedChecked[i] ? "1px solid rgba(255,138,0,0.2)" : "1px solid rgba(255,255,255,0.06)"
              }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: fixedChecked[i] ? "none" : "2px solid #333", background: fixedChecked[i] ? "#FF8A00" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", boxShadow: fixedChecked[i] ? glow("#FF8A00", 6) : "none" }}>{fixedChecked[i] ? "✓" : ""}</div>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{f.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{f.name}</div><div style={{ fontSize: 10, color: "#555" }}>{f.category}</div></div>
                <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: "#666", marginRight: 3 }}>RM</span>
                  <input value={fixedAmounts[i] !== undefined ? fixedAmounts[i] : f.amount} onChange={e => setFixedAmounts(p => ({ ...p, [i]: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }))}
                    style={{ width: 55, padding: "3px 6px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e0e0e0", fontSize: 12, textAlign: "right", outline: "none" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, padding: "0 4px" }}>
              <span style={{ color: "#666" }}>已选 {Object.values(fixedChecked).filter(Boolean).length} 项</span>
              <span style={{ color: "#FF8A00", fontWeight: 600 }}>RM{Object.entries(fixedChecked).filter(([, v]) => v).reduce((s, [i]) => s + (fixedAmounts[parseInt(i)] || 0), 0).toFixed(2)}</span>
            </div>
            <button onClick={recordFixed} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #FF8A00, #FFa040)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: glow("#FF8A00", 10) }}>📌 记录已选开销</button>
          </div>
        </div>
      )}

      {/* STATS */}
      {view === "stats" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
            <button onClick={() => setSelMonth("all")} style={monBtn("all")}>全部</button>
            {mons.map(m => <button key={m} onClick={() => setSelMonth(m)} style={monBtn(m)}>{m}</button>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={{ ...cardStyle, padding: 12, boxShadow: glow("#FFB347", 6) }}><div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>💰 收入</div><div style={{ fontSize: 20, fontWeight: 700, color: "#FFF2DF" }}>RM{incomeTotal.toFixed(2)}</div></div>
            <div style={{ ...cardStyle, padding: 12, boxShadow: glow("#FF8A00", 6) }}><div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>💸 支出</div><div style={{ fontSize: 20, fontWeight: 700, color: "#FF8A00" }}>RM{expenseTotal.toFixed(2)}</div></div>
            <div style={{ ...cardStyle, padding: 12, boxShadow: glow("#4A9FD6", 6) }}><div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>🏦 储蓄</div><div style={{ fontSize: 20, fontWeight: 700, color: "#4A9FD6" }}>RM{savingsTotal.toFixed(2)}</div></div>
            <div style={{ ...cardStyle, padding: 12, boxShadow: glow(balance >= 0 ? "#FFB347" : "#E85555", 6) }}><div style={{ fontSize: 10, color: "#666", marginBottom: 3 }}>📊 结余</div><div style={{ fontSize: 20, fontWeight: 700, color: balance >= 0 ? "#FFF2DF" : "#E85555" }}>RM{balance.toFixed(2)}</div></div>
          </div>

          {/* Trend Line Chart - only in "全部" view */}
          {isAll && (() => {
            const tCatList = trendType === "income" ? incCatList : trendType === "savings" ? savCatList : expCatList;
            const tCatMap = trendType === "income" ? incomeCats : trendType === "savings" ? savingsCats : expenseCats;
            const year = new Date().getFullYear();
            const allMonths12 = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

            let chartData, trendEntries;

            if (trendType === "overview") {
              chartData = allMonths12.map(m => {
                const total = entries.filter(e => e.date.startsWith(m) && e.type === "expense").reduce((s, e) => s + e.amount, 0);
                return { month: m.slice(5), 总支出: Math.round(total) };
              });
              trendEntries = null;
            } else {
              const filtered = entries.filter(e => e.type === trendType && (trendCat === "all" || e.category === trendCat));
              chartData = allMonths12.map(m => {
                const amt = filtered.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0);
                return { month: m.slice(5), 金额: Math.round(amt * 100) / 100 };
              });
              trendEntries = filtered.slice().reverse();
            }

            const typeColor = trendType === "income" ? "#FFF2DF" : trendType === "savings" ? "#4A9FD6" : "#FF8A00";

            return (
              <div style={{ ...cardStyle, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10 }}>📈 趋势分析</div>

                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {[{ k: "overview", l: "总览" }, { k: "expense", l: "支出" }, { k: "income", l: "收入" }, { k: "savings", l: "储蓄" }].map(t =>
                    <button key={t.k} onClick={() => { setTrendType(t.k); setTrendCat("all"); }} style={{
                      flex: 1, padding: "5px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500,
                      background: trendType === t.k ? "linear-gradient(135deg, #FF8A00, #FFa040)" : "rgba(255,255,255,0.06)",
                      color: trendType === t.k ? "#fff" : "#666"
                    }}>{t.l}</button>
                  )}
                </div>

                {trendType !== "overview" && (
                  <select value={trendCat} onChange={e => setTrendCat(e.target.value)} style={{ ...iS, width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 10 }}>
                    <option value="all">全部分类</option>
                    {tCatList.map(c => <option key={c} value={c}>{tCatMap[c]?.icon} {c}</option>)}
                  </select>
                )}

                <div style={{ height: 200, marginBottom: 8 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                      <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} width={45} />
                      <Tooltip contentStyle={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e0e0e0", fontSize: 12 }} labelStyle={{ color: "#999" }} />
                      {trendType === "overview" ? (
                        <Line type="monotone" dataKey="总支出" stroke="#FF8A00" strokeWidth={2} dot={{ r: 3, fill: "#FF8A00" }} />
                      ) : (
                        <Line type="monotone" dataKey="金额" stroke={typeColor} strokeWidth={2} dot={{ r: 4, fill: typeColor }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {trendType === "overview" && (
                  <div style={{ fontSize: 11, color: "#666", textAlign: "center" }}>显示 {year} 年每月总支出趋势</div>
                )}

                {trendEntries && trendEntries.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>📋 {trendCat === "all" ? "全部" : trendCat} · {trendEntries.length} 笔记录</div>
                    <div style={{ maxHeight: 250, overflowY: "auto" }}>
                      {trendEntries.map(e => (
                        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, flexShrink: 0 }}>{e.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.raw}</div>
                            <div style={{ fontSize: 10, color: "#555" }}>{e.date} · {e.category}</div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: typeColor, flexShrink: 0 }}>RM{e.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Budget Progress Bar */}
          {!isAll && (
            <div style={{ ...cardStyle, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 8 }}>📋 月度预算</div>
              {incomeTotal > 0 ? (() => {
                const available = incomeTotal - savingsTotal;
                const spent = expenseTotal;
                const remaining = available - spent;
                const pct = available > 0 ? Math.min((spent / available) * 100, 100) : 0;
                const overBudget = spent > available;
                const ratio = available > 0 ? spent / available : 0;
                let barColor, msg;
                if (overBudget) { barColor = "#E85555"; msg = "🔥 叫你小心花，给你花爆了现在！"; }
                else if (ratio > 0.75) { barColor = "#E85555"; msg = "🚨 好了不可以花了哦~"; }
                else if (ratio > 0.5) { barColor = "#FFB347"; msg = "⚠️ 要注意花钱哦~"; }
                else { barColor = "#4CAF50"; msg = "✨ 要精明用钱哦~"; }
                return (<>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#666" }}>收入 RM{incomeTotal.toFixed(2)} - 储蓄 RM{savingsTotal.toFixed(2)}</span>
                    <span style={{ fontSize: 11, color: "#888" }}>可花 RM{available.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#FF8A00", fontWeight: 500 }}>已花 RM{spent.toFixed(2)}</span>
                    <span style={{ fontSize: 12, color: remaining >= 0 ? "#FFF2DF" : "#E85555", fontWeight: 500 }}>剩余 RM{remaining.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", marginBottom: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 5, width: (overBudget ? 100 : pct) + "%", background: barColor, boxShadow: glow(barColor, 6), transition: "width 0.5s, background 0.3s" }} />
                  </div>
                  <div style={{ textAlign: "center", fontSize: 12, color: barColor, fontWeight: 500 }}>{msg}</div>
                  {overBudget && <div style={{ textAlign: "center", fontSize: 11, color: "#E85555", marginTop: 4 }}>超出 RM{(spent - available).toFixed(2)} 💸</div>}
                </>);
              })() : (
                <div style={{ textAlign: "center", fontSize: 12, color: "#555", padding: "8px 0" }}>请先记录本月收入，才能计算预算 💰</div>
              )}
            </div>
          )}

          {/* Custom Query */}
          <button onClick={() => setShowQuery(p => !p)} style={{
            width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
            background: showQuery ? "rgba(255,138,0,0.1)" : "rgba(255,255,255,0.04)",
            color: showQuery ? "#FF8A00" : "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12,
            textAlign: "center"
          }}>
            🔍 {showQuery ? "收起自定义查询" : "自定义区间查询"}
          </button>

          {showQuery && (() => {
            const qCatList2 = qType === "income" ? incCatList : qType === "savings" ? savCatList : expCatList;
            const qCatMap2 = qType === "income" ? incomeCats : qType === "savings" ? savingsCats : expenseCats;
            const qFiltered = entries.filter(e => {
              if (e.type !== qType) return false;
              const m = e.date.slice(0, 7);
              if (qStart && m < qStart) return false;
              if (qEnd && m > qEnd) return false;
              if (qCat !== "all" && e.category !== qCat) return false;
              return true;
            });
            const qTotal = qFiltered.reduce((s, e) => s + e.amount, 0);
            const qByMonth = {};
            qFiltered.forEach(e => { const m = e.date.slice(0, 7); qByMonth[m] = (qByMonth[m] || 0) + e.amount; });
            const qMonthList = Object.entries(qByMonth).sort((a, b) => a[0].localeCompare(b[0]));
            const qByCat = {};
            qFiltered.forEach(e => { qByCat[e.category] = (qByCat[e.category] || 0) + e.amount; });
            const qCatBreak = Object.entries(qByCat).sort((a, b) => b[1] - a[1]);
            const typeLabel = qType === "income" ? "收入" : qType === "savings" ? "储蓄" : "支出";
            const typeColor = qType === "income" ? "#FFF2DF" : qType === "savings" ? "#4A9FD6" : "#FF8A00";
            return (
              <div style={{ ...cardStyle, padding: 14, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {[{ k: "expense", l: "支出" }, { k: "income", l: "收入" }, { k: "savings", l: "储蓄" }].map(t =>
                    <button key={t.k} onClick={() => { setQType(t.k); setQCat("all"); }} style={{
                      flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500,
                      background: qType === t.k ? "linear-gradient(135deg, #FF8A00, #FFa040)" : "rgba(255,255,255,0.06)",
                      color: qType === t.k ? "#fff" : "#666"
                    }}>{t.l}</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                  <select value={qStart} onChange={e => setQStart(e.target.value)} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px", minWidth: 0 }}>
                    <option value="">开始月份</option>
                    {mons.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span style={{ color: "#666", fontSize: 12 }}>→</span>
                  <select value={qEnd} onChange={e => setQEnd(e.target.value)} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px", minWidth: 0 }}>
                    <option value="">结束月份</option>
                    {mons.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <select value={qCat} onChange={e => setQCat(e.target.value)} style={{ ...iS, width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 10 }}>
                  <option value="all">全部{typeLabel}分类</option>
                  {qCatList2.map(c => <option key={c} value={c}>{qCatMap2[c]?.icon} {c}</option>)}
                </select>
                <div style={{ ...cardStyle, padding: 12, textAlign: "center", marginBottom: 10, boxShadow: glow(typeColor, 6) }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{qStart || "最早"} ~ {qEnd || "最新"} · {qCat === "all" ? "全部" + typeLabel : qCat}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: typeColor }}>RM{qTotal.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{qFiltered.length} 笔记录</div>
                </div>
                {qMonthList.length > 1 && (<div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>按月明细</div>
                  {qMonthList.map(([m, amt]) => (
                    <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#888" }}>{m}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: typeColor }}>RM{amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>)}
                {qCat === "all" && qCatBreak.length > 1 && (<div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>按分类明细</div>
                  {qCatBreak.map(([c, amt]) => (
                    <div key={c} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#888" }}>{qCatMap2[c]?.icon} {c}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: typeColor }}>RM{amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>)}
                {qFiltered.length > 0 && (<div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>📋 全部 {qFiltered.length} 笔记录</div>
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {qFiltered.slice().reverse().map(e => (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>{e.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.raw}</div>
                          <div style={{ fontSize: 10, color: "#555" }}>{e.date} · {e.category}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: typeColor, flexShrink: 0 }}>RM{e.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>)}
              </div>
            );
          })()}

          {pie.length > 0 && (<>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#888" }}>💸 支出分布</div>
            <div style={{ height: 180, marginBottom: 8 }}><ResponsiveContainer><PieChart><Pie data={pie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" stroke="none">{pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={v => "RM" + v.toFixed(2)} contentStyle={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e0e0e0", fontSize: 12 }} labelStyle={{ color: "#999" }} itemStyle={{ color: "#e0e0e0" }} /></PieChart></ResponsiveContainer></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              {pie.map((item, i) => { const pct = ((item.value / expenseTotal) * 100).toFixed(1); return (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, ...cardStyle }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{expenseCats[item.name]?.icon || "📝"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12 }}>{item.name}</span><span style={{ fontSize: 12, fontWeight: 600, color: COLORS[i % COLORS.length] }}>RM{item.value.toFixed(2)}</span></div>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}><div style={{ height: "100%", borderRadius: 2, width: pct + "%", background: COLORS[i % COLORS.length] }} /></div>
                  </div>
                  <span style={{ fontSize: 10, color: "#666", minWidth: 34, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
                </div>); })}
            </div>
          </>)}

          {incBreakdown.length > 0 && (<>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#888" }}>💰 收入明细</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              {incBreakdown.map((item) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, ...cardStyle }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{incomeCats[item.name]?.icon || "💰"}</span>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 12 }}>{item.name}</span></div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#FFF2DF", flexShrink: 0 }}>RM{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>)}

          {savBreakdown.length > 0 && (<>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#888" }}>🏦 储蓄明细</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              {savBreakdown.map((item) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, ...cardStyle }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{savingsCats[item.name]?.icon || "🏦"}</span>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 12 }}>{item.name}</span></div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#4A9FD6", flexShrink: 0 }}>RM{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>)}

          {pie.length === 0 && incBreakdown.length === 0 && savBreakdown.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#444" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📊</div><p style={{ fontSize: 13 }}>{isAll ? "还没有任何记录" : "这个月还没有记录"}</p></div>
          )}

          {/* Export CSV */}
          {entries.length > 0 && (
            <button onClick={() => {
              const header = "日期,时间,类型,分类,金额,支付方式,备注\n";
              const rows = entries.map(e =>
                `${e.date},${e.time},${e.type === "income" ? "收入" : e.type === "savings" ? "储蓄" : "支出"},${e.category},${e.amount.toFixed(2)},${e.payment || "Debit"},"${(e.raw || "").replace(/"/g, '""')}"`
              ).join("\n");
              const bom = "﻿";
              const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `MoneyHome_${new Date().toISOString().slice(0,10)}.csv`;
              a.click(); URL.revokeObjectURL(url);
            }} style={{
              width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", color: "#888", fontSize: 13, cursor: "pointer", marginTop: 8
            }}>
              📥 导出全部数据 (CSV)
            </button>
          )}
        </div>
      )}

      {/* HISTORY */}
      {view === "history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
            <button onClick={() => setSelMonth("all")} style={monBtn("all")}>全部</button>
            {mons.map(m => <button key={m} onClick={() => setSelMonth(m)} style={monBtn(m)}>{m}</button>)}
          </div>
          {(() => {
            const filtered = (isAll ? entries : entries.filter(e => e.date.startsWith(selMonth))).slice().reverse();
            const grouped = {}; filtered.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
            if (!Object.keys(grouped).length) return <div style={{ textAlign: "center", padding: 40, color: "#444" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📋</div><p style={{ fontSize: 13 }}>{isAll ? "还没有任何记录" : "这个月还没有记录"}</p></div>;
            return Object.entries(grouped).map(([date, items]) => {
              const pts = date.split("-");
              const dayIncome = items.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
              const dayExpense = items.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
              return (
                <div key={date} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, padding: "0 4px" }}>
                    <span style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{parseInt(pts[1])}月{parseInt(pts[2])}日 · 星期{dayNames[new Date(date).getDay()]}</span>
                    <div style={{ fontSize: 12 }}>
                      {dayIncome > 0 && <span style={{ color: "#FFF2DF", marginRight: 8 }}>+RM{dayIncome.toFixed(2)}</span>}
                      {dayExpense > 0 && <span style={{ color: "#FF8A00" }}>-RM{dayExpense.toFixed(2)}</span>}
                    </div>
                  </div>
                  {items.map(entry => {
                    const typeColor = entry.type === "income" ? "#FFF2DF" : entry.type === "savings" ? "#4A9FD6" : "#e0e0e0";
                    const typePrefix = entry.type === "income" ? "+" : entry.type === "savings" ? "→" : "-";
                    return (
                      <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10, marginBottom: 4, ...cardStyle }}>
                        <span style={{ fontSize: 15, flexShrink: 0 }}>{entry.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{entry.category}</div>
                          <div style={{ fontSize: 10, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.raw} · {entry.payment} · {entry.time}</div>
                        </div>
                        {editingId === entry.id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <input autoFocus value={editAmt} onChange={e => setEditAmt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { const v = parseFloat(editAmt); if (!isNaN(v) && v > 0) setEntries(p => p.map(x => x.id === entry.id ? { ...x, amount: v } : x)); setEditingId(null); } }}
                              style={{ width: 55, padding: "3px 6px", borderRadius: 6, border: "1px solid #FF8A00", background: "rgba(255,255,255,0.04)", color: "#e0e0e0", fontSize: 12, textAlign: "right", outline: "none" }} />
                            <button onClick={() => { const v = parseFloat(editAmt); if (!isNaN(v) && v > 0) setEntries(p => p.map(x => x.id === entry.id ? { ...x, amount: v } : x)); setEditingId(null); }} style={{ background: "none", border: "none", color: "#FF8A00", cursor: "pointer", fontSize: 13 }}>✓</button>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, fontWeight: 600, color: typeColor, whiteSpace: "nowrap", flexShrink: 0 }}>{typePrefix}RM{entry.amount.toFixed(2)}</div>
                        )}
                        <button onClick={() => { setEditingId(entry.id); setEditAmt(String(entry.amount)); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 11, padding: "2px", flexShrink: 0 }}>✏️</button>
                        <button onClick={() => setEntries(p => p.filter(x => x.id !== entry.id))} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 14, padding: "2px", flexShrink: 0 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* SETTINGS */}
      {view === "settings" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
            {[{ k: "expense", l: "支出" }, { k: "income", l: "收入" }, { k: "savings", l: "储蓄" }, { k: "fixed", l: "固定开销" }].map(t =>
              <button key={t.k} onClick={() => setSettingsTab(t.k)} style={{
                flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500,
                background: settingsTab === t.k ? "linear-gradient(135deg, #FF8A00, #FFa040)" : "rgba(255,255,255,0.05)",
                color: settingsTab === t.k ? "#fff" : "#666"
              }}>{t.l}</button>
            )}
          </div>

          {(settingsTab === "expense" || settingsTab === "income" || settingsTab === "savings") && (() => {
            const [catMap, setCatMap] = getCatListForSettings();
            const list = Object.keys(catMap);
            return (<>
              <div style={{ ...cardStyle, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>➕ 添加分类</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input placeholder="😀" value={newItem.icon} onChange={e => setNewItem(p => ({ ...p, icon: e.target.value }))} style={{ ...iS, width: 44, textAlign: "center" }} />
                  <input placeholder="分类名称" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} style={{ ...iS, flex: 1 }} />
                </div>
                <input placeholder="关键词（逗号分隔）" value={newItem.kw} onChange={e => setNewItem(p => ({ ...p, kw: e.target.value }))} style={{ ...iS, width: "100%", marginBottom: 6 }} />
                <button onClick={() => { if (!newItem.name.trim()) return; setCatMap(p => ({ ...p, [newItem.name.trim()]: { icon: newItem.icon.trim() || "📌", kw: newItem.kw.split(/[,，]/).map(s => s.trim().toLowerCase()).filter(Boolean) } })); setNewItem({ name: "", icon: "", kw: "" }); }}
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF8A00, #FFa040)", color: "#000", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>添加</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {list.map(c => (
                  <div key={c} style={{ ...cardStyle, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{catMap[c]?.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{c}</div>
                        <div style={{ fontSize: 10, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(catMap[c]?.kw || []).join(", ")}</div>
                      </div>
                      <button onClick={() => { setEditKey(c); setEditData({ name: c, icon: catMap[c]?.icon || "", kw: (catMap[c]?.kw || []).join(", ") }); }}
                        style={{ background: "none", border: "none", color: "#4A9FD6", cursor: "pointer", fontSize: 11, padding: "3px 6px", flexShrink: 0 }}>编辑</button>
                      <button onClick={() => setCatMap(p => { const n = { ...p }; delete n[c]; return n; })}
                        style={{ background: "none", border: "none", color: "#E85555", cursor: "pointer", fontSize: 11, padding: "3px 6px", flexShrink: 0 }}>删除</button>
                    </div>
                    {editKey === c && (
                      <div style={{ padding: "8px 10px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <input value={editData.icon} onChange={e => setEditData(p => ({ ...p, icon: e.target.value }))} style={{ ...iS, width: 44, textAlign: "center", fontSize: 12, padding: "6px" }} />
                          <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px" }} />
                        </div>
                        <input value={editData.kw} onChange={e => setEditData(p => ({ ...p, kw: e.target.value }))} style={{ ...iS, width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 6 }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => {
                            if (!editData.name.trim()) return;
                            setCatMap(p => {
                              const n = {}; for (const [k, v] of Object.entries(p)) {
                                if (k === editKey) n[editData.name.trim()] = { icon: editData.icon.trim() || v.icon, kw: editData.kw.split(/[,，]/).map(s => s.trim().toLowerCase()).filter(Boolean) };
                                else n[k] = v;
                              } return n;
                            });
                            if (editData.name.trim() !== editKey) setEntries(p => p.map(e => e.category === editKey ? { ...e, category: editData.name.trim() } : e));
                            setEditKey(null);
                          }} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: "#FF8A00", color: "#000", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>保存</button>
                          <button onClick={() => setEditKey(null)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#666", fontSize: 12, cursor: "pointer" }}>取消</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>);
          })()}

          {settingsTab === "fixed" && (<>
            <div style={{ ...cardStyle, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>➕ 添加固定开销</div>
              <input placeholder="名称" value={newFixed.name} onChange={e => setNewFixed(p => ({ ...p, name: e.target.value }))} style={{ ...iS, width: "100%", marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input placeholder="金额" type="number" value={newFixed.amount} onChange={e => setNewFixed(p => ({ ...p, amount: e.target.value }))} style={{ ...iS, flex: 1 }} />
                <select value={newFixed.category} onChange={e => setNewFixed(p => ({ ...p, category: e.target.value }))} style={{ ...iS, flex: 1, maxWidth: "50%" }}>
                  <option value="">选分类</option>
                  {expCatList.map(c => <option key={c} value={c}>{expenseCats[c]?.icon} {c}</option>)}
                </select>
              </div>
              <button onClick={() => { if (!newFixed.name.trim() || !newFixed.amount) return; const cat = newFixed.category || expCatList[0]; setFixed(p => [...p, { name: newFixed.name.trim(), amount: parseFloat(newFixed.amount) || 0, category: cat, icon: expenseCats[cat]?.icon || "📌" }]); setNewFixed({ name: "", amount: "", category: "" }); }}
                style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF8A00, #FFa040)", color: "#000", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>添加</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {fixed.map((f, i) => (
                <div key={i} style={{ ...cardStyle, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{f.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{f.name}</div><div style={{ fontSize: 10, color: "#444" }}>{f.category} · RM{f.amount}</div></div>
                    <button onClick={() => { setEditFixedIdx(i); setEditFixedData({ name: f.name, amount: String(f.amount), category: f.category }); }}
                      style={{ background: "none", border: "none", color: "#4A9FD6", cursor: "pointer", fontSize: 11, padding: "3px 6px", flexShrink: 0 }}>编辑</button>
                    <button onClick={() => setFixed(p => p.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", color: "#E85555", cursor: "pointer", fontSize: 11, padding: "3px 6px", flexShrink: 0 }}>删除</button>
                  </div>
                  {editFixedIdx === i && (
                    <div style={{ padding: "8px 10px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <input value={editFixedData.name} onChange={e => setEditFixedData(p => ({ ...p, name: e.target.value }))} style={{ ...iS, width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 6 }} />
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input type="number" value={editFixedData.amount} onChange={e => setEditFixedData(p => ({ ...p, amount: e.target.value }))} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px" }} />
                        <select value={editFixedData.category} onChange={e => setEditFixedData(p => ({ ...p, category: e.target.value }))} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px", maxWidth: "50%" }}>
                          {expCatList.map(c => <option key={c} value={c}>{expenseCats[c]?.icon} {c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => {
                          const cat = editFixedData.category || expCatList[0];
                          setFixed(p => p.map((f2, j) => j === i ? { name: editFixedData.name.trim(), amount: parseFloat(editFixedData.amount) || 0, category: cat, icon: expenseCats[cat]?.icon || "📌" } : f2));
                          setEditFixedIdx(null);
                        }} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: "#FF8A00", color: "#000", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>保存</button>
                        <button onClick={() => setEditFixedIdx(null)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#666", fontSize: 12, cursor: "pointer" }}>取消</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}
