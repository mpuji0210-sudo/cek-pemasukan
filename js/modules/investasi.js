// js/modules/investasi.js - FINAL dengan Lot & Avg Price
import {
  $,
  fmt,
  esc,
  genId,
  invest,
  save,
  showToast,
  openMkpModal,
  bulkMode,
  selected,
} from "../app.js";

const LIVE_API = "https://sukan.mpuji0210.workers.dev";

export function addInvest() {
  const jenis = $("jenisInvest").value;
  const namaRaw = $("namaInvest").value.trim() || jenis;
  const nilaiInput = parseInt($("nilaiInvest").value) || 0;

  let data;

  if (jenis === "Saham") {
    // INI YANG KAMU TANYA - 2 INPUT BARU
    const lotEl = document.getElementById("lotInvest");
    const avgEl = document.getElementById("avgInvest");

    const lot = lotEl ? parseInt(lotEl.value) || 0 : 0;
    const avg = avgEl ? parseInt(avgEl.value) || 0 : 0;

    if (!lotEl || !avgEl) {
      showToast("Input Lot & Avg belum ada di HTML - tambahkan dulu");
      return;
    }
    if (lot <= 0) {
      showToast("Isi Jumlah Lot");
      return;
    }
    if (avg <= 0) {
      showToast("Isi Harga Beli per Lembar");
      return;
    }

    const kode = namaRaw.toUpperCase().replace(".JK", "");
    const modal = lot * 100 * avg;

    data = {
      id: genId(),
      jenis: "Saham",
      nama: kode,
      kode: kode,
      lot: lot,
      avgPrice: avg,
      nilai: modal, // Modal real yang masuk ke Kekayaan Bersih
      livePrice: 0,
      floating: 0,
      marketValue: modal,
    };
  } else {
    if (nilaiInput <= 0) {
      showToast("Isi nilai");
      return;
    }
    data = { id: genId(), jenis: jenis, nama: namaRaw, nilai: nilaiInput };
  }

  invest.push(data);
  $("namaInvest").value = "";
  $("nilaiInvest").value = "";
  if ($("lotInvest")) $("lotInvest").value = "";
  if ($("avgInvest")) $("avgInvest").value = "";
  save();
  showToast(`${data.nama} ${data.lot ? data.lot + " lot" : ""} ditambah`);
  fetchLivePrices();
}

export async function fetchLivePrices() {
  const saham = invest.filter((i) => i.jenis === "Saham");
  for (let s of saham) {
    try {
      const res = await fetch(`${LIVE_API}/?kode=${s.nama}`);
      const d = await res.json();
      const price = d.price || d.close || d.last || s.avgPrice;
      s.livePrice = price;
      s.marketValue = price * s.lot * 100;
      s.floating = (price - s.avgPrice) * s.lot * 100;
    } catch (e) {}
  }
  renderInvestasiList();
}

export function renderInvestasiList() {
  const li = $("listInvest");
  if (li)
    li.innerHTML =
      invest
        .map((iv) => {
          const isSaham = iv.jenis === "Saham";
          return `<div class="item">
      <div class="item-left">
        <div><b>${esc(iv.jenis)}</b> - ${esc(iv.nama)} ${isSaham ? `(${iv.lot} lot)` : ""}<br>
        <small class="num">${isSaham ? `Modal Rp ${fmt(iv.nilai)} | Avg Rp ${fmt(iv.avgPrice)}<br>Live Rp ${fmt(iv.livePrice || 0)} | Pasar Rp ${fmt(iv.marketValue || iv.nilai)}<br><span style="color:${(iv.floating || 0) >= 0 ? "#0E9F6E" : "#E02424"}">Floating ${iv.floating >= 0 ? "+" : ""}Rp ${fmt(iv.floating || 0)}</span> <small>(Belum Real)</small>` : `Rp ${fmt(iv.nilai)}`}</small></div>
      </div>
      <div style="display:flex;gap:6px"><button onclick="editInvest(${iv.id})" class="iconBtn">✎</button><button onclick="delInvest(${iv.id})" class="iconBtn" style="color:#E02424">✕</button></div>
    </div>`;
        })
        .join("") || '<div class="emptyState">Belum ada investasi</div>';

  const ti = $("totalInvest");
  if (ti) {
    const totalModal = invest.reduce((s, x) => s + (x.nilai || 0), 0);
    const totalFloat = invest.reduce((s, x) => s + (x.floating || 0), 0);
    ti.innerHTML = `Modal Rp ${fmt(totalModal)} | Floating <span style="color:${totalFloat >= 0 ? "#0E9F6E" : "#E02424"}">${totalFloat >= 0 ? "+" : ""}Rp ${fmt(totalFloat)}</span> (Belum Real)`;
  }
}

export function editInvest(id) {
  /* sama seperti sebelumnya */
  const it = invest.find((x) => x.id === id);
  if (!it) return;
  openMkpModal({
    title: "Edit",
    formHTML: `<input id="editNamaInv" class="input" value="${esc(it.nama)}"><input id="editLot" class="input" type="number" value="${it.lot || 1}"><input id="editAvg" class="input" type="number" value="${it.avgPrice || 0}">`,
    confirmText: "Simpan",
    action: () => {
      it.nama = $("editNamaInv").value.trim().toUpperCase();
      it.lot = parseInt($("editLot").value) || 1;
      it.avgPrice = parseInt($("editAvg").value) || 0;
      it.nilai = it.lot * 100 * it.avgPrice;
      save();
      fetchLivePrices();
    },
  });
}
export function delInvest(id) {
  openMkpModal({
    title: "Hapus?",
    action: () => {
      invest.splice(
        invest.findIndex((x) => x.id === id),
        1,
      );
      save();
    },
  });
}

window.addInvest = addInvest;
window.editInvest = editInvest;
window.delInvest = delInvest;
window.fetchLivePrices = fetchLivePrices;
setTimeout(fetchLivePrices, 800);
