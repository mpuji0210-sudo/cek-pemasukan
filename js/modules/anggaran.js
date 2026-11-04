// js/modules/anggaran.js - FIXED v2.3 - Safe Target Logic + Robust Null Checks + Global Scope Fix
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

// ========== CONFIG AFFILIATE - GANTI LINK DISINI ==========
const AFFILIATE_CONFIG = {
  LIBURAN: {
    on: true,
    label: '🧳 Koper 24" diskon 60% - Cek Shopee',
    url: "#",
    color: "#FF5722",
  },
  BENSIN: {
    on: true,
    label: "⛽ Oli Irit Bensin 20% - Cek Promo",
    url: "#",
    color: "#0E9F6E",
  },
  MAKAN: {
    on: true,
    label: "🍱 Voucher GrabFood 40% Hari Ini",
    url: "#",
    color: "#F59E0B",
  },
  ROKOK: {
    on: true,
    label: "🚭 Alternatif Hemat - Coba Ini",
    url: "#",
    color: "#64748B",
  },
  KOPI: {
    on: true,
    label: "☕ Kopi Sachet Promo 11.11",
    url: "#",
    color: "#78350F",
  },
  INVESTASI: {
    on: true,
    label: "📈 Buka Bibit Gratis Fee Transaksi",
    url: "#",
    color: "#0E9F6E",
  },
  DARURAT: {
    on: true,
    label: "🛡️ Asuransi Mulai 50rb/bulan",
    url: "#",
    color: "#2563EB",
  },
  "CICILAN HUTANG": {
    on: true,
    label: "💳 Tips Lunasi Hutang Lebih Cepat",
    url: "#",
    color: "#7C3AED",
  },
  LAINNYA: { on: false, label: "", url: "#", color: "#64748B" },
};

export function getAffiliate(kat) {
  const key = String(kat || "")
    .trim()
    .toUpperCase();
  if (AFFILIATE_CONFIG[key]) return AFFILIATE_CONFIG[key];
  if (key.includes("HUTANG")) return AFFILIATE_CONFIG["CICILAN HUTANG"];
  return AFFILIATE_CONFIG["LAINNYA"];
}

export function handleAffClick(kat) {
  const aff = getAffiliate(kat);
  if (!aff || aff.url === "#") {
    showToast("Link promo belum diisi - segera hadir!");
    return;
  }
  try {
    window.open(aff.url, "_blank");
  } catch (e) {
    location.href = aff.url;
  }
}

function findAnggaranByName(nama) {
  return anggaran.find(
    (x) =>
      String(x.nama || x.kat || "")
        .trim()
        .toUpperCase() ===
      String(nama || "")
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

export function addAnggaran() {
  const sel = $("aKategori");
  let katRaw = sel ? sel.value : "Liburan";
  if (katRaw === "lain") {
    const ac = $("aCustom");
    katRaw = ac && ac.value.trim() ? ac.value.trim() : "Lainnya";
  }
  const kat = katRaw.trim().toUpperCase();
  const limit = parseInt($("aLimit")?.value) || 0;
  const namaRaw = $("aNama") ? $("aNama").value.trim() || kat : kat;
  const nama = namaRaw.trim().toUpperCase();
  const target = $("aTarget") ? parseInt($("aTarget").value) || 0 : 0;

  if (!limit) return showToast("Isi limit anggaran");
  if (!nama) return showToast("Isi nama anggaran");

  const ex = findAnggaranByName(nama);
  if (ex) {
    ex.limit = limit;
    ex.target = target;
    ex.kat = kat;
    ex.nama = nama;
    showToast(`Anggaran ${nama} diperbarui`);
  } else {
    anggaran.push({
      id: genId(),
      kat: kat,
      nama: nama,
      limit: limit,
      target: target,
      terkumpul: 0,
    });
    showToast(`Anggaran ${nama} dibuat`);
  }

  if ($("aLimit")) $("aLimit").value = "";
  if ($("aNama")) $("aNama").value = "";
  if ($("aTarget")) $("aTarget").value = "";
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
    desc: "Data anggaran hilang, tapi pengeluaran tetap",
    confirmText: "Hapus",
    action: () => {
      const idx = anggaran.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        anggaran.splice(idx, 1);
        save();
        showToast("Anggaran dihapus");
      }
    },
  });
}

