// js/modules/arus-masuk.js - Arus Masuk (dari file lama)
import {
  $,
  fmt,
  esc,
  genId,
  money,
  pendapatan,
  save,
  showToast,
  openMkpModal,
  bulkMode,
  selected,
  masukFilter,
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

export function addPendapatan() {
  const jml = parseInt($("pJumlah").value) || 0;
  const sumber = $("pSumber").value;
  const cat = $("pCatatan").value.trim();
  if (!jml || !sumber) {
    showToast("Isi jumlah dan sumber");
    return;
  }
  const m = money.find((x) => x.name === sumber);
  if (!m) {
    showToast("Sumber tidak ditemukan");
    return;
  }
  m.balance += jml;
  pendapatan.unshift({
    id: genId(),
    jml: jml,
    sumber: sumber,
    cat: cat,
    tgl: new Date().toISOString(),
  });
  $("pJumlah").value = "";
  $("pCatatan").value = "";
  save();
  showToast("Pemasukan dicatat");
}

export function delPendapatan(id) {
  const h = pendapatan.find((x) => x.id === id);
  if (!h) return;
  openMkpModal({
    title: "Hapus pemasukan?",
    desc: "Saldo dikembalikan",
    confirmText: "Hapus",
    action: () => {
      const m = money.find((x) => x.name === h.sumber);
      if (m) m.balance -= h.jml;
      const idx = pendapatan.findIndex((x) => x.id === id);
      if (idx >= 0) pendapatan.splice(idx, 1);
      save();
    },
  });
}

export function renderMasukList() {
  // Filter (dari file lama)
  const fm = filterByCalendar(
    pendapatan,
    masukFilter,
    "filterMasukDate",
    "filterMasukMonth",
  );

  const mti = $("masukTotalInfo");
  if (mti)
    mti.innerText =
      "Total: Rp " +
      fmt(fm.reduce((s, x) => s + x.jml, 0)) +
      " - " +
      fm.length +
      " transaksi";

  const lpend = $("listPendapatan");
  if (lpend)
    lpend.innerHTML =
      fm
        .slice(0, 50)
        .map(
          (h) => `
    <div class="item">
      <div class="item-left">
        ${bulkMode["pendapatan"] ? `<div class="checkbox ${selected["pendapatan"].has(h.id) ? "checked" : ""}" onclick="toggleSelect('pendapatan',${h.id})">${selected["pendapatan"].has(h.id) ? "✓" : ""}</div>` : ""}
        <div><b class="num" style="color:#0E9F6E">+ Rp ${fmt(h.jml)}</b> - ${esc(h.sumber)}<br><small>${esc(h.cat || "")} - ${new Date(h.tgl).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}</small></div>
      </div>
      <div><button type="button" onclick="delPendapatan(${h.id})" class="iconBtn" style="color:#E02424">✕</button></div>
    </div>`,
        )
        .join("") || '<div class="emptyState">Belum ada pemasukan</div>';

  // Update dropdown sumber masuk
  const opts = money
    .map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`)
    .join("");
  const ps = $("pSumber");
  if (ps) ps.innerHTML = '<option value="">Pilih sumber masuk</option>' + opts;
}

// Expose
window.addPendapatan = addPendapatan;
window.delPendapatan = delPendapatan;
window.filterByCalendar = filterByCalendar;
