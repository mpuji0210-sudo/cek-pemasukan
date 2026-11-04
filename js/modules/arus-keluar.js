// js/modules/arus-keluar.js - FIXED v2.2 - Safe Budget Adjustment + Robust Null Checks
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
function findAnggaran(kat) {
  return anggaran.find(
    (a) =>
      String(a.kat || a.nama || "")
        .trim()
        .toUpperCase() ===
      String(kat || "")
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
  if (type === "custom" && dVal)
    return list.filter((h) => toJakartaDateString(h.tgl) === dVal);
  if (type === "custom" && mVal)
    return list.filter((h) => toJakartaDateString(h.tgl).startsWith(mVal));
  if (type === "hari")
    return list.filter((h) => toJakartaDateString(h.tgl) === nowStr);
  if (type === "bulan") {
    const ym = nowStr.substring(0, 7);
    return list.filter((h) => toJakartaDateString(h.tgl).startsWith(ym));
  }
  if (type === "tahun") {
    const y = nowStr.substring(0, 4);
    return list.filter((h) => toJakartaDateString(h.tgl).startsWith(y));
  }
  return list;
}

export function addPengeluaran() {
  const jml = parseInt($("eJumlah")?.value) || 0;
  const k = $("eKategori")?.value || "";
  const katRaw = k === "lain" ? $("eCustom")?.value.trim() || "Lainnya" : k;
  const kat = katRaw.trim().toUpperCase();
  const sumberRaw = $("eSumber")?.value || "";
  const cat = $("eCatatan")?.value.trim() || "";

  if (!jml || !sumberRaw || !kat)
    return showToast("Isi jumlah, kategori, dan sumber");

  const m = findMoney(sumberRaw);
  if (!m) return showToast("Sumber dompet tidak ditemukan");
  if (m.balance < jml)
    return showToast(`Saldo ${m.name} kurang Rp ${fmt(jml - m.balance)}`);

  m.balance -= jml;
  pengeluaran.unshift({
    id: genId(),
    jml: jml,
    kat: kat,
    sumber: m.name,
    cat: cat,
    tgl: new Date().toISOString(),
  });

  if ($("eJumlah")) $("eJumlah").value = "";
  if ($("eCatatan")) $("eCatatan").value = "";
  const ec = $("eCustom");
  if (ec) {
    ec.value = "";
    ec.style.display = "none";
  }

  const ag = findAnggaran(kat);
  if (ag) ag.terkumpul = (ag.terkumpul || 0) + jml;

  save();
  showToast(`- Rp ${fmt(jml)} ${kat} dari ${m.name}`);
}

export function delPengeluaran(id) {
  const h = pengeluaran.find((x) => String(x.id) === String(id));
  if (!h) return;

  openMkpModal({
    title: "Hapus pengeluaran?",
    desc: `Saldo ${h.sumber} + Rp ${fmt(h.jml)} & anggaran ${h.kat} - Rp ${fmt(h.jml)}`,
    confirmText: "Hapus",
    action: () => {
      const m = findMoney(h.sumber);
      if (m) {
        m.balance += h.jml;
      } else {
        showToast(
          "Peringatan: Dompet asal tidak ditemukan, saldo tidak dikembalikan.",
        );
      }

      const ag = findAnggaran(h.kat);
      if (ag) ag.terkumpul = Math.max(0, (ag.terkumpul || 0) - h.jml);

      const idx = pengeluaran.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) pengeluaran.splice(idx, 1);

      save();
      showToast("Pengeluaran dihapus");
    },
  });
}

export function editPengeluaran(id) {
  const h = pengeluaran.find((x) => String(x.id) === String(id));
  if (!h) return;

  openMkpModal({
    title: "Edit Pengeluaran",
    formHTML: `<input id="editJmlKeluar" class="input" type="number" value="${h.jml}" placeholder="Jumlah"><input id="editKatKeluar" class="input" value="${esc(h.kat)}" placeholder="Kategori"><input id="editCatKeluar" class="input" value="${esc(h.cat || "")}" placeholder="Catatan">`,
    confirmText: "Simpan",
    action: () => {
      const newJml = parseInt($("editJmlKeluar")?.value) || 0;
      const newKatRaw = $("editKatKeluar")?.value.trim() || h.kat;
      const newKat = newKatRaw.toUpperCase();

      if (newJml <= 0) return showToast("Jumlah harus > 0");
      if (!newKat) return showToast("Kategori tidak boleh kosong");

      const m = findMoney(h.sumber);
      if (m) {
        const selisih = newJml - h.jml;
        if (selisih > 0 && m.balance < selisih) {
          return showToast(
            `Saldo ${m.name} kurang Rp ${fmt(selisih - m.balance)}`,
          );
        }
        m.balance -= selisih;
      } else {
        showToast(
          "Peringatan: Dompet asal tidak ditemukan, saldo dompet tidak diubah.",
        );
      }

      if (h.kat === newKat) {
        const ag = findAnggaran(h.kat);
        if (ag) {
          const diffJml = newJml - h.jml;
          ag.terkumpul = Math.max(0, (ag.terkumpul || 0) + diffJml);
        }
      } else {
        const agOld = findAnggaran(h.kat);
        if (agOld)
          agOld.terkumpul = Math.max(0, (agOld.terkumpul || 0) - h.jml);

        const agNew = findAnggaran(newKat);
        if (agNew) agNew.terkumpul = (agNew.terkumpul || 0) + newJml;
      }

      h.jml = newJml;
      h.kat = newKat;
      h.cat = $("editCatKeluar")?.value.trim() || "";

      save();
      showToast("Pengeluaran diupdate");
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
  if (kti) {
    const totalJml = fk.reduce((s, x) => s + (x.jml || 0), 0);
    kti.innerText = `Total: Rp ${fmt(totalJml)} - ${fk.length} transaksi`;
  }

  const lpeng = $("listPengeluaran");
  if (lpeng) {
    lpeng.innerHTML =
      fk
        .slice(0, 50)
        .map((h) => {
          const safeId = esc(String(h.id));
          const isSelected = selected["pengeluaran"].has(String(h.id));
          const tgl = new Date(h.tgl).toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
          });

          return `
        <div class="item">
          <div class="item-left">
            ${bulkMode["pengeluaran"] ? `<div class="checkbox ${isSelected ? "checked" : ""}" onclick="toggleSelect('pengeluaran','${safeId}')">${isSelected ? "✓" : ""}</div>` : ""}
            <div>
              <b class="num" style="color:#E02424">- Rp ${fmt(h.jml)}</b> - ${esc(h.kat)}<br>
              <small>${esc(h.cat || "")} - ${tgl} - ${esc(h.sumber)}</small>
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" onclick="editPengeluaran('${safeId}')" class="iconBtn">✎</button>
            <button type="button" onclick="delPengeluaran('${safeId}')" class="iconBtn" style="color:#E02424">✕</button>
          </div>
        </div>`;
        })
        .join("") || '<div class="emptyState">Belum ada pengeluaran</div>';
  }
}

window.addPengeluaran = addPengeluaran;
window.delPengeluaran = delPengeluaran;
window.editPengeluaran = editPengeluaran;
window.toggleCustomInput = toggleCustomInput;
