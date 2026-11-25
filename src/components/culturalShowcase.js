import { escapeHtml } from '../utils/format.js';
import { PHOTO_ASSETS } from './illustrations.js';

const TRADITION_ARCHIVE = [
  {
    id: 'saman',
    image: PHOTO_ASSETS.byItemId.d12,
    tagId: 'Tari Tradisional · Gayo Lues',
    tagEn: 'Traditional Dance · Gayo Lues',
    titleId: 'Tari Saman (Tari Seribu Tangan)',
    titleEn: 'Saman Dance (Dance of a Thousand Hands)',
    proverb: '"Saman bukan sekadar gerak, melainkan dakwah dan persatuan dalam irama."',
    descId:
      'Diakui UNESCO sebagai Warisan Budaya Takbenda, Tari Saman ditarikan secara duduk berbaris rapat sambil melantunkan syair pujian dan menepuk dada serta paha secara serempak.',
    descEn:
      'Recognized by UNESCO as Intangible Cultural Heritage, performers kneel in tight formation weaving rapid synchronized hand claps with poetic Acehnese verse.',
    region: 'Dataran Tinggi Gayo',
  },
  {
    id: 'ranup',
    image: PHOTO_ASSETS.byItemId.d1,
    tagId: 'Adat Penyambutan · Pesisir Aceh',
    tagEn: 'Welcome Ritual · Coastal Aceh',
    titleId: 'Tari Ranup Lampuan & Peumulia Jamee',
    titleEn: 'Ranup Lampuan & Peumulia Jamee',
    proverb: '"Peumulia jamee adat geutanyoe — Memuliakan tamu adalah adat kita."',
    descId:
      'Tarian sakral pembuka acara adat dan penyambutan tamu kehormatan dengan menyuguhkan sirih pinang dari wadah puan sebagai lambang persaudaraan yang tulus.',
    descEn:
      'Graceful welcome dance presenting betel leaves in ornate brass puan trays to honor arriving guests as part of cherished Acehnese hospitality.',
    region: 'Banda Aceh & Aceh Besar',
  },
  {
    id: 'kupiah',
    image: PHOTO_ASSETS.byItemId.d10,
    tagId: 'Busana & Pusaka Adat',
    tagEn: 'Ceremonial Attire & Craft',
    titleId: 'Kupiah Meukeutop & Sulam Benang Kasab',
    titleEn: 'Kupiah Meukeutop & Kasab Gold Thread',
    proverb: '"Taat bak agama, setia bak adat."',
    descId:
      'Penutup kepala tradisional khas Aceh yang dipadukan dengan lilitan kain tengkulok bermotif songket emas, merah, hijau, dan kuning sebagai simbol martabat dan kebijaksanaan.',
    descEn:
      'Traditional Acehnese ceremonial cap wrapped in handwoven cloth featuring crimson, emerald, and Kasab gold motifs representing wisdom and honor.',
    region: 'Aceh Raya & Bener Meriah',
  },
  {
    id: 'pinto',
    image: PHOTO_ASSETS.byItemId.d2,
    tagId: 'Arsitektur & Ukiran Klasik',
    tagEn: 'Architecture & Ornament',
    titleId: 'Motif Pinto Aceh & Rumoh Aceh',
    titleEn: 'Pinto Aceh Motif & Rumoh Aceh',
    proverb: '"Rumoh Aceh tiang meuribu, pasak kayee tan na paku."',
    descId:
      'Rumah panggung tradisional Aceh dirangkai memakai pasak kayu tanpa paku besi agar lentur menghadapi gempa, berhiaskan ukiran Pinto Aceh dan flora Awan Si On.',
    descEn:
      'Traditional timber stilt homes use mortise-and-tenon wooden pegs instead of iron nails for seismic resilience, adorned with Pinto Aceh carvings.',
    region: 'Seluruh Wilayah Aceh',
  },
];

