// @ts-nocheck
// js/modules/investasi.js - FINAL v7.1 - Clean No TS Error
import {
  $,
  fmt,
  esc,
  genId,
  invest,
  save,
  showToast,
  openMkpModal,
} from "../app.js";

const LIVE_API = "https://sukan.mpuji0210.workers.dev";

export function addInvest() {
  const jenis = $("jenisInvest").value;
  const namaRaw = $("namaInvest").value.trim() || jenis;
  const nilaiInput = parseFloat($("nilaiInvest").value) || 0;
  let toastDetail = "";
  const getAvg = () => {
    const raw = $("avgInvest")?.value || "0";
    if (["Crypto", "Reksadana"].includes(jenis)) return parseFloat(raw) || 0;
    return parseInt(raw) || 0;
  };

  if (jenis === "Saham") {
    const lot = parseInt($("lotInvest")?.value) || 0;
    const avg = getAvg();
    if (lot <= 0) return showToast("Isi Jumlah Lot dengan benar");
    if (avg <= 0) return showToast("Isi Harga Beli per Lembar dengan benar");
    const kode = namaRaw.toUpperCase().replace(".JK", "");
    const lembar = lot * 100;
    const modal = lembar * avg;
    toastDetail = `${lot} lot`;
    const existing = invest.find((i) => i.jenis === "Saham" && i.nama === kode);
    if (existing) {
      const totalLembarBaru = (existing.lembar || existing.lot * 100) + lembar;
      const totalModalBaru = existing.nilai + modal;
      const lotBulat = Math.floor(totalLembarBaru / 100);
      existing.lot = lotBulat;
      existing.lembar = lotBulat * 100;
      existing.avgPrice = totalModalBaru / existing.lembar;
      existing.nilai = totalModalBaru;
      existing.marketValue =
        existing.lembar * (existing.livePrice || existing.avgPrice);
      existing.floating = existing.marketValue - existing.nilai;
      save();
      showToast(`${kode} averaging jadi ${existing.lot} lot`);
      fetchLivePrices();
      return;
    }
    invest.push({
      id: genId(),
      jenis: "Saham",
      nama: kode,
      kode: kode,
      lot,
      lembar,
      avgPrice: avg,
      nilai: modal,
      livePrice: avg,
      marketValue: modal,
      floating: 0,
    });
  } else if (jenis === "Emas") {
    const gram = parseFloat($("lotInvest")?.value) || 0;
    const hargaPerGram = parseInt($("avgInvest")?.value) || 0;
    if (gram <= 0) return showToast("Isi Jumlah Gram dengan benar");
    if (hargaPerGram <= 0) return showToast("Isi Harga per Gram dengan benar");
    const namaEmas = namaRaw.toUpperCase() || "EMAS";
    const existingEmas = invest.find(
      (i) => i.jenis === "Emas" && i.nama === namaEmas,
    );
    if (existingEmas) {
      const totalGram = (existingEmas.gram || existingEmas.lot) + gram;
      const totalModal = existingEmas.nilai + gram * hargaPerGram;
      existingEmas.gram = totalGram;
      existingEmas.lot = totalGram;
      existingEmas.lembar = totalGram;
      existingEmas.avgPrice = totalModal / totalGram;
      existingEmas.nilai = totalModal;
      existingEmas.marketValue =
        totalGram * (existingEmas.livePrice || existingEmas.avgPrice);
      existingEmas.floating = existingEmas.marketValue - existingEmas.nilai;
      save();
      showToast(`${namaEmas} averaging jadi ${totalGram} gram`);
      fetchLivePrices();
      return;
    }
    const modal = Math.round(gram * hargaPerGram);
    invest.push({
      id: genId(),
      jenis: "Emas",
      nama: namaEmas,
      lot: gram,
      lembar: gram,
      gram: gram,
      avgPrice: hargaPerGram,
      nilai: modal,
      livePrice: hargaPerGram,
      marketValue: modal,
      floating: 0,
    });
    toastDetail = `${gram} gram`;
  } else if (jenis === "Crypto") {
    const coin = parseFloat($("lotInvest")?.value) || 0;
    const hargaPerCoin = getAvg();
    if (coin <= 0) return showToast("Isi Jumlah Coin dengan benar");
    if (hargaPerCoin <= 0) return showToast("Isi Harga per Coin dengan benar");
    const namaCrypto = namaRaw.toUpperCase();
    const existingCrypto = invest.find(
      (i) => i.jenis === "Crypto" && i.nama === namaCrypto,
    );
    if (existingCrypto) {
      const totalCoin = existingCrypto.lot + coin;
      const totalModal = existingCrypto.nilai + coin * hargaPerCoin;
      existingCrypto.lot = totalCoin;
      existingCrypto.lembar = totalCoin;
      existingCrypto.avgPrice = totalModal / totalCoin;
      existingCrypto.nilai = totalModal;
      existingCrypto.marketValue =
        totalCoin * (existingCrypto.livePrice || existingCrypto.avgPrice);
      existingCrypto.floating =
        existingCrypto.marketValue - existingCrypto.nilai;
      save();
      showToast(`${namaCrypto} averaging jadi ${totalCoin} coin`);
      fetchLivePrices();
      return;
    }
    invest.push({
      id: genId(),
      jenis: "Crypto",
      nama: namaCrypto,
      lot: coin,
      lembar: coin,
      avgPrice: hargaPerCoin,
      nilai: coin * hargaPerCoin,
      livePrice: hargaPerCoin,
      marketValue: coin * hargaPerCoin,
      floating: 0,
    });
    toastDetail = `${coin} coin`;
  } else if (jenis === "Reksadana") {
    const unit = parseFloat($("lotInvest")?.value) || 0;
    const nav = getAvg();
    if (unit <= 0) return showToast("Isi Jumlah Unit dengan benar");
    if (nav <= 0) return showToast("Isi NAV Beli dengan benar");
    const namaRD = namaRaw.toUpperCase();
    const existingRD = invest.find(
      (i) => i.jenis === "Reksadana" && i.nama === namaRD,
    );
    if (existingRD) {
      const totalUnit = existingRD.lot + unit;
      const totalModal = existingRD.nilai + unit * nav;
      existingRD.lot = totalUnit;
      existingRD.lembar = totalUnit;
      existingRD.avgPrice = totalModal / totalUnit;
      existingRD.nilai = totalModal;
      existingRD.marketValue =
        totalUnit * (existingRD.livePrice || existingRD.avgPrice);
      existingRD.floating = existingRD.marketValue - existingRD.nilai;
      save();
      showToast(`${namaRD} averaging jadi ${totalUnit} unit`);
      fetchLivePrices();
      return;
    }
    invest.push({
      id: genId(),
      jenis: "Reksadana",
      nama: namaRD,
      lot: unit,
      lembar: unit,
      avgPrice: nav,
      nilai: unit * nav,
      livePrice: nav,
      marketValue: unit * nav,
      floating: 0,
    });
    toastDetail = `${unit} unit`;
  } else {
    if (nilaiInput <= 0) return showToast("Isi nilai investasi dengan benar");
    invest.push({
      id: genId(),
      jenis: jenis,
      nama: namaRaw.toUpperCase(),
      lot: 1,
      lembar: 1,
      avgPrice: nilaiInput,
      nilai: nilaiInput,
      livePrice: nilaiInput,
      marketValue: nilaiInput,
      floating: 0,
    });
    toastDetail = `Rp ${fmt(Math.round(nilaiInput))}`;
  }
  save();
  $("namaInvest").value = "";
  $("nilaiInvest").value = "";
  if ($("lotInvest")) $("lotInvest").value = "";
  if ($("avgInvest")) $("avgInvest").value = "";
  showToast(`${namaRaw.toUpperCase()} (${toastDetail}) ditambahkan`);
  fetchLivePrices();
}

