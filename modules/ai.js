// js/modules/ai.js - FINAL cocok dengan app.js line 403 di screenshot
import {
  $,
  fmt,
  money,
  physical,
  invest,
  debts,
  pendapatan,
  pengeluaran,
  anggaran,
  showToast,
} from "../app.js";

// --- HITUNG DATA DARI FILE LAMA ---
function getData() {
  const tUang = money.reduce((s, x) => s + (x.balance || 0), 0);
  const tInvestModal = invest.reduce((s, x) => s + (x.nilai || 0), 0);
  const tInvestMarket = invest.reduce(
    (s, x) => s + (x.marketValue || x.nilai || 0),
    0,
  );
  const floating = tInvestMarket - tInvestModal;
  const hari = new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
  const keluarHari = pengeluaran
    .filter(
      (h) =>
        new Date(h.tgl).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta",
        }) === hari,
    )
    .reduce((s, x) => s + x.jml, 0);
  const masukHari = pendapatan
    .filter(
      (h) =>
        new Date(h.tgl).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta",
        }) === hari,
    )
    .reduce((s, x) => s + x.jml, 0);
  const byCat = {};
  pengeluaran.forEach((e) => {
    byCat[e.kat] = (byCat[e.kat] || 0) + e.jml;
  });
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  return {
    tUang,
    tInvestModal,
    tInvestMarket,
    floating,
    keluarHari,
    masukHari,
    byCat,
    top,
    totalAset: tUang + tInvestModal,
  };
}

// --- RENDER DI BERANDA (id="aiInsight") ---
export function renderAI() {
  const el = $("aiInsight");
  const autoEl = $("aiAutoInsight");
  const statusEl = $("aiStatus");
  const { top, keluarHari, masukHari, floating, totalAset, tUang } = getData();

  if (!el && !autoEl) return;

  let health = "Sehat",
    color = "#0E9F6E",
    msg = `Saldo cash Rp ${fmt(tUang)}. Hari ini +Rp ${fmt(masukHari)} / -Rp ${fmt(keluarHari)}`;
  if (masukHari - keluarHari < -50000) {
    health = "Boros";
    color = "#E02424";
    msg = `Hari ini minus Rp ${fmt(keluarHari - masukHari)}. Top: ${top ? top[0] : "-"} Rp ${top ? fmt(top[1]) : 0}`;
  } else if (floating < -200000) {
    health = "Floating Minus";
    color = "#F59E0B";
    msg = `BBCA floating Rp ${fmt(floating)}. Total aset Rp ${fmt(totalAset)}`;
  }

  if (el) {
    el.innerHTML = `
      <div class="card" style="border-left:4px solid ${color};margin:12px 14px">
        <div style="display:flex;justify-content:space-between"><b>🤖 AI Insight</b><span style="font-size:10px;padding:4px 8px;border-radius:999px;background:${color};color:#fff;font-weight:700">${health}</span></div>
        <div style="margin-top:8px;font-size:13px;line-height:1.4">${msg}</div>
        ${top ? `<div style="margin-top:6px;font-size:11px;color:#64748B">Boros: ${top[0]} Rp ${fmt(top[1])}</div>` : ""}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button class="btn-outline" style="margin:0;font-size:11px" onclick="openTab('ai')">Buka AI Chat</button><button class="btn-outline" style="margin:0;font-size:11px" onclick="quickAI('Saran hemat')">Saran Hemat</button></div>
      </div>`;
  }
  if (autoEl) {
    autoEl.innerHTML = `${msg}<br><small style="color:#94A3B8">Total Aset: Rp ${fmt(totalAset)} | Floating: ${floating >= 0 ? "+" : ""}Rp ${fmt(floating)} (Belum Real)</small>`;
  }
  if (statusEl) {
    statusEl.textContent = `${health} - Aset Rp ${fmt(totalAset)} - Hari ini ${masukHari - keluarHari >= 0 ? "+" : ""}Rp ${fmt(masukHari - keluarHari)}`;
  }
}

