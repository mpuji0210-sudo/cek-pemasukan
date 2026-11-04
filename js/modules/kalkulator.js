// js/modules/kalkulator.js - FINAL APPROVED v1.1 - Complete + Safe + Affiliate Ready
import { $, fmt, pengeluaran } from "../app.js";
const AFF = {
  BIBIT: "https://go.accesstrade.co.id/your-bibit-link",
  JAGO: "https://go.accesstrade.co.id/your-jago-link",
  KTA: "https://go.accesstrade.co.id/your-kta-link",
  EMAS: "https://shope.ee/your-emas-link",
};
function fvAnnuity(pmt, rate, n) {
  if (rate === 0) return pmt * n;
  return pmt * ((Math.pow(1 + rate, n) - 1) / rate);
}
function getAvgExpense() {
  const bulanIni = new Date().getMonth();
  const expBulan = pengeluaran
    .filter((h) => new Date(h.tgl).getMonth() === bulanIni)
    .reduce((s, x) => s + (x.jml || 0), 0);
  if (expBulan > 0) return expBulan;
  const totalAll = pengeluaran.reduce((s, x) => s + (x.jml || 0), 0);
  return totalAll > 0 ? totalAll / 3 : 5000000;
}
export function renderKalkulator() {
  const el =
    $("kalkulatorTab") ||
    $("tab-kalkulator") ||
    $("contentKalkulator") ||
    $("tab-anggaran");
  if (!el) return;
  const avgExp = getAvgExpense();
  el.innerHTML = `
  <div style="padding:12px;display:grid;gap:16px">
    <h3 style="margin:0">🧮 Kalkulator Keuangan V2</h3>
    <div class="card" style="padding:14px"><b>🚨 Dana Darurat</b><br><small style="color:#64748B">Avg: Rp ${fmt(avgExp)}/bln</small><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><select id="calcDaruratStatus" class="input"><option value="1">Single (1x)</option><option value="3">Menikah (3x)</option><option value="6" selected>Menikah+Anak 1 (6x)</option><option value="12">Anak 2+ (12x)</option></select><button type="button" class="btn btn-y" onclick="calcDarurat()">Hitung</button></div><div id="calcDaruratResult" style="margin-top:10px"></div></div>
    <div class="card" style="padding:14px;border-left:4px solid #6366F1"><b>👴 Dana Pensiun</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><input id="calcUmur" type="number" class="input" placeholder="Umur sekarang" value="30"><input id="calcPensiunUmur" type="number" class="input" placeholder="Pensiun umur" value="55"><input id="calcButuh" type="number" class="input" placeholder="Butuh/bln" value="10000000"><input id="calcReturn" type="number" class="input" placeholder="Return %" value="8"></div><button type="button" class="btn btn-y" style="margin-top:8px;width:100%" onclick="calcPensiun()">Hitung Pensiun</button><div id="calcPensiunResult" style="margin-top:10px"></div></div>
    <div class="card" style="padding:14px;border-left:4px solid #0E9F6E"><b>🔥 Financial Freedom (FIRE 4%)</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><input id="calcFireExp" type="number" class="input" value="${Math.round(avgExp)}"><button type="button" class="btn btn-y" onclick="calcFire()">Hitung FIRE</button></div><div id="calcFireResult" style="margin-top:10px"></div></div>
    <div class="card" style="padding:14px;border-left:4px solid #F59E0B"><b>🎓 Sekolah Anak</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><input id="calcSekolahBiaya" type="number" class="input" value="100000000"><input id="calcSekolahTahun" type="number" class="input" value="12"><input id="calcSekolahInflasi" type="number" class="input" value="10"><button type="button" class="btn btn-y" onclick="calcSekolah()">Hitung Sekolah</button></div><div id="calcSekolahResult" style="margin-top:10px"></div></div>
    <div class="card" style="padding:14px"><b>🏠 DP Rumah</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><input id="calcRumahHarga" type="number" class="input" value="600000000"><input id="calcRumahDp" type="number" class="input" value="20"><input id="calcRumahTahun" type="number" class="input" value="3"><button type="button" class="btn btn-y" onclick="calcRumah()">Hitung DP</button></div><div id="calcRumahResult" style="margin-top:10px"></div></div>
  </div>`;
}
export function calcDarurat() {
  const status = parseInt($("calcDaruratStatus")?.value) || 6;
  const avg = getAvgExpense();
  const total = avg * status;
  const el = $("calcDaruratResult");
  if (!el) return;
  el.innerHTML = `<div style="background:#F1F5F9;padding:12px;border-radius:10px"><div style="font-size:13px">Total: <b>Rp ${fmt(total)}</b> (${status}x)</div><div style="margin-top:8px"><a href="${AFF.JAGO}" target="_blank" style="display:block;text-align:center;background:#0F172A;color:#fff;padding:8px;border-radius:8px;font-size:12px;text-decoration:none;font-weight:700">💰 Simpan di Jago 5% →</a></div></div>`;
}
export function calcPensiun() {
  const umur = parseInt($("calcUmur")?.value) || 30;
  const pensiunUmur = parseInt($("calcPensiunUmur")?.value) || 55;
  const butuh = parseInt($("calcButuh")?.value) || 10000000;
  const ret = (parseFloat($("calcReturn")?.value) || 8) / 100 / 12;
  const tahunMenabung = Math.max(1, pensiunUmur - umur);
  const bulanMenabung = tahunMenabung * 12;
  const butuhTotal = butuh * 12 * 20 * 1.5;
  const pmt =
    butuhTotal / ((Math.pow(1 + ret, bulanMenabung) - 1) / (ret || 0.0001));
  $("calcPensiunResult").innerHTML =
    `<div style="background:#EEF2FF;padding:12px;border-radius:10px"><div>Tabung <b>Rp ${fmt(Math.round(pmt))}/bln</b> selama ${tahunMenabung} thn</div><div style="font-size:11px;color:#6366F1">Target Rp ${fmt(Math.round(butuhTotal))}</div><a href="${AFF.BIBIT}" target="_blank" style="display:block;text-align:center;background:#6366F1;color:#fff;padding:8px;border-radius:8px;font-size:12px;text-decoration:none;font-weight:700;margin-top:8px">📈 Invest Pensiun di Bibit →</a></div>`;
}
export function calcFire() {
  const expBulan = parseInt($("calcFireExp")?.value) || getAvgExpense();
  const targetFire = expBulan * 12 * 25;
  $("calcFireResult").innerHTML =
    `<div style="background:#ECFDF5;padding:12px;border-radius:10px"><div style="font-size:15px;font-weight:800;color:#0E9F6E">Rp ${fmt(targetFire)}</div><small>FIRE 4% dari Rp ${fmt(expBulan)}/bln</small><a href="${AFF.BIBIT}" target="_blank" style="display:block;text-align:center;background:#0E9F6E;color:#fff;padding:8px;border-radius:8px;font-size:12px;text-decoration:none;font-weight:700;margin-top:8px">🔥 Mulai FIRE →</a></div>`;
}
export function calcSekolah() {
  const biayaSekarang = parseInt($("calcSekolahBiaya")?.value) || 100000000;
  const tahunLagi = parseInt($("calcSekolahTahun")?.value) || 12;
  const inflasiPendidikan =
    (parseFloat($("calcSekolahInflasi")?.value) || 10) / 100;
  const biayaMasaDepan =
    biayaSekarang * Math.pow(1 + inflasiPendidikan, tahunLagi);
  const pmt =
    biayaMasaDepan /
    ((Math.pow(1 + 0.1 / 12, tahunLagi * 12) - 1) / (0.1 / 12));
  $("calcSekolahResult").innerHTML =
    `<div style="background:#FEF3C7;padding:12px;border-radius:10px"><div>Jadi Rp <b>${fmt(Math.round(biayaMasaDepan))}</b> - Tabung <b>Rp ${fmt(Math.round(pmt))}/bln</b></div><a href="${AFF.BIBIT}" target="_blank" style="display:block;text-align:center;background:#F59E0B;color:#fff;padding:8px;border-radius:8px;font-size:12px;text-decoration:none;font-weight:700;margin-top:8px">🎓 Bibit Pendidikan →</a></div>`;
}
export function calcRumah() {
  const hargaRumah = parseInt($("calcRumahHarga")?.value) || 600000000;
  const dpPct = parseFloat($("calcRumahDp")?.value) || 20;
  const targetTahun = parseInt($("calcRumahTahun")?.value) || 3;
  const totalDp = hargaRumah * (dpPct / 100);
  const pmt =
    totalDp / ((Math.pow(1 + 0.07 / 12, targetTahun * 12) - 1) / (0.07 / 12));
  $("calcRumahResult").innerHTML =
    `<div style="background:#F8FAFC;padding:12px;border-radius:10px;border:1px solid #E2E8F0"><div>DP Rp ${fmt(totalDp)} - Tabung <b>Rp ${fmt(Math.round(pmt))}/bln</b></div><a href="${AFF.JAGO}" target="_blank" style="display:block;text-align:center;background:#0F172A;color:#fff;padding:8px;border-radius:8px;font-size:12px;text-decoration:none;font-weight:700;margin-top:8px">🏠 Jago DP Rumah →</a></div>`;
}
window.renderKalkulator = renderKalkulator;
window.calcDarurat = calcDarurat;
window.calcPensiun = calcPensiun;
window.calcFire = calcFire;
window.calcSekolah = calcSekolah;
window.calcRumah = calcRumah;
