// js/modules/pengaturan.js - FINAL APPROVED v1.3 - Clean Imports + Consistent DOM Helper + Optimized Reset
import {
  $,
  money,
  physical,
  invest,
  debts,
  pendapatan,
  pengeluaran,
  anggaran,
  showToast,
  openMkpModal,
} from "../app.js";
import { supabase } from "../supabase.js";

export async function logout() {
  openMkpModal({
    title: "Logout / Ganti Akun?",
    desc: "Sesi Google akan dihapus dan Anda akan dikembalikan ke halaman login.",
    confirmText: "Logout",
    action: async () => {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem("supabase.auth.token");
        location.reload();
      } catch (e) {
        location.reload();
      }
    },
  });
}

export function resetAll() {
  openMkpModal({
    title: "Hapus SEMUA data?",
    desc: "Ini akan menghapus seluruh aset, investasi, hutang, dan transaksi Anda secara permanen!",
    formHTML:
      '<input id="resetConfirm" class="input" placeholder="Ketik RESET untuk konfirmasi"><small style="color:#E02424;font-size:11px;display:block;margin-top:6px">Seluruh data brankas akan hilang</small>',
    confirmText: "Hapus Semua",
    action: () => {
      const v = $("resetConfirm")?.value || "";
      if (v !== "RESET") {
        showToast("Ketik RESET dulu dengan benar");
        return;
      }

      const uid = localStorage.getItem("mkp_last_uid") || "guest";
      const keys = [
        "brankas_money",
        "brankas_physical",
        "brankas_invest",
        "brankas_debt",
        "brankas_pendapatan",
        "brankas_pengeluaran",
        "brankas_anggaran",
      ];

      keys.forEach((k) => {
        localStorage.removeItem(k);
        localStorage.removeItem(`${k}_${uid}`);
      });

      [
        money,
        physical,
        invest,
        debts,
        pendapatan,
        pengeluaran,
        anggaran,
      ].forEach((a) => (a.length = 0));

      showToast("Semua data berhasil dihapus");
      setTimeout(() => location.reload(), 500);
    },
  });
}

export function exportData() {
  const data = {
    money,
    physical,
    invest,
    debts,
    pendapatan,
    pengeluaran,
    anggaran,
    exported_at: new Date().toISOString(),
    uid: localStorage.getItem("mkp_last_uid") || "guest",
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mkp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast("File backup berhasil di-download");
}

export function importData(file) {
  if (!file) return;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const uid = localStorage.getItem("mkp_last_uid") || "guest";
      const saveKey = (k, v) => {
        if (v) localStorage.setItem(`${k}_${uid}`, JSON.stringify(v));
      };

      if (data.money) saveKey("brankas_money", data.money);
      if (data.physical) saveKey("brankas_physical", data.physical);
      if (data.invest) saveKey("brankas_invest", data.invest);
      if (data.debts || data.brankas_debt)
        saveKey("brankas_debt", data.debts || data.brankas_debt);
      if (data.pendapatan) saveKey("brankas_pendapatan", data.pendapatan);
      if (data.pengeluaran) saveKey("brankas_pengeluaran", data.pengeluaran);
      if (data.anggaran) saveKey("brankas_anggaran", data.anggaran);

      showToast("Import berhasil, memuat ulang...");
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      showToast("File tidak valid: " + err.message);
    }
  };

  reader.readAsText(file);
}

export function renderPengaturan() {
  const info = $("userInfo");
  if (info) {
    info.innerHTML = `
      <div style="margin-top:12px;text-align:left">
        <div style="font-size:11px;color:#64748B">Total Data Tersimpan:</div>
        <div class="num" style="font-size:11px">Aset: ${money.length} | Invest: ${invest.length} | Hutang: ${debts.length}<br>Masuk: ${pendapatan.length} | Keluar: ${pengeluaran.length}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
          <button type="button" onclick="exportData()" class="btn-outline" style="padding:10px;font-size:12px;margin:0">📤 Export Backup</button>
          <label style="border:1px solid #E2E8F0;border-radius:12px;padding:10px;font-size:12px;text-align:center;cursor:pointer;background:#fff">📥 Import<input type="file" accept=".json" style="display:none" onchange="importData(this.files[0])"></label>
        </div>
        <div style="margin-top:10px;font-size:10px;color:#94A3B8;text-align:center">Rutinlah melakukan backup data untuk keamanan finansial Anda</div>
      </div>`;
  }
}

window.logout = logout;
window.resetAll = resetAll;
window.exportData = exportData;
window.importData = importData;
window.renderPengaturan = renderPengaturan;
