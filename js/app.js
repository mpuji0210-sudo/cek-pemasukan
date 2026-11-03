// js/app.js - OTAK UTAMA MKP MODULAR FINAL - FIX AUTO 0 PER USER
import { supabase } from "./supabase.js";
import { checkAuth } from "./auth.js";

// --- UTILS ---
export function esc(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
}
export function fmt(n) {
  return new Intl.NumberFormat("id-ID").format(n || 0);
}
export function $(id) {
  return document.getElementById(id);
}
export function genId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// FIX: KEY PER USER + BERSIHIN HANTU 8668888
function getUserKey(k) {
  const uid = localStorage.getItem("mkp_last_uid") || "guest";
  return `${k}_${uid}`;
}

export function safeParse(k, fb) {
  try {
    // ambil per-user dulu, kalau gak ada fallback ke global (data lama)
    let v = localStorage.getItem(getUserKey(k)) || localStorage.getItem(k);
    if (!v) return fb;
    let parsed = JSON.parse(v);
    // FILTER HANTU 8668888 OTOMATIS
    if (Array.isArray(parsed)) {
      parsed = parsed.filter((x) => {
        if (!x) return false;
        if (x.balance === 8668888 || x.balance === 866888) return false;
        if (x.value === 8668888 || x.value === 866888) return false;
        if (x.jml === 8668888) return false;
        return true;
      });
    }
    return parsed;
  } catch (e) {
    return fb;
  }
}

export let money = safeParse("brankas_money", []),
  physical = safeParse("brankas_physical", []),
  invest = safeParse("brankas_invest", []),
  debts = safeParse("brankas_debt", []),
  pendapatan = safeParse("brankas_pendapatan", []),
  pengeluaran = safeParse("brankas_pengeluaran", []),
  anggaran = safeParse("brankas_anggaran", []);

export let berandaView = "hari",
  berandaDateFilter = null,
  berandaMonthFilter = null,
  masukFilter = "hari",
  keluarFilter = "hari";

export let bulkMode = {
    money: false,
    invest: false,
    physical: false,
    debts: false,
    pendapatan: false,
    pengeluaran: false,
  },
  selected = {
    money: new Set(),
    invest: new Set(),
    physical: new Set(),
    debts: new Set(),
    pendapatan: new Set(),
    pengeluaran: new Set(),
  };
export let _pendingAction = null;

// DIPANGGIL DARI auth.js SETIAP LOGIN
export function initForUser(userId) {
  const last = localStorage.getItem("mkp_last_uid");
  if (last && last !== userId) {
    // GANTI EMAIL / USER BARU -> PAKSA 0
    money = [];
    physical = [];
    invest = [];
    debts = [];
    pendapatan = [];
    pengeluaran = [];
    anggaran = [];
    localStorage.setItem("mkp_last_uid", userId);
    save();
  } else {
    localStorage.setItem("mkp_last_uid", userId);
    // load ulang data per user
    money = safeParse("brankas_money", []);
    physical = safeParse("brankas_physical", []);
    invest = safeParse("brankas_invest", []);
    debts = safeParse("brankas_debt", []);
    pendapatan = safeParse("brankas_pendapatan", []);
    pengeluaran = safeParse("brankas_pengeluaran", []);
    anggaran = safeParse("brankas_anggaran", []);
  }
}

