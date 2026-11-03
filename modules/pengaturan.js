// js/modules/pengaturan.js - Pengaturan (Logout + Reset + Backup) - FIX file lama
import {
  $,
  safeParse,
  money,
  physical,
  invest,
  debts,
  pendapatan,
  pengeluaran,
  anggaran,
  showToast,
  openMkpModal,
  save,
} from "../app.js";
import { supabase } from "../supabase.js";

// --- LOGOUT (dari file lama tapi di-fix) ---
export async function logout() {
  openMkpModal({
    title: "Logout / Ganti Akun?",
    desc: "Sesi Google akan dihapus dan kembali ke login.",
    confirmText: "Logout",
    action: async () => {
      try {
        // Dari file lama: sbClient.auth.signOut()
        // Versi modular pakai supabase.js
        const { error } = await supabase.auth.signOut();
        if (error) console.error(error);
        localStorage.removeItem("supabase.auth.token");
        location.reload();
      } catch (e) {
        console.error(e);
        location.reload();
      }
    },
  });
}

// --- HAPUS SEMUA DATA (dari file lama tapi di-fix) ---
export function resetAll() {
  openMkpModal({
    title: "Hapus SEMUA data?",
    desc: "Ini akan menghapus semua aset, investasi, hutang, transaksi. Tidak bisa dikembalikan!",
    formHTML:
      '<input id="resetConfirm" class="input" placeholder="Ketik RESET untuk hapus"><small style="color:#E02424;font-size:11px;display:block;margin-top:6px">Data di localStorage: brankas_money, brankas_invest dll akan hilang</small>',
    confirmText: "Hapus Semua",
    action: () => {
      const v = document.getElementById("resetConfirm")?.value || "";
      if (v !== "RESET") {
        showToast("Ketik RESET dulu");
        return;
      }
      localStorage.clear();
      // Kosongkan array global (biar renderAll gak baca cache lama)
      money.length = 0;
      physical.length = 0;
      invest.length = 0;
      debts.length = 0;
      pendapatan.length = 0;
      pengeluaran.length = 0;
      anggaran.length = 0;
      save();
      showToast("Semua data dihapus");
      setTimeout(() => location.reload(), 500);
    },
  });
}

// --- TAMBAHAN BARU: Export / Import (biar kejadian -1.150.000 kemarin gak hilang) ---
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
  showToast("Backup di-download");
}

export function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.money)
        localStorage.setItem("brankas_money", JSON.stringify(data.money));
      if (data.physical)
        localStorage.setItem("brankas_physical", JSON.stringify(data.physical));
      if (data.invest)
        localStorage.setItem("brankas_invest", JSON.stringify(data.invest));
      if (data.debts || data.brankas_debt)
        localStorage.setItem(
          "brankas_debt",
          JSON.stringify(data.debts || data.brankas_debt),
        );
      if (data.pendapatan)
        localStorage.setItem(
          "brankas_pendapatan",
          JSON.stringify(data.pendapatan),
        );
      if (data.pengeluaran)
        localStorage.setItem(
          "brankas_pengeluaran",
          JSON.stringify(data.pengeluaran),
        );
      if (data.anggaran)
        localStorage.setItem("brankas_anggaran", JSON.stringify(data.anggaran));
      showToast("Import berhasil, reload...");
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
    const user = safeParse("mkp_user", null);
    info.innerHTML = `
      <div style="margin-top:12px;text-align:left">
        <div style="font-size:11px;color:#64748B">Total Data:</div>
        <div class="num" style="font-size:11px">Aset: ${money.length} | Invest: ${invest.length} | Hutang: ${debts.length}<br>Masuk: ${pendapatan.length} | Keluar: ${pengeluaran.length}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
          <button onclick="exportData()" class="btn-outline" style="padding:10px;font-size:12px;margin:0">📤 Export Backup</button>
          <label style="border:1px solid var(--line);border-radius:12px;padding:10px;font-size:12px;text-align:center;cursor:pointer;background:#fff">📥 Import<input type="file" accept=".json" style="display:none" onchange="importData(this.files[0])"></label>
        </div>
      </div>
    `;
  }
}

// Expose biar onclick di HTML lama jalan
window.logout = logout;
window.resetAll = resetAll;
window.exportData = exportData;
window.importData = importData;
