// js/modules/arus-masuk.js - FIXED v2.1 - Safe Date Comparison + Robust Edit Handler
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

function toJakartaDateString(dateInput) {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function filterByCalendar(list, type, dId, mId) {
  const nowStr = toJakartaDateString(new Date());
  const dVal = $(dId) ? $(dId).value : null;
  const mVal = $(mId) ? $(mId).value : null;

  if (type === "custom" && dVal) {
    return list.filter((h) => toJakartaDateString(h.tgl) === dVal);
  }
  if (type === "custom" && mVal) {
    return list.filter((h) => toJakartaDateString(h.tgl).startsWith(mVal));
  }
  if (type === "hari") {
    return list.filter((h) => toJakartaDateString(h.tgl) === nowStr);
  }
  if (type === "bulan") {
    const currentYM = nowStr.substring(0, 7);
    return list.filter((h) => toJakartaDateString(h.tgl).startsWith(currentYM));
  }
  if (type === "tahun") {
    const currentYear = nowStr.substring(0, 4);
    return list.filter((h) =>
      toJakartaDateString(h.tgl).startsWith(currentYear),
    );
  }
  return list;
}

export function addPendapatan() {
  const jml = parseInt($("pJumlah").value) || 0;
  const sumberRaw = $("pSumber")?.value || "";
  const cat = $("pCatatan")?.value.trim() || "";

  if (!jml || !sumberRaw) return showToast("Isi jumlah dan sumber pemasukan");

  const m = findMoney(sumberRaw);
  if (!m) return showToast("Sumber tidak ditemukan - cek Aset dulu");

  m.balance += jml;
  pendapatan.unshift({
    id: genId(),
    jml: jml,
    sumber: m.name,
    cat: cat,
    tgl: new Date().toISOString(),
  });

  if ($("pJumlah")) $("pJumlah").value = "";
  if ($("pCatatan")) $("pCatatan").value = "";

  save();
  showToast(`+ Rp ${fmt(jml)} ke ${m.name}`);
}

export function delPendapatan(id) {
  const h = pendapatan.find((x) => String(x.id) === String(id));
  if (!h) return;

  openMkpModal({
    title: "Hapus pemasukan?",
    desc: `Saldo ${h.sumber} akan dikurangi Rp ${fmt(h.jml)}`,
    confirmText: "Hapus",
    action: () => {
      const m = findMoney(h.sumber);
      if (m) {
        m.balance -= h.jml;
        if (m.balance < 0) m.balance = 0;
      } else {
        showToast(
          "Peringatan: Dompet asal sudah tidak ada, saldo dompet tidak disesuaikan.",
        );
      }

      const idx = pendapatan.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) pendapatan.splice(idx, 1);

      save();
      showToast("Pemasukan dihapus - saldo disesuaikan");
    },
  });
}

export function editPendapatan(id) {
  const h = pendapatan.find((x) => String(x.id) === String(id));
  if (!h) return;

  openMkpModal({
    title: "Edit Pemasukan",
    formHTML: `<input id="editJmlMasuk" class="input" type="number" value="${h.jml}" placeholder="Jumlah"><input id="editCatMasuk" class="input" value="${esc(h.cat || "")}" placeholder="Catatan">`,
    confirmText: "Simpan",
    action: () => {
      const newJml = parseInt($("editJmlMasuk")?.value) || 0;
      if (newJml <= 0) return showToast("Jumlah harus > 0");

      const m = findMoney(h.sumber);
      if (m) {
        const selisih = newJml - h.jml;
        m.balance += selisih;
        if (m.balance < 0) m.balance = 0;
      } else {
        showToast(
          "Peringatan: Dompet asal tidak ditemukan, saldo dompet tidak diubah.",
        );
      }

      h.jml = newJml;
      h.cat = $("editCatMasuk")?.value.trim() || "";

      save();
      showToast("Pemasukan diupdate");
    },
  });
}

export function renderMasukList() {
  const fm = filterByCalendar(
    pendapatan,
    masukFilter,
    "filterMasukDate",
    "filterMasukMonth",
  );

  const mti = $("masukTotalInfo");
  if (mti) {
    const totalJml = fm.reduce((s, x) => s + (x.jml || 0), 0);
    mti.innerText = `Total: Rp ${fmt(totalJml)} - ${fm.length} transaksi`;
  }

  const lpend = $("listPendapatan");
  if (lpend) {
    lpend.innerHTML =
      fm
        .slice(0, 50)
        .map((h) => {
          const safeId = esc(String(h.id));
          const isSelected = selected["pendapatan"].has(String(h.id));
          const tanggalFormat = new Date(h.tgl).toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
          });

          return `
        <div class="item">
          <div class="item-left">
            ${bulkMode["pendapatan"] ? `<div class="checkbox ${isSelected ? "checked" : ""}" onclick="toggleSelect('pendapatan','${safeId}')">${isSelected ? "✓" : ""}</div>` : ""}
            <div>
              <b class="num" style="color:#0E9F6E">+ Rp ${fmt(h.jml)}</b> - ${esc(h.sumber)}<br>
              <small>${esc(h.cat || "")} - ${tanggalFormat}</small>
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" onclick="editPendapatan('${safeId}')" class="iconBtn">✎</button>
            <button type="button" onclick="delPendapatan('${safeId}')" class="iconBtn" style="color:#E02424">✕</button>
          </div>
        </div>`;
        })
        .join("") || '<div class="emptyState">Belum ada pemasukan</div>';
  }
}

window.addPendapatan = addPendapatan;
window.delPendapatan = delPendapatan;
window.editPendapatan = editPendapatan;
window.filterByCalendar = filterByCalendar;