export async function fetchLivePrices() {
  const saham = invest.filter((i) => i.jenis === "Saham");
  if (saham.length > 0) {
    await Promise.all(
      saham.map(async (s) => {
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${LIVE_API}/?kode=${s.nama}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          clearTimeout(t);
          if (!res.ok) throw new Error("Network error");
          const d = await res.json();
          const price =
            d.price || d.close || d.last || s.livePrice || s.avgPrice;
          if (price > 0) {
            s.livePrice = price;
            s.marketValue = price * s.lembar;
            s.floating = (price - s.avgPrice) * s.lembar;
          }
        } catch (e) {
          console.warn(`Gagal live ${s.nama}:`, e);
        }
      }),
    );
    save();
  }
  renderInvestasiList();
}

export function renderInvestasiList() {
  const li = $("listInvest");
  if (!li) return;
  li.innerHTML =
    invest
      .map((iv) => {
        const safeId = esc(String(iv.id));
        let labelQty = "";
        if (iv.jenis === "Saham")
          labelQty = `${iv.lot} lot / ${iv.lembar.toLocaleString("id-ID")} lbr`;
        else if (iv.jenis === "Emas") labelQty = `${iv.gram || iv.lot} gram`;
        else if (iv.jenis === "Crypto") labelQty = `${iv.lot} coin`;
        else if (iv.jenis === "Reksadana")
          labelQty = `${iv.lot.toLocaleString("id-ID")} unit`;
        const isQty = ["Saham", "Emas", "Crypto", "Reksadana"].includes(
          iv.jenis,
        );
        const avgDisplay = ["Crypto", "Reksadana"].includes(iv.jenis)
          ? iv.avgPrice.toLocaleString("id-ID")
          : fmt(Math.round(iv.avgPrice));
        const detailsHTML = isQty
          ? `Modal Rp ${fmt(Math.round(iv.nilai))} | Avg ${avgDisplay}<br>Live Rp ${fmt(Math.round(iv.livePrice || 0))} | Pasar Rp ${fmt(Math.round(iv.marketValue || iv.nilai))}<br><span style="color:${(iv.floating || 0) >= 0 ? "#0E9F6E" : "#E02424"}">Floating ${iv.floating >= 0 ? "+" : ""}Rp ${fmt(Math.round(iv.floating || 0))}</span>`
          : `Rp ${fmt(Math.round(iv.nilai))}`;
        return `<div class="item"><div class="item-left"><div><b>${esc(iv.jenis)}</b> - ${esc(iv.nama)} ${labelQty ? `(${labelQty})` : ""}<br><small class="num">${detailsHTML}</small></div></div><div style="display:flex;gap:6px"><button onclick="editInvest('${safeId}')" class="iconBtn">✎</button><button onclick="delInvest('${safeId}')" class="iconBtn" style="color:#E02424">✕</button></div></div>`;
      })
      .join("") || '<div class="emptyState">Belum ada investasi</div>';
  const ti = $("totalInvest");
  if (ti) {
    const totalModal = invest.reduce((s, x) => s + (x.nilai || 0), 0);
    const totalPasar = invest.reduce(
      (s, x) => s + (x.marketValue || x.nilai || 0),
      0,
    );
    const totalFloat = totalPasar - totalModal;
    ti.innerHTML = `Modal Rp ${fmt(Math.round(totalModal))} | Pasar Rp ${fmt(Math.round(totalPasar))} | Floating <span style="color:${totalFloat >= 0 ? "#0E9F6E" : "#E02424"}">${totalFloat >= 0 ? "+" : ""}Rp ${fmt(Math.round(totalFloat))}</span>`;
  }
}

