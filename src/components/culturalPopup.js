import { escapeHtml } from '../utils/format.js';
import { PHOTO_ASSETS } from './illustrations.js';

const POPUP_SESSION_KEY = 'wa_cultural_popup_seen_v1';

const CULTURAL_PILLARS = [
  {
    id: 'peumulia',
    image: PHOTO_ASSETS.byItemId.d1,
    badgeId: 'Adat Penyambutan',
    badgeEn: 'Hospitality Tradition',
    titleId: 'Peumulia Jamee & Ranup Lampuan',
    titleEn: 'Peumulia Jamee & Ranup Lampuan',
    proverb: '"Peumulia jamee adat geutanyoe"',
    bodyId:
      'Dalam falsafah Aceh, memuliakan tamu adalah kehormatan tertinggi. Tamu disambut dengan sirih dalam wadah kuningan (Ranup Lampuan) serta senyum hangat sebelum memulai perbincangan.',
    bodyEn:
      'In Acehnese philosophy, honoring guests is a sacred duty. Visitors are traditionally welcomed with betel leaves presented in ornate brass Ranup Lampuan vessels.',
    tipId: 'Etika berkunjung: Ucapkan salam, berpakaian sopan, dan lepaskan alas kaki saat memasuki area suci masjid.',
    tipEn: 'Visitor etiquette: Offer warm greetings, dress modestly, and remove footwear when entering mosque grounds.',
  },
  {
    id: 'saman',
    image: PHOTO_ASSETS.byItemId.d12,
    badgeId: 'Warisan UNESCO',
    badgeEn: 'UNESCO Heritage',
    titleId: 'Tari Saman & Semangat Kebersamaan',
    titleEn: 'Saman Dance & Collective Harmony',
    proverb: '"Hudep beusare, mate beusajan"',
    bodyId:
      'Berasal dari dataran tinggi Gayo Lues, Tari Saman memadukan syair nasihat, tepukan dada, dan sinkronisasi tangan yang kian cepat tanpa alat musik pengiring.',
    bodyEn:
      'Originating in highland Gayo Lues, the Saman dance unites poetic chant with accelerating synchronized hand and shoulder percussion.',
    tipId: 'Coba ketuk ritme di bawah atau jelajahi mode permainan pusaka setelah masuk ke Wonderful Aceh.',
    tipEn: 'Tap the rhythm pad below or explore the Heritage Expedition game once inside Wonderful Aceh.',
  },
  {
    id: 'pinto',
    image: PHOTO_ASSETS.byItemId.d2,
    badgeId: 'Motif Tradisional',
    badgeEn: 'Traditional Motif',
    titleId: 'Pinto Aceh & Sulam Kasab Emas',
    titleEn: 'Pinto Aceh & Golden Kasab Weaving',
    proverb: '"Adat bak Po Teumeureuhom, hukom bak Syiah Kuala"',
    bodyId:
      'Motif Pinto Aceh terinspirasi dari pintu rendah peninggalan Sultan Iskandar Muda yang mengajarkan kerendahan hati. Sulam benang emas Kasab menghiasi kain songket upacara adat.',
    bodyEn:
      'The Pinto Aceh motif draws from a historic royal archway symbolizing humility, paired with golden Kasab embroidery on ceremonial songket textiles.',
    tipId: 'Anda dapat melihat jejak arsitektur klasik dan motif Aceh di Museum Tsunami serta kawasan Banda Aceh.',
    tipEn: 'Spot these architectural and textile motifs across Banda Aceh museums and traditional craft centers.',
  },
  {
    id: 'pusaka',
    image: PHOTO_ASSETS.byItemId.d8,
    badgeId: 'Identitas Daerah',
    badgeEn: 'Regional Identity',
    titleId: 'Kupiah Meukeutop, Rencong & Kopi Gayo',
    titleEn: 'Kupiah Meukeutop, Rencong & Gayo Coffee',
    proverb: '"Taek u gle tawoe u blang"',
    bodyId:
      'Dari pesisir Banda Aceh hingga dataran tinggi Takengon, tradisi bersanding erat dengan kedai kopi rakyat—tempat warga bertukar kabar sambil menyeduh kopi saring atau Arabika Gayo.',
    bodyEn:
      'From coastal Banda Aceh to highland Takengon, heritage thrives in traditional coffee houses where locals gather over brewed Gayo Arabica.',
    tipId: 'Gunakan Peta Wilayah & Perencana Perjalanan untuk menelusuri rute budaya lintas 5 daerah Aceh.',
    tipEn: 'Use the Regional Map and Itinerary Planner to trace cultural routes across 5 Acehnese regions.',
  },
];

