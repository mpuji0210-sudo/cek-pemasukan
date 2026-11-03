// js/modules/arus-keluar.js - Arus Keluar (Bensin, Makan, Rokok, Kopi)
import {
  $,
  fmt,
  esc,
  genId,
  money,
  pengeluaran,
  anggaran,
  save,
  showToast,
  openMkpModal,
  bulkMode,
  selected,
  keluarFilter,
  toggleCustomInput,
} from "../app.js";

function filterByCalendar(list, type, dId, mId) {
  const now = new Date();
  const dVal = $(dId) ? $(dId).value : null;
  const mVal = $(mId) ? $(mId).value : null;
  if (type === "custom" && dVal) {
    const d = new Date(dVal);
    return list.filter(
      (h) =>
        new Date(h.tgl).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta",
        }) === d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }),
    );
  }
  if (type === "custom" && mVal) {
    const ym = mVal.split("-");
    return list.filter((h) => {
      const dt = new Date(h.tgl);
      return (
        dt.getFullYear() == parseInt(ym[0]) &&
        dt.getMonth() + 1 == parseInt(ym[1])
      );
    });
  }
  if (type === "hari") {
    return list.filter(
      (h) =>
        new Date(h.tgl).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta",
        }) === now.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }),
    );
  }
  if (type === "bulan") {
    return list.filter((h) => {
      const d = new Date(h.tgl);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
  }
  if (type === "tahun") {
    return list.filter(
      (h) => new Date(h.tgl).getFullYear() === now.getFullYear(),
    );
  }
  return list;
}

export function addPengeluaran() {
  const jml = parseInt($("eJumlah").value) || 0;
  const k = $("eKategori").value;
  const kat = k === "lain" ? $("eCustom").value.trim() || "Lainnya" : k;
  const sumber = $("eSumber").value;
  const cat = $("eCatatan").value.trim();
  if (!jml || !sumber) {
    showToast("Isi jumlah dan sumber");
    return;
  }
  const m = money.find((x) => x.name === sumber);
  if (!m || m.balance < jml) {
    showToast("Saldo tidak cukup");
    return;
  }
  m.balance -= jml;
  pengeluaran.unshift({
    id: genId(),
    jml: jml,
    kat: kat,
    sumber: sumber,
    cat: cat,
    tgl: new Date().toISOString(),
  });
  $("eJumlah").value = "";
  $("eCatatan").value = "";
  const ec = $("eCustom");
  if (ec) {
    ec.value = "";
    ec.style.display = "none";
  }
  const ag = anggaran.find((a) => a.kat === kat || a.nama === kat);
  if (ag) ag.terkumpul = (ag.terkumpul || 0) + jml;
  save();
  showToast("Pengeluaran dicatat");
}

export function delPengeluaran(id) {
  const h = pengeluaran.find((x) => x.id === id);
  if (!h) return;
  openMkpModal({
    title: "Hapus pengeluaran?",
    desc: "Saldo dikembalikan",
    confirmText: "Hapus",
    action: () => {
      const m = money.find((x) => x.name === h.sumber);
      if (m) m.balance += h.jml;
      const ag = anggaran.find((a) => a.kat === h.kat || a.nama === h.kat);
      if (ag) ag.terkumpul = Math.max(0, (ag.terkumpul || 0) - h.jml);
      const idx = pengeluaran.findIndex((x) => x.id === id);
      if (idx >= 0) pengeluaran.splice(idx, 1);
      save();
    },
  });
}

export function renderKeluarList() {
  const fk = filterByCalendar(
    pengeluaran,
    keluarFilter,
    "filterKeluarDate",
    "filterKeluarMonth",
  );

  const kti = $("keluarTotalInfo");
  if (kti)
    kti.innerText =
      "Total: Rp " +
      fmt(fk.reduce((s, x) => s + x.jml, 0)) +
      " - " +
      fk.length +
      " transaksi";

  const lpeng = $("listPengeluaran");
  if (lpeng)
    lpeng.innerHTML =
      fk
        .slice(0, 50)
        .map(
          (h) => `
    <div class="item">
      <div class="item-left">
        ${bulkMode["pengeluaran"] ? `<div class="checkbox ${selected["pengeluaran"].has(h.id) ? "checked" : ""}" onclick="toggleSelect('pengeluaran',${h.id})">${selected["pengeluaran"].has(h.id) ? "✓" : ""}</div>` : ""}
        <div><b class="num" style="color:#E02424">- Rp ${fmt(h.jml)}</b> - ${esc(h.kat)}<br><small>${esc(h.cat || "")} - ${new Date(h.tgl).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}</small></div>
      </div>
      <div><button type="button" onclick="delPengeluaran(${h.id})" class="iconBtn" style="color:#E02424">✕</button></div>
    </div>`,
        )
        .join("") || '<div class="emptyState">Belum ada pengeluaran</div>';

  const opts = money
    .map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`)
    .join("");
  const es = $("eSumber");
  if (es) es.innerHTML = '<option value="">Pilih sumber keluar</option>' + opts;

  // Untuk chart pie kategori (dari file lama)
  // Pie akan di-render di beranda.js pakai pengeluaran global
}

// Expose
window.addPengeluaran = addPengeluaran;
window.delPengeluaran = delPengeluaran;
window.toggleCustomInput = toggleCustomInput;
