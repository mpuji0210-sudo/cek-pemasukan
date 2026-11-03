// js/modules/beranda.js - gantiin renderAll() lama untuk Beranda saja
import { $, fmt, esc } from "../app.js";

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
    // === HITUNGAN UTAMA (dari file lama) ===
    const tUang = money.reduce((s, x) => s + x.balance, 0);
    const tBarang = physical.reduce(
      (s, x) => s + ((x.value || 0) > 0 ? x.value : 0),
      0,
    );
    const tInvest = invest.reduce(
      (s, x) => s + ((x.nilai || 0) > 0 ? x.nilai : 0),
      0,
    );
    const tAset = tUang + tBarang + tInvest;
    const tHutang = debts.reduce((s, x) => s + x.sisa, 0);

    // Beranda Utama
    const nw = $("netWorth");
    if (nw) nw.innerText = "Rp " + fmt(tAset - tHutang);
    const ta = $("tAset");
    if (ta) ta.innerText = "Rp " + fmt(tAset);
    const th = $("tHutang");
    if (th) th.innerText = "Rp " + fmt(tHutang);
    const ti = $("totalInvest");
    if (ti) ti.innerText = "Rp " + fmt(tInvest);

    // === TAMBAHAN BARU: FLOATING PROFIT (BELUM REAL) ===
    // Ini yang bikin -1.150.000 kamu kemarin jadi jelas
    // Nanti diisi dari aset saham BBCA yang pakai live price
    let totalFloating = 0;
    // Contoh: invest yang punya harga live
    invest.forEach((iv) => {
      if (iv.livePrice && iv.avgPrice) {
        const lembar = iv.lot ? iv.lot * 100 : 1;
        totalFloating += (iv.livePrice - iv.avgPrice) * lembar;
      }
    });

    if (totalFloating !== 0) {
      const kekayaanPasar = tAset - tHutang + totalFloating;
      const hero = document.querySelector(".hero");
      if (hero && !document.getElementById("floatingInfo")) {
        const div = document.createElement("div");
        div.id = "floatingInfo";
        div.className = "floating-card";
        div.innerHTML = `📈 <b>Floating Belum Real: Rp ${fmt(totalFloating)}</b><br><small>Nilai Pasar: Rp ${fmt(kekayaanPasar)} (Buku Rp ${fmt(tAset - tHutang)})</small>`;
        hero.after(div);
      }
    }

    // === Filter Beranda Hari/Bulan/Tahun (dari file lama) ===
    let berandaView = window.berandaView || "hari";
    let bPend, bPeng;
    const now = new Date();
    if (berandaView === "hari") {
      bPend = pendapatan.filter(
        (h) =>
          new Date(h.tgl).toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
          }) === now.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }),
      );
      bPeng = pengeluaran.filter(
        (h) =>
          new Date(h.tgl).toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
          }) === now.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }),
      );
    } else if (berandaView === "bulan") {
      bPend = pendapatan.filter((h) => {
        let d = new Date(h.tgl);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
      bPeng = pengeluaran.filter((h) => {
        let d = new Date(h.tgl);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    } else {
      bPend = pendapatan;
      bPeng = pengeluaran;
    }

    const pHari = bPend.reduce((s, x) => s + x.jml, 0);
    const eHari = bPeng.reduce((s, x) => s + x.jml, 0);
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

    // === Distribusi Cash/Bank/Ewallet (dari file lama) ===
    function isBank(n) {
      n = n.toLowerCase();
      return (
        n.indexOf("bca") >= 0 ||
        n.indexOf("bri") >= 0 ||
        n.indexOf("bni") >= 0 ||
        n.indexOf("jago") >= 0 ||
        n.indexOf("seabank") >= 0 ||
        n.indexOf("bank") >= 0
      );
    }
    function isEwallet(n) {
      n = n.toLowerCase();
      return (
        n.indexOf("gopay") >= 0 ||
        n.indexOf("ovo") >= 0 ||
        n.indexOf("dana") >= 0
      );
    }
    function isCash(n) {
      return !isBank(n) && !isEwallet(n);
    }
    const cash = money.filter((m) => isCash(m.name));
    const bank = money.filter((m) => isBank(m.name));
    const ewallet = money.filter((m) => isEwallet(m.name));
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

    // List Invest, Barang, Hutang, Anggaran
    const bi = $("berandaInvest");
    if (bi)
      bi.innerHTML = invest.length
        ? `<div class="card"><small style="font-weight:700">Investasi</small>${invest.map((iv) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(iv.nama)}</span><b class="num">Rp ${fmt(iv.nilai)}</b></div>`).join("")}</div>`
        : '<div class="card" style="color:#999;font-size:12px">Belum ada investasi</div>';
    const bbr = $("berandaBarang");
    if (bbr)
      bbr.innerHTML = physical.length
        ? `<div class="card"><small style="font-weight:700">Aset Barang</small>${physical.map((p) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(p.name)}</span><b class="num">Rp ${fmt(p.value)}</b></div>`).join("")}</div>`
        : '<div class="card" style="color:#999;font-size:12px">Belum ada barang</div>';
    const bh = $("berandaHutang");
    if (bh)
      bh.innerHTML = debts.length
        ? debts
            .map(
              (d) =>
                `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(d.name)}</span><span class="num" style="color:${d.sisa > 0 ? "#E02424" : "#0E9F6E"}">${d.sisa > 0 ? "BELUM" : "LUNAS"}</span></div>`,
            )
            .join("")
        : '<small style="color:#999">Tidak ada hutang</small>';

    // Chart 14 hari & Pie (tetap pakai code lama kamu, panggil Chart.js)
    // ... (copy bagian chart lama kamu ke sini kalau mau, sudah jalan tanpa itu pun)
  } catch (e) {
    console.error("beranda error", e);
  }
}