// --- CHAT AI ---
function addChat(role, text) {
  const box = $("aiChatBox");
  if (!box) return;
  const div = document.createElement("div");
  div.style.cssText = `padding:10px 12px;border-radius:12px;font-size:13px;line-height:1.4;max-width:85%;${role === "user" ? "background:#0F172A;color:#fff;align-self:flex-end" : "background:#F1F5F9;color:#0F172A;align-self:flex-start;border:1px solid #E2E8F0"}`;
  div.innerHTML = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

export function sendAI() {
  const input = $("aiInput");
  if (!input || !input.value.trim()) return;
  const q = input.value.trim();
  input.value = "";
  addChat("user", q);
  setTimeout(() => replyAI(q), 300);
}

export function quickAI(text) {
  const input = $("aiInput");
  if (input) input.value = text;
  sendAI();
}

function replyAI(q) {
  const {
    tUang,
    tInvestModal,
    floating,
    keluarHari,
    masukHari,
    top,
    byCat,
    totalAset,
  } = getData();
  q = q.toLowerCase();
  let ans = "";

  if (
    q.includes("-1.150") ||
    q.includes("minus") ||
    q.includes("boros") ||
    q.includes("kenapa")
  ) {
    ans = `Beranda kamu -Rp 1.150.000 kemarin karena: <br>• Keluar hari ini Rp ${fmt(keluarHari)}<br>• Masuk Rp ${fmt(masukHari)}<br>• Top kategori: ${top ? top[0] + " Rp " + fmt(top[1]) : "-"}<br><br>Saran: Kurangi ${top ? top[0] : "Bensin/Makan"} 20%. Floating BBCA Rp ${fmt(floating)} itu <b>belum real</b>, jangan dihitung ke cash.`;
  } else if (
    q.includes("bbca") ||
    q.includes("floating") ||
    q.includes("saham")
  ) {
    const b = invest.find((x) => (x.nama || "").toUpperCase().includes("BBCA"));
    if (b)
      ans = `BBCA: ${b.lot || 0} lot @ Rp ${fmt(b.avg || 0)}<br>Modal: Rp ${fmt(b.nilai || 0)}<br>Market: Rp ${fmt(b.marketValue || b.nilai || 0)}<br>Floating: <b style="color:${(b.floating || 0) >= 0 ? "#0E9F6E" : "#E02424"}">${(b.floating || 0) >= 0 ? "+" : ""}Rp ${fmt(b.floating || 0)}</b> (Belum Real)<br>Total aset kamu Rp ${fmt(totalAset)}`;
    else
      ans = `Floating total Rp ${fmt(floating)} dari ${invest.length} investasi. Modal Rp ${fmt(tInvestModal)}.`;
  } else if (q.includes("hemat") || q.includes("saran")) {
    ans = `Top 3 boros:<br>${Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((x, i) => `${i + 1}. ${x[0]} Rp ${fmt(x[1])}`)
      .join(
        "<br>",
      )}<br><br>Hemat 20% dari ${top ? top[0] : "top"} = Rp ${fmt((top ? top[1] : 0) * 0.2)}/bulan`;
  } else if (q.includes("prediksi") || q.includes("akhir bulan")) {
    const d = new Date().getDate();
    const keluarBulan = pengeluaran
      .filter((h) => new Date(h.tgl).getMonth() === new Date().getMonth())
      .reduce((s, x) => s + x.jml, 0);
    const rata = keluarBulan / (d || 1);
    ans = `Prediksi: rata harian Rp ${fmt(Math.round(rata))} x 30 = Rp ${fmt(Math.round(rata * 30))}<br>Cash sekarang Rp ${fmt(tUang)}<br>${rata * 30 > tUang ? "⚠️ Bakal minus, stop Kopi/Rokok dulu" : "✅ Aman"}`;
  } else {
    ans = `Halo! Data kamu:<br>• Cash Rp ${fmt(tUang)}<br>• Invest modal Rp ${fmt(tInvestModal)}<br>• Floating ${floating >= 0 ? "+" : ""}Rp ${fmt(floating)}<br>• Hari ini ${masukHari - keluarHari >= 0 ? "+" : ""}Rp ${fmt(masukHari - keluarHari)}<br><br>Tanya: "Kenapa boros?", "Floating BBCA?", "Saran hemat"`;
  }
  addChat("ai", ans);
}

// Auto refresh
setInterval(renderAI, 2000);
setTimeout(renderAI, 500);

// Expose ke window biar onclick di HTML baru jalan
window.renderAI = renderAI;
window.sendAI = sendAI;
window.quickAI = quickAI;
window.addChat = addChat;