export function editInvest(id) {
  const it = invest.find((x) => String(x.id) === String(id));
  if (!it) return;
  const isSaham = it.jenis === "Saham";
  const isEmas = it.jenis === "Emas";
  const formHTML = isSaham
    ? `<input id="editNamaInv" class="input" value="${esc(it.nama)}"><input id="editLot" class="input" type="number" placeholder="Jumlah Lot" value="${it.lot}"><input id="editAvg" class="input" type="number" placeholder="Harga Avg per Lembar" value="${it.avgPrice}">`
    : isEmas
      ? `<input id="editNamaInv" class="input" value="${esc(it.nama)}"><input id="editGram" class="input" type="number" step="any" placeholder="Jumlah Gram" value="${it.gram || it.lot}"><input id="editAvg" class="input" type="number" placeholder="Harga per Gram" value="${it.avgPrice}">`
      : `<input id="editNamaInv" class="input" value="${esc(it.nama)}"><input id="editLot" class="input" type="number" step="any" placeholder="Jumlah ${it.jenis === "Crypto" ? "Coin" : it.jenis === "Reksadana" ? "Unit" : "Qty"}" value="${it.lot}"><input id="editAvg" class="input" type="number" step="any" placeholder="Harga per ${it.jenis === "Crypto" ? "Coin" : it.jenis === "Reksadana" ? "Unit" : "Item"}" value="${it.avgPrice}">`;
  openMkpModal({
    title: `Edit ${it.nama}`,
    formHTML: formHTML,
    confirmText: "Simpan",
    action: () => {
      const newNama = $("editNamaInv").value.trim().toUpperCase();
      if (!newNama) return showToast("Nama tidak boleh kosong");
      if (isSaham) {
        const newLot = parseInt($("editLot").value) || 0;
        const newAvg = parseInt($("editAvg").value) || 0;
        if (newLot <= 0 || newAvg <= 0)
          return showToast("Lot & Harga harus > 0");
        it.nama = newNama;
        it.lot = newLot;
        it.lembar = newLot * 100;
        it.avgPrice = newAvg;
        it.nilai = it.lembar * newAvg;
        it.marketValue = it.lembar * (it.livePrice || newAvg);
        it.floating = it.marketValue - it.nilai;
      } else if (isEmas) {
        const newGram = parseFloat($("editGram").value) || 0;
        const newAvg = parseInt($("editAvg").value) || 0;
        if (newGram <= 0 || newAvg <= 0)
          return showToast("Gram & Harga harus > 0");
        it.nama = newNama;
        it.gram = newGram;
        it.lot = newGram;
        it.lembar = newGram;
        it.avgPrice = newAvg;
        it.nilai = Math.round(newGram * newAvg);
        it.marketValue = Math.round(newGram * (it.livePrice || newAvg));
        it.floating = it.marketValue - it.nilai;
      } else {
        const newQty = parseFloat($("editLot").value) || 0;
        const newAvg = parseFloat($("editAvg").value) || 0;
        if (newQty <= 0 || newAvg <= 0)
          return showToast("Jumlah & Harga harus > 0");
        it.nama = newNama;
        it.lot = newQty;
        it.lembar = newQty;
        it.avgPrice = newAvg;
        it.nilai = newQty * newAvg;
        it.marketValue = newQty * (it.livePrice || newAvg);
        it.floating = it.marketValue - it.nilai;
      }
      save();
      fetchLivePrices();
      showToast("Perubahan disimpan");
    },
  });
}

