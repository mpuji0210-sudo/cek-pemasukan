// js/modules/hutang.js - FINAL v2.6 - FIXED v2.1 Presisi + V2 Monetisasi KTA Lead
import {
  $,
  fmt,
  esc,
  genId,
  money,
  debts,
  pengeluaran,
  save,
  showToast,
  openMkpModal,
  bulkMode,
  selected,
} from "../app.js";

// === AFFILIATE V2 - GANTI LINK ACCESSTRADE KAMU ===
const AFF = {
  KTA: "https://go.accesstrade.co.id/your-kta-link", // Rp 400-800k / approval - Focus V2
  KK: "https://go.accesstrade.co.id/your-kk-link",
};

function findMoney(name) {
  return money.find(
    (x) =>
      String(x.name || "")
        .trim()
        .toUpperCase() ===
      String(name || "")
        .trim()
        .toUpperCase(),
  );
}

export function addDebt() {
  const nama = $("namaHutang").value.trim();
  const pokok = parseInt($("sisaHutang").value) || 0;
  const inputCicil = parseInt($("cicilanHutang").value) || 0;
  const bungaInput = parseFloat($("bungaHutang")?.value) || 0;
  const tenorInput = parseInt($("tenorHutang")?.value) || 0;

  if (!nama) return showToast("Isi nama hutang");
  if (pokok <= 0) return showToast("Isi pokok hutang");

  let total = pokok;
  let tenor = tenorInput;
  let bungaPersen = bungaInput;

  if (bungaPersen > 0 && tenor > 0) {
    total = Math.round(pokok + pokok * (bungaPersen / 100) * (tenor / 12));
  } else if (inputCicil > 0 && tenor > 0) {
    total = inputCicil * tenor;
  } else {
    total = pokok;
  }

  let finalCicil = inputCicil;
  if (finalCicil <= 0) {
    finalCicil = tenor > 0 ? Math.round(total / tenor) : total;
  }

  debts.push({
    id: genId(),
    name: nama.toUpperCase(),
    pokok: pokok,
    total: total,
    sisa: total,
    cicil: finalCicil,
    bunga: bungaPersen,
    tenor: tenor,
    bungaRupiah: total - pokok,
    createdAt: new Date().toISOString(),
    lunas: false,
  });

  $("namaHutang").value = "";
  $("sisaHutang").value = "";
  $("cicilanHutang").value = "";
  if ($("bungaHutang")) $("bungaHutang").value = "";
  if ($("tenorHutang")) $("tenorHutang").value = "";

  save();
  showToast(`Hutang ${nama.toUpperCase()} ditambah`);
}

export function payDebt(id) {
  const d = debts.find((x) => String(x.id) === String(id));
  if (!d) return;
  if (d.sisa <= 0) return showToast("Hutang ini sudah LUNAS");

  const s = $("sumberBayar") ? $("sumberBayar").value : "";
  if (!s) return showToast("Pilih sumber bayar");

  const m = findMoney(s);
  if (!m) return showToast("Sumber bayar tidak ditemukan");

  const jumlahBayar = Math.min(d.cicil, d.sisa); // PRESISI CICILAN TERAKHIR - KUNCI v2.1

  if (m.balance < jumlahBayar) {
    return showToast(
      `Saldo ${m.name} kurang Rp ${fmt(jumlahBayar - m.balance)}`,
    );
  }

  m.balance -= jumlahBayar;
  d.sisa -= jumlahBayar;
  if (d.sisa <= 0) {
    d.sisa = 0;
    d.lunas = true;
  }

  pengeluaran.unshift({
    id: genId(),
    jml: jumlahBayar,
    kat: "Cicilan Hutang",
    sumber: m.name,
    cat: `Bayar hutang ${d.name} - sisa Rp ${fmt(d.sisa)}`,
    tgl: new Date().toISOString(),
  });

  save();
  showToast(
    d.sisa === 0
      ? `${d.name} LUNAS! 🎉`
      : `Bayar ${d.name} - sisa Rp ${fmt(d.sisa)}`,
  );
}

export function delDebt(id) {
  openMkpModal({
    title: "Hapus hutang?",
    desc: "Data hutang akan hilang permanen",
    confirmText: "Hapus",
    action: () => {
      const idx = debts.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        debts.splice(idx, 1);
        save();
        showToast("Hutang dihapus");
      }
    },
  });
}

