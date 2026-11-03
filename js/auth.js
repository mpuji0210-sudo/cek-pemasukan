// js/auth.js - FIX AUTO 0 PER USER BARU + HAPUS HANTU 8668888
import { supabase } from "./supabase.js";

export async function checkAuth() {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const userId = session.user.id;
    const lastUid = localStorage.getItem("mkp_last_uid");

    // JIKA GANTI EMAIL / USER BARU -> PAKSA KOSONGKAN
    if (lastUid && lastUid !== userId) {
      console.log("User ganti, reset ke 0");
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
        localStorage.removeItem(`${k}_${lastUid}`);
        localStorage.removeItem(`${k}_${userId}`);
      });
      localStorage.setItem("mkp_last_uid", userId);
      // paksa reload biar app.js baca 0
      localStorage.setItem("brankas_money", "[]");
    } else {
      localStorage.setItem("mkp_last_uid", userId);
    }

    // init app.js biar load data per user
    try {
      const app = await import("./app.js");
      if (app.initForUser) app.initForUser(userId);
    } catch (e) {}

    document.getElementById("authGate").style.display = "none";
  } else {
    const el = document.getElementById("authMsg");
    if (el) el.textContent = "Silakan login";
  }

  supabase.auth.onAuthStateChange(async (e, s) => {
    if (e === "SIGNED_IN" && s?.user) {
      const userId = s.user.id;
      const lastUid = localStorage.getItem("mkp_last_uid");

      if (lastUid && lastUid !== userId) {
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
          localStorage.removeItem(`${k}_${lastUid}`);
        });
      }
      localStorage.setItem("mkp_last_uid", userId);

      try {
        const app = await import("./app.js");
        if (app.initForUser) app.initForUser(userId);
      } catch (e) {}

      const gate = document.getElementById("authGate");
      if (gate) gate.style.display = "none";
    }
    if (e === "SIGNED_OUT") {
      localStorage.removeItem("mkp_last_uid");
    }
  });
}

export async function doLogin() {
  const msg = document.getElementById("authMsg");
  if (msg) msg.textContent = "Redirect ke Google...";
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: "https://cek-pemasukan.mpuji0210.workers.dev" },
  });
}

export function logout() {
  localStorage.removeItem("mkp_last_uid");
  supabase.auth.signOut().then(() => location.reload());
}

window.doLogin = doLogin;
window.logout = logout;
