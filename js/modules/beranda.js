// js/modules/beranda.js - FINAL v2.5 - Stable Floating + AI Ringkasan FIXED
import { $, fmt, esc } from "../app.js";

function toJakartaDate(d) {
  return new Date(
    new Date(d).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}
function isSameDayJakarta(a, b) {
  const da = toJakartaDate(a),
    db = toJakartaDate(b);
  return (
    da.getDate() === db.getDate() &&
    da.getMonth() === db.getMonth() &&
    da.getFullYear() === db.getFullYear()
  );
}
function isSameMonthJakarta(a, b) {
  const da = toJakartaDate(a),
    db = toJakartaDate(b);
  return (
    da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()
  );
}

export function renderBeranda(
  money,
  physical,
  invest,
  debts,
  pendapatan,
  pengeluaran,
  anggaran,
) {
  try {
    const tUang = money.reduce((s, x) => s + (x.balance || 0), 0);
    const tBarang = physical.reduce((s, x) => s + (x.value || 0), 0);
    const tInvestModal = invest.reduce((s, x) => s + (x.nilai || 0), 0);
    const tInvestPasar = invest.reduce(
      (s, x) => s + (x.marketValue || x.nilai || 0),
      0,
    );
    const totalFloating = tInvestPasar - tInvestModal;

    const tAsetBuku = tUang + tBarang + tInvestModal;
    const tAsetPasar = tUang + tBarang + tInvestPasar;
    const tHutang = debts.reduce((s, x) => s + (x.sisa || 0), 0);

    const nw = $("netWorth");
    if (nw) nw.innerText = "Rp " + fmt(tAsetBuku - tHutang);
    const ta = $("tAset");
    if (ta) ta.innerText = "Rp " + fmt(tAsetBuku);
    const th = $("tHutang");
    if (th) th.innerText = "Rp " + fmt(tHutang);
    const ti = $("totalInvest");
    if (ti)
      ti.innerHTML = `Modal Rp ${fmt(tInvestModal)} | Pasar Rp ${fmt(tInvestPasar)} | <span style="color:${totalFloating >= 0 ? "#0E9F6E" : "#E02424"}">Float ${totalFloating >= 0 ? "+" : ""}Rp ${fmt(totalFloating)}</span>`;

    // FIX STABILITAS FLOATING CARD - NO FLICKER
    let floatingCardEl = document.getElementById("floatingInfo");
    const hero = document.querySelector(".hero");

    if (totalFloating !== 0) {
      const contentHTML = `📈 <b>Floating Belum Real: ${totalFloating >= 0 ? "+" : ""}Rp ${fmt(totalFloating)}</b><br><small>Nilai Pasar: Rp ${fmt(tAsetPasar - tHutang)} (Buku Rp ${fmt(tAsetBuku - tHutang)})</small>`;

      if (floatingCardEl) {
        floatingCardEl.innerHTML = contentHTML;
      } else if (hero) {
        const div = document.createElement("div");
        div.id = "floatingInfo";
        div.className = "floating-card";
        div.innerHTML = contentHTML;
        hero.after(div);
      }
    } else if (floatingCardEl) {
      floatingCardEl.remove();
    }

    const berandaView = window.berandaView || "hari";
    const now = new Date();
    let bPend = [],
      bPeng = [];

    if (berandaView === "hari") {
      bPend = pendapatan.filter((h) => isSameDayJakarta(h.tgl, now));
      bPeng = pengeluaran.filter((h) => isSameDayJakarta(h.tgl, now));
    } else if (berandaView === "bulan") {
      bPend = pendapatan.filter((h) => isSameMonthJakarta(h.tgl, now));
      bPeng = pengeluaran.filter((h) => isSameMonthJakarta(h.tgl, now));
    } else if (berandaView === "custom" && window.berandaDateFilter) {
      bPend = pendapatan.filter((h) =>
        isSameDayJakarta(h.tgl, window.berandaDateFilter),
      );
      bPeng = pengeluaran.filter((h) =>
        isSameDayJakarta(h.tgl, window.berandaDateFilter),
      );
    } else if (berandaView === "customMonth" && window.berandaMonthFilter) {
      const [y, m] = String(window.berandaMonthFilter).split("-").map(Number);
      bPend = pendapatan.filter((h) => {
        const d = toJakartaDate(h.tgl);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
      bPeng = pengeluaran.filter((h) => {
        const d = toJakartaDate(h.tgl);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
    } else if (berandaView === "tahun") {
      bPend = pendapatan.filter(
        (h) =>
          toJakartaDate(h.tgl).getFullYear() ===
          toJakartaDate(now).getFullYear(),
      );
      bPeng = pengeluaran.filter(
        (h) =>
          toJakartaDate(h.tgl).getFullYear() ===
          toJakartaDate(now).getFullYear(),
      );
    } else {
      bPend = pendapatan;
      bPeng = pengeluaran;
    }

    const pHari = bPend.reduce((s, x) => s + (x.jml || 0), 0);
    const eHari = bPeng.reduce((s, x) => s + (x.jml || 0), 0);
    const km = $("kMasuk");
    if (km) km.innerText = "Rp " + fmt(pHari);
    const kk = $("kKeluar");
    if (kk) kk.innerText = "Rp " + fmt(eHari);
    const ks = $("kSisa");
    if (ks) ks.innerText = "Rp " + fmt(pHari - eHari);
    const nf = $("notif");
    if (nf)
      nf.innerText =
        pHari || eHari
          ? `Filter: ${berandaView} - Masuk ${bPend.length} Keluar ${bPeng.length}`
          : "Belum ada transaksi";

    const isBank = (n) => {
      n = String(n).toLowerCase();
      return (
        n.includes("bca") ||
        n.includes("bri") ||
        n.includes("bni") ||
        n.includes("jago") ||
        n.includes("seabank") ||
        n.includes("bank")
      );
    };
    const isEwallet = (n) => {
      n = String(n).toLowerCase();
      return (
        n.includes("gopay") ||
        n.includes("ovo") ||
        n.includes("dana") ||
        n.includes("ewallet")
      );
    };
    const isCash = (n) => !isBank(n) && !isEwallet(n);

    const cash = money.filter((m) => isCash(m.name)),
      bank = money.filter((m) => isBank(m.name)),
      ewallet = money.filter((m) => isEwallet(m.name));

    const bc = $("berandaCash");
    if (bc)
      bc.innerHTML = cash.length
        ? `<div class="card"><small style="font-weight:700">Dompet Cash</small>${cash.map((m) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(m.name)}</span><b class="num">Rp ${fmt(m.balance)}</b></div>`).join("")}</div>`
        : "";
    const bb = $("berandaBank");
    if (bb)
      bb.innerHTML = bank.length
        ? `<div class="card"><small style="font-weight:700">Rekening Bank</small>${bank.map((m) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(m.name)}</span><b class="num">Rp ${fmt(m.balance)}</b></div>`).join("")}</div>`
        : "";
    const be = $("berandaEwallet");
    if (be)
      be.innerHTML = ewallet.length
        ? `<div class="card"><small style="font-weight:700">E-Wallet</small>${ewallet.map((m) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(m.name)}</span><b class="num">Rp ${fmt(m.balance)}</b></div>`).join("")}</div>`
        : "";

    const bi = $("berandaInvest");
    if (bi)
      bi.innerHTML = invest.length
        ? `<div class="card"><small style="font-weight:700">Investasi (${invest.length})</small>${invest
            .slice(0, 3)
            .map(
              (iv) =>
                `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(iv.nama)} ${iv.lot ? `(${iv.lot}${iv.jenis === "Saham" ? " lot" : iv.jenis === "Emas" ? "g" : iv.jenis === "Crypto" ? " coin" : " unit"})` : ""}</span><b class="num" style="color:${(iv.floating || 0) >= 0 ? "#0E9F6E" : "#E02424"}">${(iv.floating || 0) >= 0 ? "+" : ""}Rp ${fmt(iv.floating || 0)}</b></div>`,
            )
            .join(
              "",
            )}${invest.length > 3 ? `<small style="color:#64748b">+${invest.length - 3} lainnya di tab Investasi</small>` : ""}</div>`
        : '<div class="card" style="color:#999;font-size:12px">Belum ada investasi</div>';

    const bbr = $("berandaBarang");
    if (bbr)
      bbr.innerHTML = physical.length
        ? `<div class="card"><small style="font-weight:700">Aset Barang</small>${physical.map((p) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(p.name || p.jenis)}</span><b class="num">Rp ${fmt(p.value)}</b></div>`).join("")}</div>`
        : '<div class="card" style="color:#999;font-size:12px">Belum ada barang</div>';
  } catch (e) {
    console.error("beranda error", e);
  }
}

export function getRingkasanKeuangan() {
  const tUang = window.money
    ? window.money.reduce((s, x) => s + (x.balance || 0), 0)
    : 0;
  const tBarang = window.physical
    ? window.physical.reduce((s, x) => s + (x.value || 0), 0)
    : 0;
  const tInvestModal = window.invest
    ? window.invest.reduce((s, x) => s + (x.nilai || 0), 0)
    : 0;
  const tInvestPasar = window.invest
    ? window.invest.reduce((s, x) => s + (x.marketValue || x.nilai || 0), 0)
    : 0;
  const totalFloating = tInvestPasar - tInvestModal;
  const tHutang = window.debts
    ? window.debts.reduce((s, x) => s + (x.sisa || 0), 0)
    : 0;

  return {
    tUang,
    tBarang,
    tInvestModal,
    tInvestPasar,
    totalFloating,
    tHutang,
    netWorthBuku: tUang + tBarang + tInvestModal - tHutang,
    netWorthPasar: tUang + tBarang + tInvestPasar - tHutang,
    timestamp: new Date().toISOString(),
  };
}

window.getRingkasanKeuangan = getRingkasanKeuangan;