export function editAnggaran(id) {
  const a = anggaran.find((x) => String(x.id) === String(id));
  if (!a) return;
  openMkpModal({
    title: "Edit Anggaran",
    formHTML: `<input id="editAngNama" class="input" value="${esc(a.nama || a.kat)}" placeholder="Nama Anggaran"><input id="editAngLimit" class="input" type="number" value="${a.limit}" placeholder="Limit Bulanan"><input id="editAngTarget" class="input" type="number" value="${a.target || 0}" placeholder="Target Tabungan (Opsional)">`,
    confirmText: "Simpan",
    action: () => {
      const newNama = $("editAngNama")?.value.trim().toUpperCase() || "";
      const newLimit = parseInt($("editAngLimit")?.value) || 0;
      const newTarget = parseInt($("editAngTarget")?.value) || 0;
      if (!newNama || !newLimit) return showToast("Nama & limit wajib diisi");
      if (
        anggaran.some(
          (x) =>
            String(x.id) !== String(id) &&
            String(x.nama || x.kat)
              .trim()
              .toUpperCase() === newNama,
        )
      ) {
        return showToast(`Anggaran ${newNama} sudah ada`);
      }
      a.nama = newNama;
      a.kat = newNama;
      a.limit = newLimit;
      a.target = newTarget;
      save();
      showToast("Anggaran diupdate");
    },
  });
}