let audioCtxRef = null;

function getAudioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtxRef) audioCtxRef = new Ctx();
  if (audioCtxRef.state === 'suspended') {
    audioCtxRef.resume().catch(() => {});
  }
  return audioCtxRef;
}

export function playRapaiWelcomeBeat() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const pattern = [
      { delay: 0, freq: 130, type: 'triangle', dur: 0.14 },
      { delay: 0.18, freq: 185, type: 'sine', dur: 0.1 },
      { delay: 0.34, freq: 130, type: 'triangle', dur: 0.14 },
      { delay: 0.52, freq: 392, type: 'sine', dur: 0.24 },
      { delay: 0.72, freq: 165, type: 'triangle', dur: 0.14 },
      { delay: 0.88, freq: 523.25, type: 'sine', dur: 0.28 },
    ];

    const now = ctx.currentTime;
    pattern.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now + note.delay);
      if (note.freq < 220) {
        osc.frequency.exponentialRampToValueAtTime(55, now + note.delay + note.dur);
      }
      gain.gain.setValueAtTime(0.001, now + note.delay);
      gain.gain.linearRampToValueAtTime(0.11, now + note.delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.delay);
      osc.stop(now + note.delay + note.dur + 0.02);
    });
  } catch {
    // Ignore browser audio autoplay restrictions
  }
}

