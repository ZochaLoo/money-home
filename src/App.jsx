import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const DEFAULT_CATS = {
  餐饮: { icon: "🍜", kw: ["吃","午餐","晚餐","早餐","喝","cafe","饭","餐","咖啡","tea","奶茶","饮料","宵夜","nasi","makan","food","lunch","dinner","breakfast"] },
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

const COLORS = ["#E8913A","#5BA88B","#D4637A","#6B8DD6","#C4A24E","#9B6DB7","#4DBFBF","#E06B5E","#7EC4A0","#D49B4E","#8B7EC4","#C47E9B","#5BAFC4","#C4C45B","#6BC4A8","#B88BD6","#D6A86B","#6B9FD6","#88C47E","#D66B8B"];
const STORAGE_KEY = "zocha-expenses";
const fDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fTime = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
const dayNames = ["日","一","二","三","四","五","六"];

export default function App() {
  const [entries, setEntries] = useState([]);
  const [cats, setCats] = useState(DEFAULT_CATS);
  const [fixed, setFixed] = useState(DEFAULT_FIXED);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [view, setView] = useState("chat");
  const [selMonth, setSelMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
  const [pending, setPending] = useState(null);
  const [fixedChecked, setFixedChecked] = useState({});
  const [fixedAmounts, setFixedAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [settingsTab, setSettingsTab] = useState("cats");
  const [newCat, setNewCat] = useState({ name: "", icon: "", kw: "" });
  const [newFixed, setNewFixed] = useState({ name: "", amount: "", category: "" });
  const [editingId, setEditingId] = useState(null);
  const [editAmt, setEditAmt] = useState("");
  const [editCatKey, setEditCatKey] = useState(null);
  const [editCatData, setEditCatData] = useState({ name: "", icon: "", kw: "" });
  const [editFixedIdx, setEditFixedIdx] = useState(null);
  const [editFixedData, setEditFixedData] = useState({ name: "", amount: "", category: "" });
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.entries) setEntries(d.entries);
        if (d.cats) setCats(d.cats);
        if (d.fixed) setFixed(d.fixed);
        if (d.fixedAmounts) setFixedAmounts(d.fixedAmounts);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, cats, fixed, fixedAmounts })); } catch (e) {}
    }
  }, [entries, cats, fixed, fixedAmounts, loading]);

  useEffect(() => {
    if (!loading && messages.length === 0) {
      setMessages([{ type: "bot", time: fTime(new Date()), text: "嗨！直接输入消费就行 😊\n\n📝「午餐 12」「toll 1.5」\n🔄「转账 2000」不计消费\n✏️「改」修改上一条分类\n🗑️「删除」删除上一条\n\n默认Debit，可写tng或信用卡" }]);
    }
  }, [loading]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    setFixedAmounts(prev => {
      const next = { ...prev };
      fixed.forEach((f, i) => { if (next[i] === undefined) next[i] = f.amount; });
      return next;
    });
  }, [fixed]);

  const addMsg = (type, text, extra) => setMessages(p => [...p, { type, text, time: fTime(new Date()), ...(extra || {}) }]);

  function detectPayment(t) {
    const l = t.toLowerCase();
    if (l.includes("tng") || l.includes("touch n go")) return "TNG";
    if (l.includes("信用卡") || l.includes("credit")) return "信用卡";
    if (l.includes("cash") || l.includes("现金")) return "现金";
    return "Debit";
  }

  function detectCategory(t) {
    const l = t.toLowerCase();
    for (const [c, info] of Object.entries(cats)) {
      for (const k of (info.kw || [])) { if (l.includes(k)) return c; }
    }
    return null;
  }

  function parseExpense(text) {
    const l = text.toLowerCase().trim();
    const m = l.match(/(\d+\.?\d*)/);
    if (!m) return null;
    const amount = parseFloat(m[1]);
    if (amount <= 0 || isNaN(amount)) return null;
    if (/转账|transfer/.test(l)) return { amount, category: "转账", payment: "Debit", isTransfer: true, icon: "🔄", raw: text };
    const payment = detectPayment(l);
    const category = detectCategory(l);
    if (category) return { amount, category, payment, isTransfer: false, icon: cats[category]?.icon || "📝", raw: text };
    return { amount, category: null, payment, isTransfer: false, icon: "❓", raw: text };
  }

  function saveEntry(data) {
    const now = new Date();
    const entry = { ...data, id: Date.now() + Math.random(), date: fDate(now), time: fTime(now) };
    setEntries(p => [...p, entry]);
    return entry;
  }

  function handleCatSelect(cat) {
    if (!pending) return;
    const icon = cats[cat]?.icon || "📝";
    if (pending.type === "new") {
      const s = saveEntry({ ...pending.data, category: cat, icon });
      addMsg("user", cat);
      addMsg("bot", `${icon} ${cat} RM${s.amount.toFixed(2)} · ${s.payment} · ${parseInt(s.date.split("-")[2])}/${parseInt(s.date.split("-")[1])}`);
    } else if (pending.type === "edit") {
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
      const last = entries.filter(e => !e.isTransfer).slice(-1)[0];
      addMsg("user", text);
      if (last) { setPending({ type: "edit", data: last }); addMsg("bot", `✏️「${last.raw}」${last.icon} ${last.category} RM${last.amount.toFixed(2)}\n\n改成哪个？`, { showCats: true }); }
      else addMsg("bot", "没有可修改的记录");
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
    for (const line of lines) { const p = parseExpense(line); if (!p) continue; if (p.category === null) ask = p; else ok.push(saveEntry(p)); }
    if (ok.length > 0) {
      const res = ok.map(r => r.isTransfer ? `🔄 转账 RM${r.amount.toFixed(2)}（不计消费）` : `${r.icon} ${r.category} RM${r.amount.toFixed(2)} · ${r.payment} · ${parseInt(r.date.split("-")[2])}/${parseInt(r.date.split("-")[1])}`);
      const sp = ok.filter(r => !r.isTransfer);
      if (sp.length > 1) res.push(`\n💰 共 RM${sp.reduce((s, r) => s + r.amount, 0).toFixed(2)}`);
      addMsg("bot", res.join("\n"));
    }
    if (ask) { setPending({ type: "new", data: ask }); addMsg("bot", `🤔「${ask.raw}」RM${ask.amount.toFixed(2)}\n归到哪个分类？`, { showCats: true }); }
    else if (ok.length === 0 && !ask) addMsg("bot", "🤔 没识别到金额\n\n记账：「午餐 12」\n改分类：「改」\n删除：「删除」");
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
      added.push({ amount: amt, category: f.category, payment: "Debit", isTransfer: false, icon: f.icon, raw: f.name, id: Date.now() + Math.random() + i, date: fDate(now), time: fTime(now) });
    }
    setEntries(p => [...p, ...added]);
    setView("chat");
    const total = added.reduce((s, e) => s + e.amount, 0);
    addMsg("bot", `📌 已记录 ${added.length} 笔：\n\n${added.map(e => `${e.icon} ${e.raw} RM${e.amount.toFixed(2)}`).join("\n")}\n\n💰 固定开销共 RM${total.toFixed(2)}`);
    setFixedChecked({});
  }

  function startEditCat(key) {
    setEditCatKey(key);
    setEditCatData({ name: key, icon: cats[key]?.icon || "", kw: (cats[key]?.kw || []).join(", ") });
  }

  function saveEditCat() {
    if (!editCatKey || !editCatData.name.trim()) return;
    const newKw = editCatData.kw.split(/[,，]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    setCats(p => {
      const next = {};
      for (const [k, v] of Object.entries(p)) {
        if (k === editCatKey) next[editCatData.name.trim()] = { icon: editCatData.icon.trim() || v.icon, kw: newKw };
        else next[k] = v;
      }
      return next;
    });
    if (editCatData.name.trim() !== editCatKey) {
      setEntries(p => p.map(e => e.category === editCatKey ? { ...e, category: editCatData.name.trim() } : e));
    }
    setEditCatKey(null);
  }

  function startEditFixed(idx) {
    const f = fixed[idx];
    setEditFixedIdx(idx);
    setEditFixedData({ name: f.name, amount: String(f.amount), category: f.category });
  }

  function saveEditFixed() {
    if (editFixedIdx === null) return;
    const cat = editFixedData.category || Object.keys(cats)[0];
    const icon = cats[cat]?.icon || "📌";
    setFixed(p => p.map((f, i) => i === editFixedIdx ? { name: editFixedData.name.trim(), amount: parseFloat(editFixedData.amount) || 0, category: cat, icon } : f));
    setEditFixedIdx(null);
  }

  const catList = Object.keys(cats);
  const mE = entries.filter(e => e.date.startsWith(selMonth) && !e.isTransfer);
  const mT = mE.reduce((s, e) => s + e.amount, 0);
  const tT = entries.filter(e => e.date.startsWith(selMonth) && e.isTransfer).reduce((s, e) => s + e.amount, 0);
  const cT = {}; mE.forEach(e => { cT[e.category] = (cT[e.category] || 0) + e.amount; });
  const pie = Object.entries(cT).map(([n, v]) => ({ name: n, value: Math.round(v * 100) / 100 })).sort((a, b) => b.value - a.value);
  const todayT = entries.filter(e => e.date === fDate(new Date()) && !e.isTransfer).reduce((s, e) => s + e.amount, 0);
  const mons = [...new Set(entries.map(e => e.date.slice(0, 7)))].sort().reverse();
  if (!mons.includes(selMonth)) mons.unshift(selMonth);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0D0F11", color: "#fff", fontFamily: "'Noto Sans SC',sans-serif" }}><p>加载中...</p></div>;

  const tabBtn = k => ({ flex: 1, padding: "7px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500, background: view === k ? "#E8913A" : "#1A1D21", color: view === k ? "#fff" : "#6B7280" });
  const monBtn = m => ({ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0, background: selMonth === m ? "#E8913A" : "#1A1D21", color: selMonth === m ? "#fff" : "#6B7280" });
  const iS = { padding: "8px 12px", borderRadius: 8, border: "1px solid #2A2D32", background: "#0D0F11", color: "#E8E6E1", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "#0D0F11", color: "#E8E6E1", fontFamily: "'Noto Sans SC','SF Pro Display',sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />

      <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid #1A1D21" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🏠 Money Home 记账</h1>
          <div style={{ fontSize: 12, color: "#6B7280" }}>今日 <span style={{ color: "#E8913A", fontWeight: 600 }}>RM{todayT.toFixed(2)}</span></div>
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 12 }}>
          {[{ k: "chat", l: "记账" }, { k: "fixed", l: "固定" }, { k: "stats", l: "统计" }, { k: "history", l: "记录" }, { k: "settings", l: "⚙️" }].map(t =>
            <button key={t.k} onClick={() => setView(t.k)} style={tabBtn(t.k)}>{t.l}</button>
          )}
        </div>
      </div>

      {view === "chat" && (<>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 8px" }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start", marginBottom: msg.showCats ? 6 : 10 }}>
                <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line", background: msg.type === "user" ? "#E8913A" : "#1A1D21", color: msg.type === "user" ? "#fff" : "#E8E6E1", borderBottomRightRadius: msg.type === "user" ? 4 : 16, borderBottomLeftRadius: msg.type === "bot" ? 4 : 16 }}>
                  {msg.text}
                  <div style={{ fontSize: 10, marginTop: 3, textAlign: "right", color: msg.type === "user" ? "rgba(255,255,255,0.6)" : "#4B5563" }}>{msg.time}</div>
                </div>
              </div>
              {msg.showCats && pending && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10, paddingLeft: 4 }}>
                  {catList.map(c => <button key={c} onClick={() => handleCatSelect(c)} style={{ padding: "5px 10px", borderRadius: 20, border: "1px solid #2A2D32", background: "#1A1D21", color: "#E8E6E1", fontSize: 11, cursor: "pointer" }}>{cats[c]?.icon} {c}</button>)}
                </div>
              )}
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid #1A1D21", background: "#13161A", display: "flex", gap: 8, alignItems: "center" }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSend(); }} placeholder="午餐 12 / 改 / 删除" style={{ flex: 1, padding: "11px 16px", borderRadius: 24, border: "1px solid #2A2D32", background: "#0D0F11", color: "#E8E6E1", fontSize: 15, outline: "none", fontFamily: "inherit" }} />
          <button onClick={handleSend} style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: "#E8913A", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
        </div>
      </>)}

      {view === "fixed" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: "#6B7280" }}>勾选要记录的</span>
            <button onClick={() => { const allOn = fixed.every((_, i) => fixedChecked[i]); const n = {}; if (!allOn) fixed.forEach((_, i) => { n[i] = true; }); setFixedChecked(n); }} style={{ padding: "4px 12px", borderRadius: 16, border: "1px solid #2A2D32", background: "#1A1D21", color: "#E8E6E1", fontSize: 12, cursor: "pointer" }}>
              {fixed.every((_, i) => fixedChecked[i]) ? "取消全选" : "全选"}
            </button>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, overflowY: "auto" }}>
            {fixed.map((f, i) => (
              <div key={i} onClick={() => setFixedChecked(p => ({ ...p, [i]: !p[i] }))} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10, cursor: "pointer", background: fixedChecked[i] ? "#1E2A1E" : "#1A1D21", border: fixedChecked[i] ? "1px solid #2D4A2D" : "1px solid transparent" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: fixedChecked[i] ? "none" : "2px solid #3A3D42", background: fixedChecked[i] ? "#5BA88B" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{fixedChecked[i] ? "✓" : ""}</div>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{f.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{f.name}</div><div style={{ fontSize: 10, color: "#4B5563" }}>{f.category}</div></div>
                <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", marginRight: 3 }}>RM</span>
                  <input value={fixedAmounts[i] !== undefined ? fixedAmounts[i] : f.amount} onChange={e => setFixedAmounts(p => ({ ...p, [i]: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }))} style={{ width: 55, padding: "3px 6px", borderRadius: 6, border: "1px solid #2A2D32", background: "#0D0F11", color: "#E8E6E1", fontSize: 12, textAlign: "right", outline: "none", fontFamily: "inherit" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, padding: "0 4px" }}>
              <span style={{ color: "#6B7280" }}>已选 {Object.values(fixedChecked).filter(Boolean).length} 项</span>
              <span style={{ color: "#E8913A", fontWeight: 600 }}>RM{Object.entries(fixedChecked).filter(([, v]) => v).reduce((s, [i]) => s + (fixedAmounts[parseInt(i)] || 0), 0).toFixed(2)}</span>
            </div>
            <button onClick={recordFixed} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: "#E8913A", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>📌 记录已选开销</button>
          </div>
        </div>
      )}

      {view === "stats" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>{mons.map(m => <button key={m} onClick={() => setSelMonth(m)} style={monBtn(m)}>{m}</button>)}</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: 14, borderRadius: 14, background: "#1A1D21" }}><div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>月度消费</div><div style={{ fontSize: 24, fontWeight: 700, color: "#E8913A" }}>RM{mT.toFixed(2)}</div><div style={{ fontSize: 11, color: "#4B5563", marginTop: 3 }}>{mE.length} 笔</div></div>
            <div style={{ flex: 1, padding: 14, borderRadius: 14, background: "#1A1D21" }}><div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>账户转账</div><div style={{ fontSize: 24, fontWeight: 700, color: "#6B8DD6" }}>RM{tT.toFixed(2)}</div><div style={{ fontSize: 11, color: "#4B5563", marginTop: 3 }}>不计消费</div></div>
          </div>
          {pie.length > 0 ? (<>
            <div style={{ height: 200, marginBottom: 8 }}><ResponsiveContainer><PieChart><Pie data={pie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">{pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={v => "RM" + v.toFixed(2)} contentStyle={{ background: "#1A1D21", border: "1px solid #2A2D32", borderRadius: 8, color: "#E8E6E1", fontSize: 12 }} /></PieChart></ResponsiveContainer></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {pie.map((item, i) => { const pct = ((item.value / mT) * 100).toFixed(1); return (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 12, background: "#1A1D21" }}>
                  <span style={{ fontSize: 16 }}>{cats[item.name]?.icon || "📝"}</span>
                  <div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</span><span style={{ fontSize: 12, fontWeight: 600, color: COLORS[i % COLORS.length] }}>RM{item.value.toFixed(2)}</span></div><div style={{ height: 3, borderRadius: 2, background: "#2A2D32" }}><div style={{ height: "100%", borderRadius: 2, width: pct + "%", background: COLORS[i % COLORS.length] }} /></div></div>
                  <span style={{ fontSize: 11, color: "#6B7280", minWidth: 36, textAlign: "right" }}>{pct}%</span>
                </div>); })}
            </div>
          </>) : <div style={{ textAlign: "center", padding: 40, color: "#4B5563" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><p>这个月还没有记录</p></div>}
        </div>
      )}

      {view === "history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>{mons.map(m => <button key={m} onClick={() => setSelMonth(m)} style={monBtn(m)}>{m}</button>)}</div>
          {(() => {
            const filtered = entries.filter(e => e.date.startsWith(selMonth)).reverse();
            const grouped = {}; filtered.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
            if (!Object.keys(grouped).length) return <div style={{ textAlign: "center", padding: 40, color: "#4B5563" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><p>这个月还没有记录</p></div>;
            return Object.entries(grouped).map(([date, items]) => {
              const dT = items.filter(e => !e.isTransfer).reduce((s, e) => s + e.amount, 0);
              const pts = date.split("-");
              return (
                <div key={date} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, padding: "0 4px" }}>
                    <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{parseInt(pts[1])}月{parseInt(pts[2])}日 · 星期{dayNames[new Date(date).getDay()]}</span>
                    <span style={{ fontSize: 13, color: "#E8913A", fontWeight: 600 }}>-RM{dT.toFixed(2)}</span>
                  </div>
                  {items.map(entry => (
                    <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10, background: "#1A1D21", marginBottom: 4 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{entry.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{entry.isTransfer ? "账户转账" : entry.category}</div>
                        <div style={{ fontSize: 11, color: "#4B5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.raw} · {entry.payment} · {entry.time}</div>
                      </div>
                      {editingId === entry.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>RM</span>
                          <input autoFocus value={editAmt} onChange={e => setEditAmt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { const v = parseFloat(editAmt); if (!isNaN(v) && v > 0) setEntries(p => p.map(x => x.id === entry.id ? { ...x, amount: v } : x)); setEditingId(null); } }} style={{ width: 55, padding: "3px 6px", borderRadius: 6, border: "1px solid #E8913A", background: "#0D0F11", color: "#E8E6E1", fontSize: 13, textAlign: "right", outline: "none" }} />
                          <button onClick={() => { const v = parseFloat(editAmt); if (!isNaN(v) && v > 0) setEntries(p => p.map(x => x.id === entry.id ? { ...x, amount: v } : x)); setEditingId(null); }} style={{ background: "none", border: "none", color: "#5BA88B", cursor: "pointer", fontSize: 14 }}>✓</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, color: entry.isTransfer ? "#6B8DD6" : "#E8E6E1", whiteSpace: "nowrap", flexShrink: 0 }}>RM{entry.amount.toFixed(2)}</div>
                      )}
                      <button onClick={() => { setEditingId(entry.id); setEditAmt(String(entry.amount)); }} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 12, padding: "2px", flexShrink: 0 }}>✏️</button>
                      <button onClick={() => setEntries(p => p.filter(x => x.id !== entry.id))} style={{ background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 15, padding: "2px", flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      )}

      {view === "settings" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            <button onClick={() => setSettingsTab("cats")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: settingsTab === "cats" ? "#E8913A" : "#1A1D21", color: settingsTab === "cats" ? "#fff" : "#6B7280" }}>分类管理</button>
            <button onClick={() => setSettingsTab("fixed")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: settingsTab === "fixed" ? "#E8913A" : "#1A1D21", color: settingsTab === "fixed" ? "#fff" : "#6B7280" }}>固定开销</button>
          </div>

          {settingsTab === "cats" && (<>
            <div style={{ background: "#1A1D21", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>➕ 添加分类</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input placeholder="😀" value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))} style={{ ...iS, width: 50, textAlign: "center" }} />
                <input placeholder="分类名称" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} style={{ ...iS, flex: 1 }} />
              </div>
              <input placeholder="关键词（逗号分隔）" value={newCat.kw} onChange={e => setNewCat(p => ({ ...p, kw: e.target.value }))} style={{ ...iS, width: "100%", marginBottom: 8 }} />
              <button onClick={() => { if (!newCat.name.trim()) return; setCats(p => ({ ...p, [newCat.name.trim()]: { icon: newCat.icon.trim() || "📌", kw: newCat.kw.split(/[,，]/).map(s => s.trim().toLowerCase()).filter(Boolean) } })); setNewCat({ name: "", icon: "", kw: "" }); }} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#5BA88B", color: "#fff", fontSize: 13, cursor: "pointer" }}>添加</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {catList.map(c => (
                <div key={c} style={{ background: "#1A1D21", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{cats[c]?.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c}</div>
                      <div style={{ fontSize: 10, color: "#4B5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(cats[c]?.kw || []).join(", ")}</div>
                    </div>
                    <button onClick={() => startEditCat(c)} style={{ background: "none", border: "none", color: "#6B8DD6", cursor: "pointer", fontSize: 12, padding: "4px 6px", flexShrink: 0 }}>编辑</button>
                    <button onClick={() => setCats(p => { const n = { ...p }; delete n[c]; return n; })} style={{ background: "none", border: "none", color: "#D4637A", cursor: "pointer", fontSize: 12, padding: "4px 6px", flexShrink: 0 }}>删除</button>
                  </div>
                  {editCatKey === c && (
                    <div style={{ padding: "8px 10px 10px", borderTop: "1px solid #2A2D32" }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input value={editCatData.icon} onChange={e => setEditCatData(p => ({ ...p, icon: e.target.value }))} style={{ ...iS, width: 44, textAlign: "center", fontSize: 12, padding: "6px" }} />
                        <input value={editCatData.name} onChange={e => setEditCatData(p => ({ ...p, name: e.target.value }))} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px" }} />
                      </div>
                      <input value={editCatData.kw} onChange={e => setEditCatData(p => ({ ...p, kw: e.target.value }))} placeholder="关键词（逗号分隔）" style={{ ...iS, width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 6 }} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={saveEditCat} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: "#5BA88B", color: "#fff", fontSize: 12, cursor: "pointer" }}>保存</button>
                        <button onClick={() => setEditCatKey(null)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #2A2D32", background: "transparent", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>取消</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}

          {settingsTab === "fixed" && (<>
            <div style={{ background: "#1A1D21", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>➕ 添加固定开销</div>
              <input placeholder="名称" value={newFixed.name} onChange={e => setNewFixed(p => ({ ...p, name: e.target.value }))} style={{ ...iS, width: "100%", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input placeholder="金额" type="number" value={newFixed.amount} onChange={e => setNewFixed(p => ({ ...p, amount: e.target.value }))} style={{ ...iS, flex: 1 }} />
                <select value={newFixed.category} onChange={e => setNewFixed(p => ({ ...p, category: e.target.value }))} style={{ ...iS, flex: 1 }}>
                  <option value="">选择分类</option>
                  {catList.map(c => <option key={c} value={c}>{cats[c]?.icon} {c}</option>)}
                </select>
              </div>
              <button onClick={() => { if (!newFixed.name.trim() || !newFixed.amount) return; const cat = newFixed.category || catList[0]; setFixed(p => [...p, { name: newFixed.name.trim(), amount: parseFloat(newFixed.amount) || 0, category: cat, icon: cats[cat]?.icon || "📌" }]); setNewFixed({ name: "", amount: "", category: "" }); }} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#5BA88B", color: "#fff", fontSize: 13, cursor: "pointer" }}>添加</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {fixed.map((f, i) => (
                <div key={i} style={{ background: "#1A1D21", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: "#4B5563" }}>{f.category} · RM{f.amount}</div>
                    </div>
                    <button onClick={() => startEditFixed(i)} style={{ background: "none", border: "none", color: "#6B8DD6", cursor: "pointer", fontSize: 12, padding: "4px 6px", flexShrink: 0 }}>编辑</button>
                    <button onClick={() => setFixed(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#D4637A", cursor: "pointer", fontSize: 12, padding: "4px 6px", flexShrink: 0 }}>删除</button>
                  </div>
                  {editFixedIdx === i && (
                    <div style={{ padding: "8px 10px 10px", borderTop: "1px solid #2A2D32" }}>
                      <input value={editFixedData.name} onChange={e => setEditFixedData(p => ({ ...p, name: e.target.value }))} style={{ ...iS, width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 6 }} />
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input type="number" value={editFixedData.amount} onChange={e => setEditFixedData(p => ({ ...p, amount: e.target.value }))} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px" }} />
                        <select value={editFixedData.category} onChange={e => setEditFixedData(p => ({ ...p, category: e.target.value }))} style={{ ...iS, flex: 1, fontSize: 12, padding: "6px 8px" }}>
                          {catList.map(c => <option key={c} value={c}>{cats[c]?.icon} {c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={saveEditFixed} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: "#5BA88B", color: "#fff", fontSize: 12, cursor: "pointer" }}>保存</button>
                        <button onClick={() => setEditFixedIdx(null)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #2A2D32", background: "transparent", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>取消</button>
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
