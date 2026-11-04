// js/modules/ai.js - FINAL APPROVED v2.8 - Fixed MasukHari + Smarter Health + V2 Monetisasi
import { $, fmt, money, invest, pendapatan, pengeluaran } from "../app.js";

// === AFFILIATE V2 - GANTI LINK KAMU ===
const AFF = {
  KTA: "https://go.accesstrade.co.id/your-kta-link", // Rp 400-800k V2
  BIBIT: "https://go.accesstrade.co.id/your-bibit-link",
  JAGO: "https://go.accesstrade.co.id/your-jago-link",
  SHOPEE_MAKAN: "https://shope.ee/your-makan-link",
  SHOPEE_BENSIN: "https://shope.ee/your-bensin-link",
  SHOPEE_FASHION: "https://shope.ee/your-fashion-link",
};

function toJakartaDateString(dateInput) {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function getData() {
  const ringkas = window.getRingkasanKeuangan
    ? window.getRingkasanKeuangan()
    : { totalFloating: 0, tUang: 0, tInvestModal: 0, tInvestPasar: 0 };
  const tUang =
    ringkas.tUang || money.reduce((s, x) => s + (x.balance || 0), 0);
  const tInvestModal =
    ringkas.tInvestModal || invest.reduce((s, x) => s + (x.nilai || 0), 0);
  const tInvestMarket =
    ringkas.tInvestPasar ||
    invest.reduce((s, x) => s + (x.marketValue || x.nilai || 0), 0);
  const floating = ringkas.totalFloating ?? tInvestMarket - tInvestModal;

  const hariStr = toJakartaDateString(new Date());

  const keluarHari = pengeluaran
    .filter((h) => toJakartaDateString(h.tgl) === hariStr)
    .reduce((s, x) => s + (x.jml || 0), 0);

  const masukHari = pendapatan
    .filter((h) => toJakartaDateString(h.tgl) === hariStr)
    .reduce((s, x) => s + (x.jml || 0), 0);

  const byCat = {};
  pengeluaran.forEach((e) => {
    const katName = String(e.kat || e.kategori || "Lainnya")
      .trim()
      .toUpperCase();
    byCat[katName] = (byCat[katName] || 0) + (e.jml || 0);
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
    totalAset: ringkas.netWorthBuku || tUang + tInvestModal,
    ringkas,
  };
}

function getAffiliateCTA(health, topCat) {
  const cat = String(topCat || "").toUpperCase();
  if (health === "Boros")
    return {
      text: "💳 Cek KTA bunga 0.9% cair 1 hari (komisi Rp600k)",
      link: AFF.KTA,
      color: "#6366F1",
    };
  if (health === "Uang Nganggur")
    return {
      text: "💰 Uang nganggur? Bibit Reksadana 6% + bonus Rp25k",
      link: AFF.BIBIT,
      color: "#0E9F6E",
    };
  if (health === "Floating Minus")
    return {
      text: "📈 Averaging BBCA? Buka RDN Bibit gratis",
      link: AFF.BIBIT,
      color: "#F59E0B",
    };
  if (cat.includes("MAKAN") || cat.includes("JAJAN") || cat.includes("KOPI"))
    return {
      text: "🛒 Voucher Shopee Food hemat 30%",
      link: AFF.SHOPEE_MAKAN,
      color: "#EE4D2D",
    };
  if (
    cat.includes("BENSIN") ||
    cat.includes("TRANSPORT") ||
    cat.includes("PARKIR")
  )
    return {
      text: "⛽ Voucher bensin Shopee Rp20k",
      link: AFF.SHOPEE_BENSIN,
      color: "#EE4D2D",
    };
  return {
    text: "🛒 Wishlist hemat di Shopee",
    link: AFF.SHOPEE_FASHION,
    color: "#EE4D2D",
  };
}

export function renderAI() {
  const el = $("aiInsight"),
    autoEl = $("aiAutoInsight"),
    statusEl = $("aiStatus");
  if (!el && !autoEl && !statusEl) return;

  const { top, keluarHari, masukHari, floating, totalAset, tUang } = getData();
  const netHariIni = masukHari - keluarHari;

  let health = "Sehat",
    color = "#0E9F6E";
  let msg = `Saldo cash Rp ${fmt(tUang)}. Hari ini +Rp ${fmt(masukHari)} / -Rp ${fmt(keluarHari)}`;

  if (netHariIni < -100000) {
    health = "Boros";
    color = "#E02424";
    msg = `Hari ini defisit Rp ${fmt(Math.abs(netHariIni))}. Terbesar: ${top ? top[0] : "-"} Rp ${top ? fmt(top[1]) : 0}`;
  } else if (floating < -200000) {
    health = "Floating Minus";
    color = "#F59E0B";
    msg = `Floating Rp ${fmt(floating)}. Total aset Rp ${fmt(totalAset)} - belum real`;
  } else if (tUang > 10000000) {
    health = "Uang Nganggur";
    color = "#0E9F6E";
    msg = `Ada Rp ${fmt(tUang)} cash nganggur - bisa dioptimalkan`;
  }

  const cta = getAffiliateCTA(health, top ? top[0] : "");

  if (el) {
    el.innerHTML = `
      <div class="card" style="border-left:4px solid ${color};margin:12px 14px">
        <div style="display:flex;justify-content:space-between">
          <b>🤖 AI ${health}</b>
          <span style="font-size:10px;padding:4px 8px;border-radius:999px;background:${color};color:#fff;font-weight:700">${health}</span>
        </div>
        <div style="margin-top:8px;font-size:13px;line-height:1.4">${msg}</div>
        ${top ? `<div style="margin-top:6px;font-size:11px;color:#64748B">Pengeluaran Tertinggi: ${top[0]} Rp ${fmt(top[1])}</div>` : ""}
        <div style="margin-top:10px">
          <a href="${cta.link}" target="_blank" style="display:block;text-align:center;background:${cta.color};color:#fff;padding:10px 12px;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none">${cta.text} →</a>
          <div style="font-size:9px;color:#94A3B8;text-align:center;margin-top:4px">Affiliate - bantu dukung MKP</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <button type="button" class="btn-outline" style="margin:0;font-size:11px" onclick="openTab('ai')">Buka AI Chat</button>
          <button type="button" class="btn-outline" style="margin:0;font-size:11px" onclick="quickAI('Saran hemat')">Saran Hemat</button>
        </div>
      </div>`;
  }

  if (autoEl) {
    autoEl.innerHTML = `${msg}<br><small style="color:#94A3B8">Aset: Rp ${fmt(totalAset)} | Floating: ${floating >= 0 ? "+" : ""}Rp ${fmt(floating)} (Belum Real)</small>`;
  }

  if (statusEl) {
    statusEl.textContent = `${health} - Aset Rp ${fmt(totalAset)} - Hari ini ${netHariIni >= 0 ? "+" : ""}Rp ${fmt(netHariIni)}`;
  }
}

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
  const { tUang, tInvestModal, floating, keluarHari, masukHari, top, byCat } =
    getData();
  const query = q.toLowerCase();
  let ans = "";
  let cta = null;

  if (
    query.includes("boros") ||
    query.includes("kenapa") ||
    query.includes("minus")
  ) {
    cta = getAffiliateCTA("Boros", top ? top[0] : "");
    ans = `Arus hari ini: Masuk Rp ${fmt(masukHari)} | Keluar Rp ${fmt(keluarHari)}.<br>Pengeluaran terbesar: ${top ? top[0] + " Rp " + fmt(top[1]) : "-"}<br>Saran: Kurangi 20% dari kategori tersebut untuk menghemat sekitar Rp ${fmt(top ? top[1] * 0.2 : 0)}.`;
  } else if (query.includes("nganggur")) {
    cta = getAffiliateCTA("Uang Nganggur", "");
    ans = `Saldo cash Anda saat ini Rp ${fmt(tUang)} menganggur. Alokasikan sebagian ke instrumen Pasar Uang untuk potensi imbal hasil ~6% per tahun.`;
  } else if (
    query.includes("bbca") ||
    query.includes("floating") ||
    query.includes("saham")
  ) {
    cta = getAffiliateCTA("Floating Minus", "");
    const b = invest.find((x) => (x.nama || "").toUpperCase().includes("BBCA"));
    if (b) {
      ans = `Posisi BBCA:<br>• Lot: ${b.lot || 0} (${fmt(b.lembar || 0)} lbr) @ Rp ${fmt(b.avgPrice || 0)}<br>• Floating: <b style="color:${(b.floating || 0) >= 0 ? "#0E9F6E" : "#E02424"}">${(b.floating || 0) >= 0 ? "+" : ""}Rp ${fmt(b.floating || 0)}</b> (Belum Real)`;
    } else {
      ans = `Total floating investasi saat ini adalah <b>${floating >= 0 ? "+" : ""}Rp ${fmt(floating)}</b> dari ${invest.length} instrumen.`;
    }
  } else if (query.includes("hemat") || query.includes("saran")) {
    const top3 = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((x, i) => `${i + 1}. ${x[0]} Rp ${fmt(x[1])}`)
      .join("<br>");
    cta = getAffiliateCTA("Sehat", top ? top[0] : "");
    ans = `Top 3 Pengeluaran Terbesar:<br>${top3 || "Belum ada data"}<br><br>Potensi hemat 20% dari kategori utama = Rp ${fmt(top ? top[1] * 0.2 : 0)}`;
  } else {
    ans = `Ringkasan Cepat:<br>• Cash: Rp ${fmt(tUang)}<br>• Modal Investasi: Rp ${fmt(tInvestModal)}<br>• Floating: ${floating >= 0 ? "+" : ""}Rp ${fmt(floating)}<br><br>Coba tanya: <i>"Kenapa boros?"</i>, <i>"Uang nganggur"</i>, atau <i>"Floating BBCA"</i>`;
  }

  if (cta) {
    ans += `<br><br><a href="${cta.link}" target="_blank" style="display:inline-block;background:${cta.color};color:#fff;padding:8px 12px;border-radius:8px;font-size:11px;text-decoration:none;font-weight:700">${cta.text} →</a>`;
  }

  addChat("ai", ans);
}

setTimeout(renderAI, 600);

window.renderAI = renderAI;
window.sendAI = sendAI;
window.quickAI = quickAI;