const INSTRUMENTS = [
  {
    id: 'rapai',
    nameId: 'Rapai Pasee',
    nameEn: 'Rapai Pasee Drum',
    roleId: 'Rebana besar kulit kambing penggetar tabuh adat',
    roleEn: 'Deep ceremonial frame drum',
    freq: 118,
    endFreq: 52,
    type: 'triangle',
    dur: 0.22,
  },
  {
    id: 'genderang',
    nameId: 'Tepuk Saman',
    nameEn: 'Saman Clap',
    roleId: 'Ketukan cepat pengatur tempo harmoni Saman',
    roleEn: 'Crisp percussive tempo beat',
    freq: 290,
    endFreq: 130,
    type: 'square',
    dur: 0.08,
  },
  {
    id: 'canang',
    nameId: 'Canang Kuningan',
    nameEn: 'Brass Canang',
    roleId: 'Gong kecil nyaring penanda pembuka majelis',
    roleEn: 'Resonant brass ceremonial gong',
    freq: 440,
    endFreq: 432,
    type: 'sine',
    dur: 0.36,
  },
  {
    id: 'serune',
    nameId: 'Serune Kalee',
    nameEn: 'Serune Kalee',
    roleId: 'Alat tiup kayu tradisional bernada syahdu',
    roleEn: 'Traditional Acehnese woodwind',
    freq: 587.33,
    endFreq: 554.37,
    type: 'sine',
    dur: 0.32,
  },
];

let studioCtx = null;

function playInstrumentNote(inst) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!studioCtx) studioCtx = new Ctx();
    if (studioCtx.state === 'suspended') {
      studioCtx.resume().catch(() => {});
    }

    const now = studioCtx.currentTime;
    const osc = studioCtx.createOscillator();
    const gain = studioCtx.createGain();
    osc.type = inst.type;
    osc.frequency.setValueAtTime(inst.freq, now);
    osc.frequency.exponentialRampToValueAtTime(inst.endFreq, now + inst.dur);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + inst.dur);

    osc.connect(gain);
    gain.connect(studioCtx.destination);
    osc.start(now);
    osc.stop(now + inst.dur + 0.03);
  } catch {
    // Ignore audio context block
  }
}