export function renderAnggaranList() {
  const nowStr = toJakartaDateString(new Date());
  const currentYM = nowStr.substring(0, 7);

  const la = $("listAnggaran");
  if (la) {
    la.innerHTML =
      anggaran
        .map((a) => {
          const safeId = esc(String(a.id));
          const pctTotal = a.target
            ? Math.min(100, Math.round(((a.terkumpul || 0) / a.target) * 100))
            : 0;
          return `<div class="item"><span><b>${esc(a.nama || a.kat)}</b><br><small class="num">Limit Rp ${fmt(a.limit)} - Terkumpul Rp ${fmt(a.terkumpul || 0)} ${a.target ? `(${pctTotal}%)` : ""}</small></span><div style="display:flex;gap:6px"><button type="button" onclick="editAnggaran('${safeId}')" class="iconBtn">✎</button><button type="button" onclick="delAnggaran('${safeId}')" class="iconBtn" style="color:#E02424">✕</button></div></div>`;
        })
        .join("") || '<div class="emptyState">Belum ada anggaran</div>';
  }

  const ap = $("anggaranProgress");
  if (ap) {
    ap.innerHTML =
      anggaran
        .map((a) => {
          const pakaiBulanIni = pengeluaran
            .filter(
              (e) =>
                String(e.kat).trim().toUpperCase() ===
                  String(a.kat || a.nama)
                    .trim()
                    .toUpperCase() &&
                toJakartaDateString(e.tgl).startsWith(currentYM),
            )
            .reduce((s, x) => s + (x.jml || 0), 0);
          const pct =
            a.limit > 0
              ? Math.min(100, Math.round((pakaiBulanIni / a.limit) * 100))
              : 0;
          const color = pct > 90 ? "#E02424" : pct > 70 ? "#F59E0B" : "#0F172A";
          const aff = getAffiliate(a.kat || a.nama);
          const affBtn =
            aff && aff.on
              ? `<div style="margin-top:6px"><a href="javascript:void(0)" onclick="handleAffClick('${esc(a.kat || a.nama)}')" style="display:inline-block;font-size:11px;font-weight:600;color:${aff.color};background:${aff.color}15;border:1px dashed ${aff.color};padding:4px 8px;border-radius:999px;text-decoration:none">${aff.label} →</a></div>`
              : "";
          return `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><span style="font-size:12px;font-weight:600">${esc(a.nama || a.kat)}</span><span class="num" style="font-size:11px;color:${color}">${pct}% - Rp ${fmt(pakaiBulanIni)}/${fmt(a.limit)}</span></div><div style="margin-top:4px;height:6px;background:#F1F5F9;border-radius:999px;overflow:hidden"><div class="progressFill" style="width:${pct}%;background:${color}"></div></div>${affBtn}</div>`;
        })
        .join("") || '<div class="emptyState">Belum ada anggaran</div>';
  }

  const ak = $("anggaranKhusus");
  if (ak) {
    ak.innerHTML =
      anggaran
        .filter(
          (a) =>
            ["LIBURAN", "INVESTASI", "DARURAT", "CICILAN HUTANG"].includes(
              String(a.kat || a.nama)
                .trim()
                .toUpperCase(),
            ) || String(a.kat).toUpperCase().includes("HUTANG"),
        )
        .map((a) => {
          const targetVal = a.target > 0 ? a.target : 0;
          const pct =
            targetVal > 0
              ? Math.min(
                  100,
                  Math.round(((a.terkumpul || 0) / targetVal) * 100),
                )
              : 0;
          const aff = getAffiliate(a.kat || a.nama);
          const affBtn =
            aff && aff.on
              ? `<a href="javascript:void(0)" onclick="handleAffClick('${esc(a.kat || a.nama)}')" style="margin-top:8px;display:inline-block;font-size:12px;font-weight:700;color:#fff;background:${aff.color};padding:6px 12px;border-radius:999px;text-decoration:none">${aff.label}</a>`
              : "";
          return `<div style="border:1px solid #E2E8F0;border-radius:14px;padding:14px;margin-top:10px"><b>${esc(a.nama || a.kat)}</b><br><small class="num">Terkumpul Rp ${fmt(a.terkumpul || 0)} / Target Rp ${fmt(targetVal)}</small><div class="progressBar" style="height:8px;background:#F1F5F9;border-radius:999px;margin-top:6px;overflow:hidden"><div class="progressFill" style="width:${pct}%;height:100%;background:#0E9F6E;border-radius:999px"></div></div><small>${pct}%</small><br>${affBtn}</div>`;
        })
        .join("") ||
      '<div class="emptyState">Buat anggaran LIBURAN, INVESTASI, DARURAT, CICILAN HUTANG</div>';
  }

  const ba = $("berandaAnggaran");
  if (ba) {
    ba.innerHTML = anggaran.length
      ? `<div class="card"><small style="font-weight:700">Anggaran Bulan Ini (${currentYM})</small>${anggaran
          .map((a) => {
            const pakai = pengeluaran
              .filter(
                (e) =>
                  String(e.kat).trim().toUpperCase() ===
                    String(a.kat || a.nama)
                      .trim()
                      .toUpperCase() &&
                  toJakartaDateString(e.tgl).startsWith(currentYM),
              )
              .reduce((s, x) => s + (x.jml || 0), 0);
            const pct =
              a.limit > 0
                ? Math.min(100, Math.round((pakai / a.limit) * 100))
                : 0;
            return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><span style="font-size:12px">${esc(a.nama || a.kat)}</span><span class="num" style="font-size:11px">${pct}%</span></div><div style="margin-top:4px;height:6px;background:#F1F5F9;border-radius:999px;overflow:hidden"><div class="progressFill" style="width:${pct}%"></div></div></div>`;
          })
          .join("")}</div>`
      : '<div class="card" style="color:#999;font-size:12px">Belum ada anggaran</div>';
  }
}

window.addAnggaran = addAnggaran;
window.delAnggaran = delAnggaran;
window.editAnggaran = editAnggaran;
window.toggleCustomInput = toggleCustomInput;
window.handleAffClick = handleAffClick;