// --- TOAST & MODAL ---
export function showToast(m) {
  let t = $("toast");
  if (!t) return;
  t.textContent = m;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
export function openMkpModal(o) {
  $("mTitle").textContent = o.title || "Konfirmasi";
  $("mDesc").textContent = o.desc || "";
  let mf = $("mForm");
  if (mf) {
    if (o.formHTML) {
      mf.style.display = "block";
      mf.innerHTML = o.formHTML;
    } else mf.style.display = "none";
  }
  $("mConfirmBtn").textContent = o.confirmText || "Ya";
  _pendingAction = o.action;
  $("mkpModal").classList.add("open");
}
export function closeMkpModal() {
  $("mkpModal").classList.remove("open");
  _pendingAction = null;
}
export function confirmMkpAction() {
  if (_pendingAction) _pendingAction();
  closeMkpModal();
}
export function openCalModal() {
  $("calModal").classList.add("open");
}
export function closeCalModal() {
  $("calModal").classList.remove("open");
  renderAll();
}
export function toggleMenu() {
  let d = $("drawer"),
    ov = $("ov");
  if (d.classList.contains("open")) {
    d.classList.remove("open");
    ov.classList.remove("open");
    document.body.style.overflow = "";
  } else {
    d.classList.add("open");
    ov.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}
export function openTab(t) {
  document
    .querySelectorAll(".tab")
    .forEach((x) => x.classList.remove("active"));
  let tg = $("tab-" + t);
  if (tg) tg.classList.add("active");
  document
    .querySelectorAll(".m-item")
    .forEach((b) => b.classList.remove("active"));
  let dr = $("drawer");
  if (dr && dr.classList.contains("open")) toggleMenu();
  document
    .querySelectorAll(".bNavItem")
    .forEach((b) => b.classList.remove("active"));
  let map = {
    beranda: "bBeranda",
    pendapatan: "bTransaksi",
    pengeluaran: "bTransaksi",
    investasi: "bInvestasi",
    anggaran: "bAnggaran",
    pengaturan: "bProfil",
    aset: "bBeranda",
    hutang: "bBeranda",
  };
  let el = $(map[t] || "bBeranda");
  if (el) el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => renderAll(), 80);
}
export function toggleCustomInput(s, i) {
  let sel = $(s),
    inp = $(i);
  if (!sel || !inp) return;
  inp.style.display = sel.value === "lain" ? "block" : "none";
}
export function setBerandaView(v) {
  berandaView = v;
  document
    .querySelectorAll("#calModal .filterChip")
    .forEach((c) => c.classList.remove("active"));
  let m = {
    hari: "chipHari",
    bulan: "chipBulan",
    tahun: "chipTahun",
    semua: "chipSemua",
  };
  let el = $(m[v]);
  if (el) el.classList.add("active");
  renderAll();
}
export function setBerandaCustomDate() {
  let bd = $("berandaDate");
  berandaDateFilter = bd && bd.value ? new Date(bd.value) : null;
  berandaView = "custom";
  document
    .querySelectorAll("#calModal .filterChip")
    .forEach((c) => c.classList.remove("active"));
  renderAll();
}
export function setBerandaCustomMonth() {
  let bm = $("berandaMonth");
  berandaMonthFilter = bm && bm.value ? bm.value : null;
  berandaView = "customMonth";
  document
    .querySelectorAll("#calModal .filterChip")
    .forEach((c) => c.classList.remove("active"));
  renderAll();
}
export function resetBerandaFilter() {
  let bd = $("berandaDate");
  if (bd) bd.value = "";
  let bm = $("berandaMonth");
  if (bm) bm.value = "";
  berandaDateFilter = null;
  berandaMonthFilter = null;
  berandaView = "hari";
  document
    .querySelectorAll("#calModal .filterChip")
    .forEach((c) => c.classList.remove("active"));
  let ch = $("chipHari");
  if (ch) ch.classList.add("active");
  closeCalModal();
}
export function setFilter(type, val) {
  if (type === "pendapatan") {
    masukFilter = val;
    document
      .querySelectorAll("[id^=mChip]")
      .forEach((e) => e.classList.remove("active"));
    let el = $("mChip" + val.charAt(0).toUpperCase() + val.slice(1));
    if (el) el.classList.add("active");
  } else {
    keluarFilter = val;
    document
      .querySelectorAll("[id^=kChip]")
      .forEach((e) => e.classList.remove("active"));
    let el2 = $("kChip" + val.charAt(0).toUpperCase() + val.slice(1));
    if (el2) el2.classList.add("active");
  }
  renderAll();
}
export function filterCustom(type) {
  if (type === "pendapatan") masukFilter = "custom";
  else keluarFilter = "custom";
  renderAll();
}
export function toggleBulk(cat) {
  bulkMode[cat] = !bulkMode[cat];
  selected[cat].clear();
  renderAll();
}
export function toggleSelect(cat, id) {
  if (selected[cat].has(id)) selected[cat].delete(id);
  else selected[cat].add(id);
  renderAll();
}
export function deleteBulk(cat) {
  if (selected[cat].size === 0) {
    showToast("Tidak ada yang dipilih");
    return;
  }
  openMkpModal({
    title: `Hapus ${selected[cat].size} data?`,
    desc: "Hapus terpilih?",
    confirmText: "Hapus",
    action: () => {
      if (cat === "money")
        money = money.filter((x) => !selected[cat].has(x.id));
      if (cat === "invest")
        invest = invest.filter((x) => !selected[cat].has(x.id));
      if (cat === "physical")
        physical = physical.filter((x) => !selected[cat].has(x.id));
      if (cat === "debts")
        debts = debts.filter((x) => !selected[cat].has(x.id));
      if (cat === "pendapatan") {
        pendapatan
          .filter((x) => selected[cat].has(x.id))
          .forEach((h) => {
            let m = money.find((x) => x.name === h.sumber);
            if (m) m.balance -= h.jml;
          });
        pendapatan = pendapatan.filter((x) => !selected[cat].has(x.id));
      }
      if (cat === "pengeluaran") {
        pengeluaran
          .filter((x) => selected[cat].has(x.id))
          .forEach((h) => {
            let m = money.find((x) => x.name === h.sumber);
            if (m) m.balance += h.jml;
          });
        pengeluaran = pengeluaran.filter((x) => !selected[cat].has(x.id));
      }
      selected[cat].clear();
      bulkMode[cat] = false;
      save();
    },
  });
}
export function resetAll() {
  openMkpModal({
    title: "Hapus semua data?",
    desc: "Ketik RESET",
    formHTML:
      '<input id="resetConfirm" class="input" placeholder="Ketik RESET">',
    confirmText: "Hapus Semua",
    action: () => {
      let v = $("resetConfirm") ? $("resetConfirm").value : "";
      if (v !== "RESET") {
        showToast("Ketik RESET");
        return;
      }
      const uid = localStorage.getItem("mkp_last_uid") || "guest";
      // hapus data per user + global
      [
        "brankas_money",
        "brankas_physical",
        "brankas_invest",
        "brankas_debt",
        "brankas_pendapatan",
        "brankas_pengeluaran",
        "brankas_anggaran",
      ].forEach((k) => {
        localStorage.removeItem(k);
        localStorage.removeItem(`${k}_${uid}`);
      });
      money = [];
      physical = [];
      invest = [];
      debts = [];
      pendapatan = [];
      pengeluaran = [];
      anggaran = [];
      save();
    },
  });
}

export function save() {
  // simpan per-user
  localStorage.setItem(getUserKey("brankas_money"), JSON.stringify(money));
  localStorage.setItem(
    getUserKey("brankas_physical"),
    JSON.stringify(physical),
  );
  localStorage.setItem(getUserKey("brankas_invest"), JSON.stringify(invest));
  localStorage.setItem(getUserKey("brankas_debt"), JSON.stringify(debts));
  localStorage.setItem(
    getUserKey("brankas_pendapatan"),
    JSON.stringify(pendapatan),
  );
  localStorage.setItem(
    getUserKey("brankas_pengeluaran"),
    JSON.stringify(pengeluaran),
  );
  localStorage.setItem(
    getUserKey("brankas_anggaran"),
    JSON.stringify(anggaran),
  );
  // hapus sisa global biar gak balik hantu
  localStorage.removeItem("brankas_money");
  renderAll();
}

// --- RENDER ALL MODULAR ---
export async function renderAll() {
  try {
    const { renderBeranda } = await import("./modules/beranda.js");
    const { renderInvestasiList } = await import("./modules/investasi.js");
    const { renderMasukList } = await import("./modules/arus-masuk.js");
    const { renderKeluarList } = await import("./modules/arus-keluar.js");
    const { renderAnggaranList } = await import("./modules/anggaran.js");
    const { renderAsetList } = await import("./modules/aset.js");
    const { renderHutangList } = await import("./modules/hutang.js");

    renderBeranda(
      money,
      physical,
      invest,
      debts,
      pendapatan,
      pengeluaran,
      anggaran,
      berandaView,
      berandaDateFilter,
      berandaMonthFilter,
    );
    renderInvestasiList();
    renderMasukList();
    renderKeluarList();
    renderAnggaranList();
    if (renderAsetList) renderAsetList();
    if (renderHutangList) renderHutangList();

    let opts = money
      .map((m) => `<option value="${esc(m.name)}">${esc(m.name)}</option>`)
      .join("");
    let sb = $("sumberBayar");
    if (sb)
      sb.innerHTML = '<option value="">Pilih sumber bayar</option>' + opts;
    let ps = $("pSumber");
    if (ps)
      ps.innerHTML = '<option value="">Pilih sumber masuk</option>' + opts;
    let es = $("eSumber");
    if (es)
      es.innerHTML = '<option value="">Pilih sumber keluar</option>' + opts;

    [
      "money",
      "invest",
      "physical",
      "debts",
      "pendapatan",
      "pengeluaran",
    ].forEach((cat) => {
      let bulkEl = $("bulk" + cat.charAt(0).toUpperCase() + cat.slice(1));
      if (bulkEl) {
        if (bulkMode[cat]) bulkEl.classList.add("show");
        else bulkEl.classList.remove("show");
      }
      let countEl = $("count" + cat.charAt(0).toUpperCase() + cat.slice(1));
      if (countEl) countEl.textContent = selected[cat].size;
    });
  } catch (e) {
    console.error("renderAll", e);
  }
}

// Expose
window.toggleMenu = toggleMenu;
window.openTab = openTab;
window.openCalModal = openCalModal;
window.closeCalModal = closeCalModal;
window.closeMkpModal = closeMkpModal;
window.confirmMkpAction = confirmMkpAction;
window.setBerandaView = setBerandaView;
window.setBerandaCustomDate = setBerandaCustomDate;
window.setBerandaCustomMonth = setBerandaCustomMonth;
window.resetBerandaFilter = resetBerandaFilter;
window.setFilter = setFilter;
window.filterCustom = filterCustom;
window.toggleBulk = toggleBulk;
window.toggleSelect = toggleSelect;
window.toggleCustomInput = toggleCustomInput;
window.showToast = showToast;
window.deleteBulk = deleteBulk;
window.resetAll = resetAll;
window.save = save;
window.initForUser = initForUser;

import "./modules/aset.js";
import "./modules/hutang.js";
import "./modules/investasi.js";
import "./modules/arus-masuk.js";
import "./modules/arus-keluar.js";
import "./modules/anggaran.js";
import "./modules/pengaturan.js";
import "./modules/ai.js";

// Init
checkAuth();
renderAll();