export function createCulturalShowcaseController({ getLang }) {
  const state = {
    activeTraditionId: TRADITION_ARCHIVE[0].id,
    tempoMode: 'ceremonial', // 'ceremonial' | 'rancak'
    isSequencing: false,
    activePadId: null,
    stepTimerId: null,
  };

  function stopSequence() {
    if (state.stepTimerId) {
      window.clearInterval(state.stepTimerId);
      state.stepTimerId = null;
    }
    state.isSequencing = false;
    state.activePadId = null;
  }

  function startSequence() {
    if (state.isSequencing) {
      stopSequence();
      render();
      return;
    }

    state.isSequencing = true;
    const patternIds = ['rapai', 'genderang', 'canang', 'genderang', 'rapai', 'serune', 'genderang', 'canang'];
    let step = 0;
    const intervalMs = state.tempoMode === 'rancak' ? 230 : 380;

    const triggerStep = () => {
      const targetId = patternIds[step % patternIds.length];
      const inst = INSTRUMENTS.find((i) => i.id === targetId);
      if (inst) {
        playInstrumentNote(inst);
        highlightPad(inst.id);
      }
      step += 1;
      if (step >= 16) {
        stopSequence();
        render();
      }
    };

    render();
    triggerStep();
    state.stepTimerId = window.setInterval(triggerStep, intervalMs);
  }

  function highlightPad(id) {
    state.activePadId = id;
    const mount = document.getElementById('culturalShowcaseMount');
    if (!mount) return;
    mount.querySelectorAll('[data-inst-pad]').forEach((btn) => {
      btn.classList.toggle('is-playing', btn.getAttribute('data-inst-pad') === id);
    });
    window.setTimeout(() => {
      mount.querySelectorAll('[data-inst-pad]').forEach((btn) => {
        if (btn.getAttribute('data-inst-pad') === id && !state.isSequencing) {
          btn.classList.remove('is-playing');
        }
      });
    }, 220);
  }

  function render() {
    const mount = document.getElementById('culturalShowcaseMount');
    if (!mount) return;

    const isEn = getLang() === 'en';
    const activeItem =
      TRADITION_ARCHIVE.find((item) => item.id === state.activeTraditionId) ||
      TRADITION_ARCHIVE[0];

    mount.innerHTML = `
      <div class="tradition-grid">
        <div class="tradition-explorer panel-tradition">
          <div class="tradition-selector-row" role="tablist" aria-label="${isEn ? 'Traditional culture gallery' : 'Galeri warisan budaya'}">
            ${TRADITION_ARCHIVE.map((item) => {
              const selected = item.id === state.activeTraditionId;
              return `
                <button
                  type="button"
                  role="tab"
                  class="tradition-pill-btn ${selected ? 'active' : ''}"
                  aria-selected="${selected ? 'true' : 'false'}"
                  data-tradition-id="${item.id}"
                >
                  ${escapeHtml(isEn ? item.titleEn.split('&')[0].trim() : item.titleId.split('&')[0].trim())}
                </button>
              `;
            }).join('')}
          </div>

          <div class="tradition-feature-card">
            <div class="tradition-media">
              <img
                src="${escapeHtml(activeItem.image)}"
                alt="${escapeHtml(isEn ? activeItem.titleEn : activeItem.titleId)}"
                referrerPolicy="no-referrer"
              />
              <span class="tradition-region-tag">${escapeHtml(activeItem.region)}</span>
            </div>
            <div class="tradition-copy">
              <div class="section-eyebrow" style="margin-bottom: 6px;">${escapeHtml(isEn ? activeItem.tagEn : activeItem.tagId)}</div>
              <h3>${escapeHtml(isEn ? activeItem.titleEn : activeItem.titleId)}</h3>
              <p class="tradition-proverb">${escapeHtml(activeItem.proverb)}</p>
              <p class="tradition-desc">${escapeHtml(isEn ? activeItem.descEn : activeItem.descId)}</p>
            </div>
          </div>
        </div>

        <div class="sound-studio panel-tradition">
          <div class="sound-studio-head">
            <div>
              <div class="section-eyebrow" style="margin-bottom: 4px;">
                ${isEn ? 'INTERACTIVE TRADITIONAL SOUND' : 'STUDIO RITME TRADISIONAL'}
              </div>
              <h3>${isEn ? 'Aceh Rapai & Saman Rhythm Pad' : 'Tabuh Rapai & Ritme Saman'}</h3>
            </div>
            <div class="segmented" role="group" aria-label="${isEn ? 'Tempo' : 'Tempo irama'}">
              <button
                type="button"
                class="segmented-btn ${state.tempoMode === 'ceremonial' ? 'active' : ''}"
                data-tempo="ceremonial"
              >${isEn ? 'Ceremonial' : 'Khidmat'}</button>
              <button
                type="button"
                class="segmented-btn ${state.tempoMode === 'rancak' ? 'active' : ''}"
                data-tempo="rancak"
              >${isEn ? 'Saman Fast' : 'Rancak'}</button>
            </div>
          </div>

          <p class="sound-studio-sub">
            ${
              isEn
                ? 'Tap each traditional instrument pad below to play its acoustic tone or run the automated Peumulia Jamee welcome rhythm.'
                : 'Ketuk tiap bantalan alat musik tradisional di bawah ini untuk mendengar bunyinya atau putar irama pembuka Peumulia Jamee.'
            }
          </p>

          <div class="instrument-pad-grid">
            ${INSTRUMENTS.map((inst) => `
              <button
                type="button"
                class="instrument-pad ${state.activePadId === inst.id ? 'is-playing' : ''}"
                data-inst-pad="${inst.id}"
              >
                <strong>${escapeHtml(isEn ? inst.nameEn : inst.nameId)}</strong>
                <span>${escapeHtml(isEn ? inst.roleEn : inst.roleId)}</span>
              </button>
            `).join('')}
          </div>

          <div class="sound-studio-actions">
            <button type="button" class="btn btn-primary" id="toggleSequenceBtn">
              ${
                state.isSequencing
                  ? isEn
                    ? 'Stop Rhythm Sequence'
                    : 'Hentikan Irama'
                  : isEn
                    ? 'Play Welcome Rhythm (16 Beats)'
                    : 'Putar Irama Sambutan (16 Ketuk)'
              }
            </button>
          </div>
        </div>
      </div>
    `;

    mount.querySelectorAll('[data-tradition-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTraditionId = btn.getAttribute('data-tradition-id') || TRADITION_ARCHIVE[0].id;
        render();
      });
    });

    mount.querySelectorAll('[data-tempo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextTempo = btn.getAttribute('data-tempo') || 'ceremonial';
        state.tempoMode = nextTempo;
        if (state.isSequencing) {
          stopSequence();
          startSequence();
        } else {
          render();
        }
      });
    });

    mount.querySelectorAll('[data-inst-pad]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const instId = btn.getAttribute('data-inst-pad');
        const inst = INSTRUMENTS.find((item) => item.id === instId);
        if (!inst) return;
        playInstrumentNote(inst);
        highlightPad(inst.id);
      });
    });

    mount.querySelector('#toggleSequenceBtn')?.addEventListener('click', startSequence);
  }

  return {
    render,
    cleanup: stopSequence,
  };
}
