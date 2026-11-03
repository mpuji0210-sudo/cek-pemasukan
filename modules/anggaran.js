// js/modules/anggaran.js - Anggaran (Liburan, Investasi, Darurat, Bensin, Makan)
import {
  $,
  fmt,
  esc,
  genId,
  anggaran,
  pengeluaran,
  save,
  showToast,
  openMkpModal,
  toggleCustomInput,
} from "../app.js";

export function addAnggaran() {
  const sel = $("aKategori");
  let kat = sel ? sel.value : "Liburan";
  if (kat === "lain") {
    const ac = $("aCustom");
    kat = ac && ac.value.trim() ? ac.value.trim() : "Lainnya";
  }
  const limit = parseInt($("aLimit").value) || 0;
  const nama = $("aNama") ? $("aNama").value.trim() || kat : kat;
  const target = $("aTarget") ? parseInt($("aTarget").value) || 0 : 0;
  if (!limit) {
    showToast("Isi limit");
    return;
  }
  const ex = anggaran.find((x) => x.nama.toLowerCase() === nama.toLowerCase());
  if (ex) {
    ex.limit = limit;
    ex.target = target;
    ex.kat = kat;
    showToast("Anggaran diperbarui");
  } else {
    anggaran.push({
      id: genId(),
      kat: kat,
      nama: nama,
      limit: limit,
      target: target,
      terkumpul: 0,
    });
    showToast("Anggaran dibuat");
  }
  const al = $("aLimit");
  if (al) al.value = "";
  const an = $("aNama");
  if (an) an.value = "";
  const at = $("aTarget");
  if (at) at.value = "";
  const ac2 = $("aCustom");
  if (ac2) {
    ac2.value = "";
    ac2.style.display = "none";
  }
  save();
}

export function delAnggaran(id) {
  openMkpModal({
    title: "Hapus anggaran?",
    confirmText: "Hapus",
    action: () => {
      const idx = anggaran.findIndex((x) => x.id === id);
      if (idx >= 0) anggaran.splice(idx, 1);
      save();
    },
  });
}

export function renderAnggaranList() {
  // List Anggaran (dari file lama)
  const la = $("listAnggaran");
  if (la)
    la.innerHTML =
      anggaran
        .map(
          (a) => `
    <div class="item">
      <span><b>${esc(a.nama || a.kat)}</b><br><small class="num">Limit Rp ${fmt(a.limit)} - Terkumpul Rp ${fmt(a.terkumpul || 0)}</small></span>
      <button type="button" onclick="delAnggaran(${a.id})" class="iconBtn" style="color:#E02424">✕</button>
    </div>`,
        )
        .join("") || '<div class="emptyState">Belum ada anggaran</div>';

  // Realisasi vs Anggaran Bulan Ini (dari file lama)
  const ap = $("anggaranProgress");
  if (ap)
    ap.innerHTML =
      anggaran
        .map((a) => {
          const pakai = pengeluaran
            .filter((e) => e.kat === a.kat || e.kat === a.nama)
            .reduce((s, x) => {
              const d = new Date(x.tgl);
              return d.getMonth() === new Date().getMonth() &&
                d.getFullYear() === new Date().getFullYear()
                ? s + x.jml
                : s;
            }, 0);
          const pct = Math.min(100, Math.round((pakai / a.limit) * 100));
          return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:12px;font-weight:600">${esc(a.nama || a.kat)}</span>
        <span class="num" style="font-size:11px">${pct}%</span>
      </div>
      <div style="margin-top:4px;height:6px;background:#F1F5F9;border-radius:999px;overflow:hidden">
        <div class="progressFill" style="width:${pct}%"></div>
      </div>
    </div>`;
        })
        .join("") || '<div class="emptyState">Belum ada anggaran</div>';

  // Anggaran Tabungan (Liburan, Investasi, Darurat, Cicilan Hutang)
  const ak = $("anggaranKhusus");
  if (ak)
    ak.innerHTML =
      anggaran
        .filter(
          (a) =>
            ["Liburan", "Investasi", "Darurat", "Cicilan Hutang"].indexOf(
              a.kat,
            ) >= 0,
        )
        .map((a) => {
          const pct = a.target
            ? Math.min(100, Math.round(((a.terkumpul || 0) / a.target) * 100))
            : 0;
          return `<div style="border:1px solid #E2E8F0;border-radius:14px;padding:14px;margin-top:10px">
      <b>${esc(a.nama || a.kat)}</b><br>
      <small class="num">Terkumpul Rp ${fmt(a.terkumpul || 0)} / Target Rp ${fmt(a.target || a.limit)}</small>
      <div class="progressBar"><div class="progressFill" style="width:${pct}%"></div></div>
    </div>`;
        })
        .join("") ||
      '<div class="emptyState">Buat anggaran Liburan, Investasi, Darurat, Cicilan Hutang</div>';

  // Beranda Anggaran Bulan Ini
  const monthNow = new Date().getMonth();
  const yearNow = new Date().getFullYear();
  const pengeluaranBulan = pengeluaran.filter((h) => {
    const d = new Date(h.tgl);
    return d.getMonth() === monthNow && d.getFullYear() === yearNow;
  });
  const ba = $("berandaAnggaran");
  if (ba)
    ba.innerHTML = anggaran.length
      ? `<div class="card"><small style="font-weight:700">Anggaran Bulan Ini</small>${anggaran
          .map((a) => {
            const pakai = pengeluaranBulan
              .filter((e) => e.kat === a.kat || e.kat === a.nama)
              .reduce((s, x) => s + x.jml, 0);
            const pct = Math.min(100, Math.round((pakai / a.limit) * 100));
            return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><span style="font-size:12px">${esc(a.nama || a.kat)}</span><span class="num" style="font-size:11px">${pct}%</span></div><div style="margin-top:4px;height:6px;background:#F1F5F9;border-radius:999px;overflow:hidden"><div class="progressFill" style="width:${pct}%"></div></div></div>`;
          })
          .join("")}</div>`
      : '<div class="card" style="color:#999;font-size:12px">Belum ada anggaran</div>';
}

// Expose
window.addAnggaran = addAnggaran;
window.delAnggaran = delAnggaran;
window.toggleCustomInput = toggleCustomInput;
