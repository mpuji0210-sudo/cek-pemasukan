// js/modules/hutang.js - Hutang (dari file lama)
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

export function addDebt() {
  const nama = $("namaHutang").value.trim();
  const sisa = parseInt($("sisaHutang").value) || 0;
  const cicil = parseInt($("cicilanHutang").value) || 0;
  if (!nama) {
    showToast("Isi nama hutang");
    return;
  }
  debts.push({
    id: genId(),
    name: nama,
    total: sisa,
    sisa: sisa,
    cicil: cicil,
  });
  $("namaHutang").value = "";
  $("sisaHutang").value = "";
  $("cicilanHutang").value = "";
  save();
  showToast("Hutang ditambah");
}

export function payDebt(id) {
  const d = debts.find((x) => x.id === id);
  if (!d) return;
  const s = $("sumberBayar") ? $("sumberBayar").value : "";
  if (!s) {
    showToast("Pilih sumber bayar");
    return;
  }
  const m = money.find((x) => x.name === s);
  if (!m || m.balance < d.cicil) {
    showToast("Saldo kurang");
    return;
  }
  m.balance -= d.cicil;
  d.sisa -= d.cicil;
  if (d.sisa < 0) d.sisa = 0;
  pengeluaran.unshift({
    id: genId(),
    jml: d.cicil,
    kat: "Cicilan Hutang",
    sumber: s,
    cat: "Bayar hutang " + d.name,
    tgl: new Date().toISOString(),
  });
  save();
  showToast("Hutang dibayar");
}

export function delDebt(id) {
  openMkpModal({
    title: "Hapus hutang?",
    confirmText: "Hapus",
    action: () => {
      const idx = debts.findIndex((x) => x.id === id);
      if (idx >= 0) debts.splice(idx, 1);
      save();
    },
  });
}

export function renderHutangList() {
  const ld = $("listDebt");
  if (!ld) return;
  ld.innerHTML =
    debts
      .map(
        (d) => `
    <div class="item">
      <div class="item-left">
        ${bulkMode["debts"] ? `<div class="checkbox ${selected["debts"].has(d.id) ? "checked" : ""}" onclick="toggleSelect('debts',${d.id})">${selected["debts"].has(d.id) ? "✓" : ""}</div>` : ""}
        <div><b>${esc(d.name)}</b><br><small class="num">Sisa Rp ${fmt(d.sisa)} - Rp ${fmt(d.cicil)}/hari</small></div>
      </div>
      <div style="display:flex;gap:6px">
        <button type="button" onclick="payDebt(${d.id})" style="border:none;background:#0F172A;color:#fff;padding:8px 12px;border-radius:10px;font-weight:700">Bayar</button>
        <button type="button" onclick="delDebt(${d.id})" class="iconBtn" style="color:#E02424">✕</button>
      </div>
    </div>`,
      )
      .join("") || '<div class="emptyState">Belum ada hutang</div>';

  // Update dropdown sumber bayar (dari file lama bagian opts)
  const opts = money
    .map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`)
    .join("");
  const sb = $("sumberBayar");
  if (sb) sb.innerHTML = '<option value="">Pilih sumber bayar</option>' + opts;

  // Beranda Hutang
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
}

// Expose
window.addDebt = addDebt;
window.payDebt = payDebt;
window.delDebt = delDebt;