export function delInvest(id) {
  openMkpModal({
    title: "Hapus investasi ini?",
    action: () => {
      const idx = invest.findIndex((x) => String(x.id) === String(id));
      if (idx > -1) {
        invest.splice(idx, 1);
        save();
        renderInvestasiList();
        showToast("Investasi dihapus");
      }
    },
  });
}

window.addInvest = addInvest;
window.editInvest = editInvest;
window.delInvest = delInvest;
window.fetchLivePrices = fetchLivePrices;
const ready = () => setTimeout(fetchLivePrices, 500);
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", ready);
else ready();

window.onJenisInvestChange = function () {
  const jenis = $("jenisInvest").value;
  const lotLabel = document.querySelector("label[for='lotInvest']");
  const avgLabel = document.querySelector("label[for='avgInvest']");
  const lotInput = $("lotInvest");
  const avgInput = $("avgInvest");
  const nilaiInput = $("nilaiInvest");
  if (!lotInput || !avgInput) return;
  lotInput.style.display = "";
  avgInput.style.display = "";
  if (nilaiInput) nilaiInput.style.display = "";
  lotInput.step = "1";
  avgInput.step = "1";
  if (jenis === "Emas") {
    if (lotLabel) lotLabel.textContent = "Jumlah Gram";
    lotInput.placeholder = "Contoh: 10";
    lotInput.step = "any";
    if (avgLabel) avgLabel.textContent = "Harga per Gram";
    avgInput.placeholder = "Contoh: 1000000";
    if (nilaiInput) nilaiInput.style.display = "none";
  } else if (jenis === "Saham") {
    if (lotLabel) lotLabel.textContent = "Jumlah Lot";
    lotInput.placeholder = "Contoh: 100";
    if (avgLabel) avgLabel.textContent = "Avg per Lembar";
    avgInput.placeholder = "Contoh: 8750";
    if (nilaiInput) nilaiInput.style.display = "none";
  } else if (jenis === "Crypto") {
    if (lotLabel) lotLabel.textContent = "Jumlah Coin";
    lotInput.placeholder = "Contoh: 0.5";
    lotInput.step = "any";
    if (avgLabel) avgLabel.textContent = "Harga per Coin";
    avgInput.placeholder = "Contoh: 450000000.50";
    avgInput.step = "any";
    if (nilaiInput) nilaiInput.style.display = "none";
  } else if (jenis === "Reksadana") {
    if (lotLabel) lotLabel.textContent = "Jumlah Unit";
    lotInput.placeholder = "Contoh: 1000";
    lotInput.step = "any";
    if (avgLabel) avgLabel.textContent = "NAV Beli";
    avgInput.placeholder = "Contoh: 1534.56";
    avgInput.step = "any";
    if (nilaiInput) nilaiInput.style.display = "none";
  } else {
    if (lotLabel) lotLabel.textContent = "Keterangan Qty (Opsional)";
    lotInput.placeholder = "Kosongkan jika tidak perlu";
    lotInput.style.display = "none";
    if (avgLabel) avgLabel.textContent = "Harga / Nilai";
    avgInput.style.display = "none";
    if (nilaiInput) {
      nilaiInput.style.display = "";
      nilaiInput.placeholder = "Total Nilai Rp";
    }
  }
};
