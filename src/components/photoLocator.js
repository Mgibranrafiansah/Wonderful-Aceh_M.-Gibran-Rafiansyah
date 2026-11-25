import { escapeHtml } from '../utils/format.js';
import { api } from '../utils/api.js';
import { PHOTO_ASSETS } from './illustrations.js';

const SAMPLE_PHOTOS = [
  {
    id: 'sample-masjid',
    labelId: 'Sampel 1 · Religi',
    labelEn: 'Sample 1 · Landmark',
    src: PHOTO_ASSETS.byItemId.d1,
  },
  {
    id: 'sample-pulau-weh',
    labelId: 'Sampel 2 · Bahari',
    labelEn: 'Sample 2 · Coastal',
    src: PHOTO_ASSETS.byItemId.d6,
  },
  {
    id: 'sample-burni',
    labelId: 'Sampel 3 · Gunung',
    labelEn: 'Sample 3 · Highland',
    src: PHOTO_ASSETS.byItemId.d11,
  },
  {
    id: 'sample-museum',
    labelId: 'Sampel 4 · Sejarah',
    labelEn: 'Sample 4 · Heritage',
    src: PHOTO_ASSETS.byItemId.d2,
  },
];

function compressImageToJpeg(dataUrl, maxSide = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSide || height > maxSide) {
        if (width >= height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const outDataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = outDataUrl.split(',')[1] || '';
      resolve({
        previewUrl: outDataUrl,
        mimeType: 'image/jpeg',
        imageBase64: base64,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function createPhotoLocatorController({
  getLang,
  getDestinations,
  getFoods,
  onOpenDestinationDetail,
  onJumpCulinary,
  onFilterRegionOnMap,
  onUnauthorized,
}) {
  const state = {
    previewUrl: '',
    mimeType: 'image/jpeg',
    imageBase64: '',
    fileName: '',
    isAnalyzing: false,
    error: '',
    result: null,
    history: [],
  };

  async function processFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      state.error =
        getLang() === 'en'
          ? 'Please choose a JPG, PNG, or WebP photo.'
          : 'Pilih file foto berformat JPG, PNG, atau WebP.';
      render();
      return;
    }

    state.error = '';
    state.result = null;
    try {
      const rawUrl = await fileToDataUrl(file);
      const compressed = await compressImageToJpeg(rawUrl);
      state.previewUrl = compressed.previewUrl;
      state.mimeType = compressed.mimeType;
      state.imageBase64 = compressed.imageBase64;
      state.fileName = file.name;
      render();
      await analyzeCurrentPhoto();
    } catch {
      state.error =
        getLang() === 'en'
          ? 'Could not process the uploaded image.'
          : 'Gagal memproses foto yang diunggah.';
      render();
    }
  }

  async function processSampleUrl(src, label) {
    state.error = '';
    state.result = null;
    state.isAnalyzing = true;
    state.fileName = label;
    state.previewUrl = src;
    render();

    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const rawUrl = await fileToDataUrl(blob);
      const compressed = await compressImageToJpeg(rawUrl);
      state.previewUrl = compressed.previewUrl;
      state.mimeType = compressed.mimeType;
      state.imageBase64 = compressed.imageBase64;
      await analyzeCurrentPhoto();
    } catch {
      state.isAnalyzing = false;
      state.error =
        getLang() === 'en'
          ? 'Could not load sample image.'
          : 'Gagal memuat foto contoh.';
      render();
    }
  }

  async function analyzeCurrentPhoto() {
    if (!state.imageBase64) return;
    state.isAnalyzing = true;
    state.error = '';
    render();

    try {
      const res = await api.identifyLandmarkPhoto({
        imageBase64: state.imageBase64,
        mimeType: state.mimeType,
        lang: getLang(),
      });
      state.result = res.result;
      if (res.result?.placeName) {
        state.history.unshift({
          previewUrl: state.previewUrl,
          placeName: res.result.placeName,
          regencyOrCity: res.result.regencyOrCity,
          confidence: res.result.confidence,
          result: res.result,
        });
        state.history = state.history.slice(0, 4);
      }
    } catch (err) {
      if (typeof onUnauthorized === 'function' && onUnauthorized(err)) {
        return;
      }
      state.error = err.message || 'Analysis failed';
    } finally {
      state.isAnalyzing = false;
      render();
    }
  }

  function render() {
    const mount = document.getElementById('photoLocatorMount');
    if (!mount) return;

    const isEn = getLang() === 'en';
    const destinations = getDestinations ? getDestinations() || [] : [];
    const foods = getFoods ? getFoods() || [] : [];

    const matchedDest = state.result?.matchedCatalogId
      ? destinations.find((d) => d.id === state.result.matchedCatalogId)
      : null;
    const matchedFood =
      !matchedDest && state.result?.matchedCatalogId
        ? foods.find((f) => f.id === state.result.matchedCatalogId)
        : null;

    const r = state.result;
    const mapsUrl = r
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          r.mapsSearchQuery || `${r.placeName} ${r.regencyOrCity} Aceh`,
        )}`
      : '#';

    const verdictText = r
      ? r.locationVerdict ||
        (isEn
          ? `This spot is ${r.placeName}, located in ${
              r.districtOrArea ? `${r.districtOrArea}, ` : ''
            }${r.regencyOrCity || 'Aceh'}.`
          : `Wisata ini adalah ${r.placeName} yang berada di ${
              r.districtOrArea ? `${r.districtOrArea}, ` : ''
            }${r.regencyOrCity || 'Provinsi Aceh'}.`)
      : '';

    mount.innerHTML = `
      <div class="locator-grid">
        <div class="locator-upload-panel panel">
          <div class="locator-panel-head">
            <div>
              <span class="locator-step-kicker">${isEn ? '01. Photo Input' : '01. Unggah Foto Wisata'}</span>
              <h3 class="locator-panel-title">${isEn ? 'Select or Drop Image' : 'Pilih atau Seret Foto'}</h3>
            </div>
            <span class="locator-format-note">JPG · PNG · WebP</span>
          </div>

          <div class="locator-dropzone ${state.previewUrl ? 'has-preview' : ''}" id="locatorDropzone" tabindex="0" role="button" aria-label="${isEn ? 'Upload travel photo' : 'Unggah foto wisata'}">
            <span class="locator-corner tl" aria-hidden="true"></span>
            <span class="locator-corner tr" aria-hidden="true"></span>
            <span class="locator-corner bl" aria-hidden="true"></span>
            <span class="locator-corner br" aria-hidden="true"></span>
            <input
              type="file"
              id="locatorFileInput"
              accept="image/jpeg,image/png,image/webp"
              hidden
            />
            ${
              state.previewUrl
                ? `
                <img src="${escapeHtml(state.previewUrl)}" alt="${escapeHtml(state.fileName || 'Preview')}" class="locator-preview-img" />
                <div class="locator-preview-caption">
                  <span>${escapeHtml(state.fileName || (isEn ? 'Uploaded photo' : 'Foto diunggah'))}</span>
                </div>
                ${
                  state.isAnalyzing
                    ? `<div class="locator-scanning-overlay">
                        <div class="locator-scan-line"></div>
                        <span>${isEn ? 'Pinpointing Aceh location...' : 'Memindai nama & lokasi wisata Aceh...'}</span>
                      </div>`
                    : ''
                }
              `
                : `
                <div class="locator-empty-drop">
                  <div class="locator-upload-icon" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <strong>${isEn ? 'Drop a photo here or click to upload' : 'Seret foto wisata ke sini atau klik untuk pilih file'}</strong>
                  <span>${isEn ? 'Mosques, beaches, islands, mountains, heritage sites, or Acehnese food' : 'Cocok untuk foto masjid, pantai, pulau, gunung, situs sejarah, atau kuliner'}</span>
                </div>
              `
            }
          </div>

          <div class="locator-upload-actions">
            <button type="button" class="btn btn-primary btn-sm" id="locatorBrowseBtn" ${state.isAnalyzing ? 'disabled' : ''}>
              ${isEn ? 'Choose Photo from Device' : 'Pilih Foto dari Perangkat'}
            </button>
            ${
              state.imageBase64 && !state.isAnalyzing
                ? `<button type="button" class="btn btn-secondary btn-sm" id="locatorReanalyzeBtn">
                    ${isEn ? 'Analyze Again' : 'Analisis Ulang'}
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm" id="locatorClearBtn">
                    ${isEn ? 'Clear' : 'Hapus Foto'}
                  </button>`
                : ''
            }
          </div>

          <div class="locator-samples">
            <span class="locator-samples-label">${isEn ? 'Instant test with Aceh landmarks:' : 'Uji langsung dengan foto wisata Aceh:'}</span>
            <div class="locator-sample-strip">
              ${SAMPLE_PHOTOS.map(
                (sample) => `
                  <button
                    type="button"
                    class="locator-sample-btn"
                    data-sample-id="${sample.id}"
                    ${state.isAnalyzing ? 'disabled' : ''}
                  >
                    <img src="${escapeHtml(sample.src)}" alt="${escapeHtml(isEn ? sample.labelEn : sample.labelId)}" referrerPolicy="no-referrer" />
                    <span>${escapeHtml(isEn ? sample.labelEn : sample.labelId)}</span>
                  </button>
                `,
              ).join('')}
            </div>
          </div>
        </div>

        <div class="locator-result-panel panel">
          ${
            state.error
              ? `
                <div class="locator-error-card" role="alert">
                  <div class="section-eyebrow">${isEn ? 'ANALYSIS NOTICE' : 'KENDALA ANALISIS FOTO'}</div>
                  <h3>${isEn ? 'Location scan could not complete' : 'Pemindaian lokasi belum dapat dijalankan'}</h3>
                  <p>${escapeHtml(state.error)}</p>
                  <div class="locator-result-actions">
                    ${
                      state.imageBase64
                        ? `<button type="button" class="btn btn-primary btn-sm" id="locatorRetryErrBtn">${isEn ? 'Try Again' : 'Coba Pindai Ulang'}</button>`
                        : ''
                    }
                  </div>
                </div>
              `
              : state.isAnalyzing
                ? `
                  <div class="locator-status-box">
                    <div class="section-eyebrow">${isEn ? 'VISUAL RECOGNITION ACTIVE' : 'DETEKSI LOKASI BERJALAN'}</div>
                    <h3>${isEn ? 'Analyzing architectural, coastal & geographic clues...' : 'Memeriksa ciri arsitektur, bentang alam & letak wilayah Aceh...'}</h3>
                    <p>${isEn ? 'Matching visual evidence across 23 regencies and cities in Aceh Province.' : 'Mencocokkan ciri visual pada foto dengan destinasi sejarah, religi, bahari, dan dataran tinggi di 23 kabupaten/kota Aceh.'}</p>
                    <div class="locator-progress-bar" aria-hidden="true"><span></span></div>
                  </div>
                `
                : r
                  ? `
                    <div class="locator-result-content">
                      <div class="locator-verdict-banner ${r.isAcehRelated ? 'is-aceh' : 'is-non-aceh'}">
                        <div class="locator-verdict-top">
                          <span class="locator-verdict-kicker">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${escapeHtml(
                              r.isAcehRelated
                                ? isEn
                                  ? 'ACEH TOURIST SPOT IDENTIFIED'
                                  : 'LOKASI WISATA ACEH DITEMUKAN'
                                : isEn
                                  ? 'LOCATION OUTSIDE ACEH / UNCLEAR'
                                  : 'DI LUAR ACEH / KURANG JELAS',
                            )}
                          </span>
                          <span class="locator-confidence tabular-nums">
                            ${r.confidence}% ${isEn ? 'match' : 'akurasi'}
                          </span>
                        </div>
                        <h3 class="locator-place-title">${escapeHtml(r.placeName)}</h3>
                        <p class="locator-verdict-sentence">${escapeHtml(verdictText)}</p>
                      </div>

                      <div class="locator-location-bar">
                        <div class="locator-loc-cell">
                          <span class="locator-meta-label">${isEn ? 'Regency / City' : 'Kabupaten / Kota'}</span>
                          <strong>${escapeHtml(r.regencyOrCity || '-')}</strong>
                          ${r.districtOrArea ? `<small>${escapeHtml(r.districtOrArea)}</small>` : ''}
                        </div>
                        <div class="locator-loc-cell">
                          <span class="locator-meta-label">${isEn ? 'Category' : 'Kategori Wisata'}</span>
                          <strong>${escapeHtml(r.category || '-')}</strong>
                        </div>
                        <div class="locator-loc-cell">
                          <span class="locator-meta-label">${isEn ? 'From Banda Aceh' : 'Jarak dari Banda Aceh'}</span>
                          <strong class="tabular-nums">${escapeHtml(r.distanceFromCapital || (isEn ? 'Check route' : 'Lihat rute Maps'))}</strong>
                        </div>
                        <div class="locator-loc-cell">
                          <span class="locator-meta-label">${isEn ? 'Coordinates' : 'Perkiraan Koordinat'}</span>
                          <strong class="locator-mono tabular-nums">${escapeHtml(r.coordinatesLabel || 'Aceh, Indonesia')}</strong>
                        </div>
                        <div class="locator-loc-cell full-span">
                          <span class="locator-meta-label">${isEn ? 'Exact Area / Address' : 'Alamat & Letak Spesifik'}</span>
                          <strong>${escapeHtml(r.specificLocation || '-')}</strong>
                        </div>
                      </div>

                      ${
                        matchedDest || matchedFood
                          ? `
                            <div class="locator-catalog-match">
                              <div>
                                <span class="locator-meta-label">${isEn ? 'Matched in Wonderful Aceh Catalog' : 'Tersedia di Katalog Wonderful Aceh'}</span>
                                <strong>${escapeHtml((matchedDest || matchedFood).name)} · ${escapeHtml((matchedDest || matchedFood).region)}</strong>
                              </div>
                              ${
                                matchedDest
                                  ? `<button type="button" class="btn btn-secondary btn-sm" data-locator-detail="${escapeHtml(matchedDest.id)}">${isEn ? 'Open Detail' : 'Buka Detail'}</button>`
                                  : `<button type="button" class="btn btn-secondary btn-sm" id="locatorCulinaryJumpBtn">${isEn ? 'View Culinary' : 'Lihat Kuliner'}</button>`
                              }
                            </div>
                          `
                          : ''
                      }

                      <p class="locator-desc">${escapeHtml(r.description)}</p>

                      ${
                        r.visualClues?.length
                          ? `
                            <div class="locator-clues">
                              <span class="locator-meta-label">${isEn ? 'Visual clues spotted by AI' : 'Bukti visual yang terbaca dari foto'}:</span>
                              <ol>
                                ${r.visualClues.map((clue) => `<li>${escapeHtml(clue)}</li>`).join('')}
                              </ol>
                            </div>
                          `
                          : ''
                      }

                      ${
                        r.visitorTips
                          ? `<div class="advisory-note" style="margin-top: 12px;">
                              <strong>${isEn ? 'Visitor Tips:' : 'Tips Kunjungan:'}</strong> ${escapeHtml(r.visitorTips)}
                            </div>`
                          : ''
                      }

                      <div class="locator-result-actions">
                        <a
                          href="${escapeHtml(mapsUrl)}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="btn btn-primary btn-sm"
                        >
                          ${isEn ? 'Open Location in Google Maps' : 'Buka Lokasi di Google Maps'}
                        </a>
                        ${
                          r.regencyOrCity
                            ? `<button type="button" class="btn btn-secondary btn-sm" id="locatorMapJumpBtn">
                                ${isEn ? 'Show on Aceh Map' : 'Tandai di Peta Aceh'}
                              </button>`
                            : ''
                        }
                      </div>
                    </div>
                  `
                  : `
                    <div class="locator-placeholder-guide">
                      <span class="locator-step-kicker">${isEn ? '02. Location Dossier' : '02. Hasil Identifikasi Wisata'}</span>
                      <h3>${isEn ? 'Upload any travel photo to reveal where in Aceh it is' : 'Unggah foto untuk mengetahui nama tempat wisata & lokasinya di Aceh'}</h3>
                      <p>
                        ${
                          isEn
                            ? 'Our visual lens inspects domes, coastlines, volcanic ridges, monuments, and dishes to report the exact tourist site, district, regency/city, coordinates, and direct Google Maps link.'
                            : 'Unggah foto pantai, masjid, gunung, monumen sejarah, atau kuliner. Sistem akan menampilkan jawaban lokasi wisatanya di Aceh lengkap dengan kabupaten/kota, kecamatan, koordinat, dan rute Google Maps.'
                        }
                      </p>
                      <div class="locator-feature-points">
                        <div>
                          <strong>1. ${isEn ? 'Exact Place & Regency' : 'Jawaban Lokasi Spesifik'}</strong>
                          <span>${isEn ? 'States the landmark name, district, and regency/city clearly.' : 'Menyebutkan langsung wisata apa dan berada di kabupaten/kota mana.'}</span>
                        </div>
                        <div>
                          <strong>2. ${isEn ? 'Visual Proof & Coordinates' : 'Ciri Visual & Koordinat'}</strong>
                          <span>${isEn ? 'Explains visible landmarks in your photo plus map coordinates.' : 'Menjelaskan ciri bangunan atau alam yang dikenali AI beserta rute Maps.'}</span>
                        </div>
                      </div>
                      <div class="locator-coverage-note">
                        <span>${isEn ? 'Coverage:' : 'Cakupan:'} Banda Aceh · Sabang · Aceh Besar · Gayo & Aceh Tengah · Bener Meriah · Pesisir Selatan & Timur</span>
                      </div>
                    </div>
                  `
          }

          ${
            state.history.length > 1
              ? `
                <div class="locator-history">
                  <span class="locator-meta-label">${isEn ? 'Recent scans this session:' : 'Riwayat pindai sesi ini:'}</span>
                  <div class="locator-history-strip">
                    ${state.history
                      .map(
                        (item, idx) => `
                          <button type="button" class="locator-history-btn" data-history-idx="${idx}">
                            <img src="${escapeHtml(item.previewUrl)}" alt="${escapeHtml(item.placeName)}" />
                            <span>${escapeHtml(item.placeName)}</span>
                          </button>
                        `,
                      )
                      .join('')}
                  </div>
                </div>
              `
              : ''
          }
        </div>
      </div>
    `;

    const fileInput = mount.querySelector('#locatorFileInput');
    const dropzone = mount.querySelector('#locatorDropzone');

    mount.querySelector('#locatorBrowseBtn')?.addEventListener('click', () => {
      fileInput?.click();
    });

    dropzone?.addEventListener('click', () => {
      if (!state.isAnalyzing) fileInput?.click();
    });

    dropzone?.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !state.isAnalyzing) {
        e.preventDefault();
        fileInput?.click();
      }
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-dragover');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    });

    mount.querySelector('#locatorReanalyzeBtn')?.addEventListener('click', analyzeCurrentPhoto);
    mount.querySelector('#locatorRetryErrBtn')?.addEventListener('click', analyzeCurrentPhoto);

    mount.querySelector('#locatorClearBtn')?.addEventListener('click', () => {
      state.previewUrl = '';
      state.imageBase64 = '';
      state.fileName = '';
      state.result = null;
      state.error = '';
      render();
    });

    mount.querySelectorAll('[data-sample-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sample = SAMPLE_PHOTOS.find((s) => s.id === btn.getAttribute('data-sample-id'));
        if (sample) processSampleUrl(sample.src, isEn ? sample.labelEn : sample.labelId);
      });
    });

    mount.querySelector('[data-locator-detail]')?.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-locator-detail');
      if (id && typeof onOpenDestinationDetail === 'function') {
        onOpenDestinationDetail(id);
      }
    });

    mount.querySelector('#locatorCulinaryJumpBtn')?.addEventListener('click', () => {
      if (typeof onJumpCulinary === 'function') onJumpCulinary();
    });

    mount.querySelector('#locatorMapJumpBtn')?.addEventListener('click', () => {
      if (typeof onFilterRegionOnMap === 'function') {
        onFilterRegionOnMap(state.result?.regencyOrCity || '');
      }
    });

    mount.querySelectorAll('[data-history-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = state.history[Number(btn.getAttribute('data-history-idx'))];
        if (!item) return;
        state.previewUrl = item.previewUrl;
        state.result = item.result;
        state.error = '';
        render();
      });
    });
  }

  return {
    render,
    reset() {
      state.previewUrl = '';
      state.imageBase64 = '';
      state.fileName = '';
      state.result = null;
      state.error = '';
      state.isAnalyzing = false;
    },
  };
}