export function hasSeenCulturalPopup() {
  try {
    return window.sessionStorage.getItem(POPUP_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markCulturalPopupSeen() {
  try {
    window.sessionStorage.setItem(POPUP_SESSION_KEY, '1');
  } catch {
    // Ignore storage errors
  }
}

export function openCulturalWelcomePopup({ lang = 'id', onExploreGame = null } = {}) {
  let backdrop = document.getElementById('culturalPopupBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'culturalPopupBackdrop';
    backdrop.className = 'modal-backdrop cultural-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'culturalPopupTitle');
    document.body.appendChild(backdrop);
  }

  let activePillarId = CULTURAL_PILLARS[0].id;
  let rhythmStep = 0;

  function closePopup() {
    markCulturalPopupSeen();
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderPopup() {
    const isEn = lang === 'en';
    const active = CULTURAL_PILLARS.find((p) => p.id === activePillarId) || CULTURAL_PILLARS[0];

    backdrop.innerHTML = `
      <div class="modal-dialog cultural-modal-dialog">
        <div class="songket-trim" aria-hidden="true"></div>
        <button type="button" class="modal-close cultural-close" id="closeCulturalPopupBtn" aria-label="${isEn ? 'Close cultural welcome' : 'Tutup sambutan budaya'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div class="cultural-popup-head">
          <div class="cultural-crest" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L40 20L24 44L8 20L24 4Z" stroke="#e3b764" stroke-width="2" fill="rgba(227,183,100,0.14)"/>
              <path d="M24 12L33 21L24 35L15 21L24 12Z" stroke="#e3b764" stroke-width="1.6"/>
              <circle cx="24" cy="22" r="3.5" fill="#e3b764"/>
            </svg>
          </div>
          <div>
            <div class="cultural-eyebrow">SALEUM TEUKA · WONDERFUL ACEH</div>
            <h2 id="culturalPopupTitle" class="cultural-popup-title">
              ${isEn ? 'Peumulia Jamee: Welcome to the Land of Aceh' : 'Peumulia Jamee: Selamat Datang di Bumi Aceh'}
            </h2>
          </div>
        </div>

        <div class="cultural-tab-row" role="tablist" aria-label="${isEn ? 'Aceh cultural highlights' : 'Sorotan budaya Aceh'}">
          ${CULTURAL_PILLARS.map((pillar) => {
            const isSelected = pillar.id === activePillarId;
            return `
              <button
                type="button"
                role="tab"
                class="cultural-tab-btn ${isSelected ? 'active' : ''}"
                aria-selected="${isSelected ? 'true' : 'false'}"
                data-cultural-tab="${pillar.id}"
              >
                ${escapeHtml(isEn ? pillar.badgeEn : pillar.badgeId)}
              </button>
            `;
          }).join('')}
        </div>

        <div class="cultural-popup-body">
          <div class="cultural-photo-wrap">
            <img
              src="${escapeHtml(active.image)}"
              alt="${escapeHtml(isEn ? active.titleEn : active.titleId)}"
              referrerPolicy="no-referrer"
            />
            <div class="cultural-proverb-banner">${escapeHtml(active.proverb)}</div>
          </div>

          <div class="cultural-info-wrap">
            <h3>${escapeHtml(isEn ? active.titleEn : active.titleId)}</h3>
            <p class="cultural-desc">${escapeHtml(isEn ? active.bodyEn : active.bodyId)}</p>
            <div class="cultural-tip-box">${escapeHtml(isEn ? active.tipEn : active.tipId)}</div>

            <div class="cultural-sound-bar">
              <button type="button" class="btn btn-heritage-ghost btn-sm" id="playPopupRapaiBtn">
                ${isEn ? 'Play Welcome Rapai Beat' : 'Tabuh Ritme Sambutan Rapai'}
              </button>
              <span class="cultural-beat-dots" aria-hidden="true">
                ${[0, 1, 2, 3]
                  .map(
                    (idx) =>
                      `<i class="beat-node ${rhythmStep > 0 && (rhythmStep - 1) % 4 === idx ? 'lit' : ''}"></i>`,
                  )
                  .join('')}
              </span>
            </div>
          </div>
        </div>

        <div class="cultural-popup-footer">
          <button type="button" class="btn btn-gold" id="enterWonderfulAcehBtn">
            ${isEn ? 'Enter Wonderful Aceh' : 'Masuk ke Wonderful Aceh'}
          </button>
          ${
            typeof onExploreGame === 'function'
              ? `<button type="button" class="btn btn-heritage-ghost" id="popupPlayGameBtn">
                  ${isEn ? 'Play Cultural Quest' : 'Main Kuis Budaya'}
                </button>`
              : ''
          }
        </div>
      </div>
    `;

    backdrop.querySelector('#closeCulturalPopupBtn')?.addEventListener('click', closePopup);
    backdrop.querySelector('#enterWonderfulAcehBtn')?.addEventListener('click', closePopup);

    backdrop.querySelector('#popupPlayGameBtn')?.addEventListener('click', () => {
      closePopup();
      if (typeof onExploreGame === 'function') onExploreGame();
    });

    backdrop.querySelector('#playPopupRapaiBtn')?.addEventListener('click', () => {
      playRapaiWelcomeBeat();
      rhythmStep += 1;
      const dots = backdrop.querySelectorAll('.beat-node');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('lit', (rhythmStep - 1) % 4 === idx);
      });
    });

    backdrop.querySelectorAll('[data-cultural-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activePillarId = btn.getAttribute('data-cultural-tab') || CULTURAL_PILLARS[0].id;
        renderPopup();
      });
    });
  }

  backdrop.onclick = (e) => {
    if (e.target === backdrop) closePopup();
  };

  if (!backdrop.dataset.escBound) {
    backdrop.dataset.escBound = '1';
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        closePopup();
      }
    });
  }

  renderPopup();
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  backdrop.querySelector('#closeCulturalPopupBtn')?.focus();
}
