// js/auth.js
import { supabase } from "./supabase.js";
export async function checkAuth() {
  let {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    document.getElementById("authGate").style.display = "none";
  } else {
    document.getElementById("authMsg").textContent = "Silakan login";
  }
  supabase.auth.onAuthStateChange((e, s) => {
    if (e === "SIGNED_IN") {
      document.getElementById("authGate").style.display = "none";
    }
  });
}
export async function doLogin() {
  document.getElementById("authMsg").textContent = "Redirect ke Google...";
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: "https://cek-pemasukan.mpuji0210.workers.dev" },
  });
}
export function logout() {
  supabase.auth.signOut().then(() => location.reload());
}
window.doLogin = doLogin;
window.logout = logout;