export function renderHutangList() {
  const ld = $("listDebt");
  if (!ld) return;

  ld.innerHTML =
    debts
      .map((d) => {
        const safeId = esc(String(d.id));
        const progress =
          d.total > 0 ? Math.round(((d.total - d.sisa) / d.total) * 100) : 0;
        const isLunas = d.sisa <= 0;
        const isHighInterest = (d.bunga || 0) >= 11 || (d.tenor || 0) >= 12;
        const potensiHemat = isHighInterest
          ? Math.round((d.bungaRupiah || 0) * 0.3)
          : 0;

        return `
    <div class="item">
      <div class="item-left">
        ${bulkMode["debts"] ? `<div class="checkbox ${selected["debts"].has(d.id) ? "checked" : ""}" onclick="toggleSelect('debts','${safeId}')">${selected["debts"].has(d.id) ? "✓" : ""}</div>` : ""}
        <div>
          <b>${esc(d.name)}</b> ${isLunas ? '<span style="background:#0E9F6E;color:#fff;padding:2px 6px;border-radius:6px;font-size:10px">LUNAS</span>' : isHighInterest ? '<span style="background:#EEF2FF;color:#6366F1;padding:2px 6px;border-radius:6px;font-size:10px">BUNGA TINGGI</span>' : ""}
          <br><small class="num">Sisa Rp ${fmt(d.sisa)} / Total Rp ${fmt(d.total)} ${d.bunga > 0 ? `(Bunga ${d.bunga}%)` : ""}</small>
          <br><div style="height:6px;background:#E5E7EB;border-radius:10px;margin-top:4px;width:120px"><div style="height:100%;width:${progress}%;background:${isLunas ? "#0E9F6E" : "#0F172A"};border-radius:10px"></div></div>
          <small>${progress}% - Cicilan Rp ${fmt(d.cicil)}${d.tenor ? ` x ${d.tenor} bulan` : "/bln"}</small>
          ${isHighInterest && !isLunas ? `<div style="margin-top:8px"><a href="${AFF.KTA}" target="_blank" style="display:inline-block;background:#6366F1;color:#fff;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none">💡 Tutup ${esc(d.name)} bunga tinggi? Cek KTA 0.9% hemat Rp ${fmt(potensiHemat)} →</a><div style="font-size:9px;color:#94A3B8;margin-top:2px">Lead Rp 400-800k / approval via Accesstrade</div></div>` : ""}
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-direction:column">
        ${!isLunas ? `<button type="button" onclick="payDebt('${safeId}')" style="border:none;background:#0F172A;color:#fff;padding:8px 12px;border-radius:10px;font-weight:700;font-size:12px">Bayar</button>` : ""}
        <button type="button" onclick="delDebt('${safeId}')" class="iconBtn" style="color:#E02424">✕</button>
      </div>
    </div>`;
      })
      .join("") || '<div class="emptyState">Belum ada hutang</div>';

  const bh = $("berandaHutang");
  if (bh) {
    const totalSisa = debts.reduce((s, x) => s + (x.sisa || 0), 0);
    const totalBunga = debts.reduce((s, x) => s + (x.bungaRupiah || 0), 0);
    const highInterestCount = debts.filter(
      (x) => (x.bunga || 0) >= 11 || (x.tenor || 0) >= 12,
    ).length;
    bh.innerHTML = debts.length
      ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:700"><span>Total Sisa Hutang</span><span class="num" style="color:#E02424">Rp ${fmt(totalSisa)}</span></div>
      ${totalBunga > 0 ? `<div style="display:flex;justify-content:space-between;padding:2px 0"><small>Total Bunga</small><small class="num" style="color:#F59E0B">Rp ${fmt(totalBunga)}</small></div>` : ""}
      ${highInterestCount > 0 ? `<div style="background:#EEF2FF;border-radius:8px;padding:8px;margin:6px 0"><small style="color:#6366F1;font-weight:700">💡 ${highInterestCount} hutang bunga tinggi terdeteksi - cek KTA rate lebih rendah</small><br><a href="${AFF.KTA}" target="_blank" style="font-size:11px;color:#6366F1;font-weight:700;text-decoration:none">Cek opsi KTA →</a></div>` : ""}
      ${debts.map((d) => `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${esc(d.name)}</span><span class="num" style="color:${d.sisa > 0 ? "#E02424" : "#0E9F6E"}">${d.sisa > 0 ? `Rp ${fmt(d.sisa)}` : "LUNAS"}</span></div>`).join("")}
    `
      : '<small style="color:#999">Tidak ada hutang</small>';
  }
}

window.addDebt = addDebt;
window.payDebt = payDebt;
window.delDebt = delDebt;
