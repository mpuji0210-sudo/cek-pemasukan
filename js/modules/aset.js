// js/modules/aset.js - Aset Uang + Barang (Dompet Cash, BCA, Motor, Rumah dll)
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
  const nama = j === "lain" ? $("namaUangCustom").value.trim() : j.trim();
  const s = parseInt($("saldoUang").value) || 0;
  if (!nama) {
    showToast("Isi nama aset");
    return;
  }
  if (money.find((m) => m.name.toLowerCase() === nama.toLowerCase())) {
    showToast("Aset sudah ada");
    return;
  }
  money.push({ id: genId(), name: nama, balance: s });
  $("saldoUang").value = "";
  const nc = $("namaUangCustom");
  if (nc) {
    nc.value = "";
    nc.style.display = "none";
  }
  save();
  showToast("Aset ditambah");
}

export function addPhysical() {
  const j = $("jenisBarang").value;
  const nama = j === "lain" ? $("namaBarangCustom").value.trim() : j.trim();
  const n = parseInt($("nilaiBarang").value) || 0;
  const lok = $("lokasiBarang").value.trim();
  if (!nama) {
    showToast("Isi nama barang");
    return;
  }
  physical.push({ id: genId(), name: nama, value: n, loc: lok });
  $("nilaiBarang").value = "";
  $("lokasiBarang").value = "";
  const nb = $("namaBarangCustom");
  if (nb) {
    nb.value = "";
    nb.style.display = "none";
  }
  save();
  showToast("Barang ditambah");
}

export function editMoney(id) {
  const it = money.find((x) => x.id === id);
  if (!it) return;
  openMkpModal({
    title: "Edit Aset",
    formHTML: `<input id="editName" class="input" value="${esc(it.name)}"><input id="editNominal" class="input" type="number" value="${it.balance}">`,
    confirmText: "Simpan",
    action: () => {
      const en = $("editName");
      const eno = $("editNominal");
      if (en) it.name = en.value.trim();
      if (eno) it.balance = parseInt(eno.value) || 0;
      save();
    },
  });
}

export function editPhysical(id) {
  const it = physical.find((x) => x.id === id);
  if (!it) return;
  openMkpModal({
    title: "Edit Barang",
    formHTML: `<input id="editNamaBarang" class="input" value="${esc(it.name)}"><input id="editNilaiBarang" class="input" type="number" value="${it.value || 0}">`,
    confirmText: "Simpan",
    action: () => {
      const a = $("editNamaBarang");
      const b = $("editNilaiBarang");
      if (a) it.name = a.value.trim();
      if (b) it.value = parseInt(b.value) || 0;
      save();
    },
  });
}

export function delMoney(id) {
  openMkpModal({
    title: "Hapus aset?",
    confirmText: "Hapus",
    action: () => {
      const idx = money.findIndex((x) => x.id === id);
      if (idx >= 0) money.splice(idx, 1);
      save();
    },
  });
}

export function delPhysical(id) {
  openMkpModal({
    title: "Hapus barang?",
    confirmText: "Hapus",
    action: () => {
      const idx = physical.findIndex((x) => x.id === id);
      if (idx >= 0) physical.splice(idx, 1);
      save();
    },
  });
}

export function deleteBulk(cat) {
  if (cat !== "money" && cat !== "physical") return;
  if (selected[cat].size === 0) {
    showToast("Tidak ada yang dipilih");
    return;
  }
  openMkpModal({
    title: `Hapus ${selected[cat].size} data?`,
    desc: "Hapus terpilih?",
    confirmText: "Hapus",
    action: () => {
      if (cat === "money") {
        const toDel = new Set(selected[cat]);
        for (let i = money.length - 1; i >= 0; i--)
          if (toDel.has(money[i].id)) money.splice(i, 1);
      }
      if (cat === "physical") {
        const toDel = new Set(selected[cat]);
        for (let i = physical.length - 1; i >= 0; i--)
          if (toDel.has(physical[i].id)) physical.splice(i, 1);
      }
      selected[cat].clear();
      bulkMode[cat] = false;
      save();
    },
  });
}

export function renderAsetList() {
  // Ini yang dulu di renderAll() bagian listMoney & listPhysical
  const lm = $("listMoney");
  if (lm)
    lm.innerHTML =
      money
        .map(
          (m) => `
    <div class="item">
      <div class="item-left">
        ${bulkMode["money"] ? `<div class="checkbox ${selected["money"].has(m.id) ? "checked" : ""}" onclick="toggleSelect('money',${m.id})">${selected["money"].has(m.id) ? "✓" : ""}</div>` : ""}
        <div><b>${esc(m.name)}</b><br><small class="num">Rp ${fmt(m.balance)}</small></div>
      </div>
      <div style="display:flex;gap:6px">
        <button type="button" onclick="editMoney(${m.id})" class="iconBtn">✎</button>
        <button type="button" onclick="delMoney(${m.id})" class="iconBtn" style="color:#E02424">✕</button>
      </div>
    </div>`,
        )
        .join("") || '<div class="emptyState">Belum ada aset</div>';

  const lp = $("listPhysical");
  if (lp)
    lp.innerHTML =
      physical
        .map(
          (p) => `
    <div class="item">
      <div class="item-left">
        ${bulkMode["physical"] ? `<div class="checkbox ${selected["physical"].has(p.id) ? "checked" : ""}" onclick="toggleSelect('physical',${p.id})">${selected["physical"].has(p.id) ? "✓" : ""}</div>` : ""}
        <div><b>${esc(p.name)}</b> ${p.loc ? ` - ${esc(p.loc)}` : ""}<br><small class="num">${p.value ? "Rp " + fmt(p.value) : "Inventaris"}</small></div>
      </div>
      <div style="display:flex;gap:6px">
        <button type="button" onclick="editPhysical(${p.id})" class="iconBtn">✎</button>
        <button type="button" onclick="delPhysical(${p.id})" class="iconBtn" style="color:#E02424">✕</button>
      </div>
    </div>`,
        )
        .join("") || '<div class="emptyState">Belum ada barang</div>';
}

// Expose biar onclick lama masih jalan
window.addMoney = addMoney;
window.addPhysical = addPhysical;
window.editMoney = editMoney;
window.editPhysical = editPhysical;
window.delMoney = delMoney;
window.delPhysical = delPhysical;
window.deleteBulk = deleteBulk;
