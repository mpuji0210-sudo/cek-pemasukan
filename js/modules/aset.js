// js/modules/aset.js - FIXED v2.3 - Fixed Set Type Mismatch + Consistent Validation
import {
  $,
  fmt,
  esc,
  genId,
  money,
  physical,
  save,
  showToast,
  openMkpModal,
  bulkMode,
  selected,
} from "../app.js";

export function addMoney() {
  const j = $("jenisUang").value;
  const namaRaw = j === "lain" ? $("namaUangCustom").value.trim() : j.trim();
  const nama = namaRaw.toUpperCase();
  const s = parseInt($("saldoUang").value) || 0;

  if (!nama) return showToast("Isi nama aset");
  if (money.find((m) => String(m.name).trim().toUpperCase() === nama)) {
    return showToast(`Aset ${nama} sudah ada`);
  }

  money.push({ id: genId(), name: nama, balance: s });
  $("saldoUang").value = "";
  const nc = $("namaUangCustom");
  if (nc) {
    nc.value = "";
    nc.style.display = "none";
  }

  save();
  showToast(`Aset ${nama} ditambah`);
}

export function addPhysical() {
  const j = $("jenisBarang").value;
  const namaRaw = j === "lain" ? $("namaBarangCustom").value.trim() : j.trim();
  const nama = namaRaw.toUpperCase();
  const n = parseInt($("nilaiBarang").value) || 0;
  const lok = $("lokasiBarang").value.trim();

  if (!nama) return showToast("Isi nama barang");

  physical.push({ id: genId(), name: nama, value: n, loc: lok });
  $("nilaiBarang").value = "";
  $("lokasiBarang").value = "";
  const nb = $("namaBarangCustom");
  if (nb) {
    nb.value = "";
    nb.style.display = "none";
  }

  save();
  showToast(`Barang ${nama} ditambah`);
}

export function editMoney(id) {
  const it = money.find((x) => String(x.id) === String(id));
  if (!it) return;

  openMkpModal({
    title: "Edit Aset",
    formHTML: `<input id="editName" class="input" value="${esc(it.name)}"><input id="editNominal" class="input" type="number" value="${it.balance}">`,
    confirmText: "Simpan",
    action: () => {
      const en = $("editName");
      const eno = $("editNominal");
      const newName = en ? en.value.trim().toUpperCase() : "";

      if (!newName) return showToast("Nama tidak boleh kosong");

      if (
        money.some(
          (m) =>
            String(m.id) !== String(id) &&
            String(m.name).trim().toUpperCase() === newName,
        )
      ) {
        return showToast(`Aset ${newName} sudah ada`);
      }

      it.name = newName;
      if (eno) it.balance = parseInt(eno.value) || 0;

      save();
      showToast("Aset diupdate");
    },
  });
}

export function editPhysical(id) {
  const it = physical.find((x) => String(x.id) === String(id));
  if (!it) return;

  openMkpModal({
    title: "Edit Barang",
    formHTML: `<input id="editNamaBarang" class="input" value="${esc(it.name)}"><input id="editNilaiBarang" class="input" type="number" value="${it.value || 0}"><input id="editLokasiBarang" class="input" value="${esc(it.loc || "")}" placeholder="Lokasi">`,
    confirmText: "Simpan",
    action: () => {
      const a = $("editNamaBarang");
      const b = $("editNilaiBarang");
      const c = $("editLokasiBarang");

      const newName = a ? a.value.trim().toUpperCase() : "";
      if (!newName) return showToast("Nama barang tidak boleh kosong");

      it.name = newName;
      if (b) it.value = parseInt(b.value) || 0;
      if (c) it.loc = c.value.trim();

      save();
      showToast("Barang diupdate");
    },
  });
}

export function delMoney(id) {
  openMkpModal({
    title: "Hapus aset?",
    desc: "Saldo terkait pengeluaran yang pakai aset ini TIDAK akan dikembalikan",
    confirmText: "Hapus",
    action: () => {
      const idx = money.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        money.splice(idx, 1);
        save();
        showToast("Aset dihapus");
      }
    },
  });
}

export function delPhysical(id) {
  openMkpModal({
    title: "Hapus barang?",
    confirmText: "Hapus",
    action: () => {
      const idx = physical.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        physical.splice(idx, 1);
        save();
        showToast("Barang dihapus");
      }
    },
  });
}

export function deleteBulk(cat) {
  if (cat !== "money" && cat !== "physical") return;
  if (selected[cat].size === 0) return showToast("Tidak ada yang dipilih");

  openMkpModal({
    title: `Hapus ${selected[cat].size} data?`,
    desc: "Hapus terpilih?",
    confirmText: "Hapus",
    action: () => {
      const toDel = new Set(Array.from(selected[cat]).map(String));
      if (cat === "money") {
        for (let i = money.length - 1; i >= 0; i--) {
          if (toDel.has(String(money[i].id))) money.splice(i, 1);
        }
      }
      if (cat === "physical") {
        for (let i = physical.length - 1; i >= 0; i--) {
          if (toDel.has(String(physical[i].id))) physical.splice(i, 1);
        }
      }
      selected[cat].clear();
      bulkMode[cat] = false;
      save();
    },
  });
}

export function renderAsetList() {
  const lm = $("listMoney");
  if (lm) {
    lm.innerHTML =
      money
        .map((m) => {
          const safeId = esc(String(m.id));
          const isSelected =
            selected["money"].has(String(m.id)) || selected["money"].has(m.id);

          return `
        <div class="item">
          <div class="item-left">
            ${bulkMode["money"] ? `<div class="checkbox ${isSelected ? "checked" : ""}" onclick="toggleSelect('money','${safeId}')">${isSelected ? "✓" : ""}</div>` : ""}
            <div><b>${esc(m.name)}</b><br><small class="num">Rp ${fmt(m.balance)}</small></div>
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" onclick="editMoney('${safeId}')" class="iconBtn">✎</button>
            <button type="button" onclick="delMoney('${safeId}')" class="iconBtn" style="color:#E02424">✕</button>
          </div>
        </div>`;
        })
        .join("") || '<div class="emptyState">Belum ada aset</div>';
  }

  const lp = $("listPhysical");
  if (lp) {
    lp.innerHTML =
      physical
        .map((p) => {
          const safeId = esc(String(p.id));
          const isSelected =
            selected["physical"].has(String(p.id)) ||
            selected["physical"].has(p.id);

          return `
        <div class="item">
          <div class="item-left">
            ${bulkMode["physical"] ? `<div class="checkbox ${isSelected ? "checked" : ""}" onclick="toggleSelect('physical','${safeId}')">${isSelected ? "✓" : ""}</div>` : ""}
            <div><b>${esc(p.name)}</b> ${p.loc ? ` - ${esc(p.loc)}` : ""}<br><small class="num">${p.value ? "Rp " + fmt(p.value) : "Inventaris"}</small></div>
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" onclick="editPhysical('${safeId}')" class="iconBtn">✎</button>
            <button type="button" onclick="delPhysical('${safeId}')" class="iconBtn" style="color:#E02424">✕</button>
          </div>
        </div>`;
        })
        .join("") || '<div class="emptyState">Belum ada barang</div>';
  }
}

window.addMoney = addMoney;
window.addPhysical = addPhysical;
window.editMoney = editMoney;
window.editPhysical = editPhysical;
window.delMoney = delMoney;
window.delPhysical = delPhysical;
window.deleteBulk = deleteBulk;
