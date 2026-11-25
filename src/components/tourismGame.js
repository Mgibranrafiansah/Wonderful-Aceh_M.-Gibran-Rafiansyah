import { escapeHtml } from '../utils/format.js';
import { PHOTO_ASSETS } from './illustrations.js';

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    image: PHOTO_ASSETS.byItemId.d1,
    region: 'Banda Aceh',
    hintId: 'Berada di pusat Kota Banda Aceh dengan tujuh kubah hitam dan kolam pantul.',
    hintEn: 'Located in central Banda Aceh with seven black domes and a reflecting pool.',
    questionId: 'Ikon arsitektur Kesultanan Aceh yang menjadi pusat ibadah dan sejarah kota ini adalah...',
    questionEn: 'Which iconic Sultanate-era landmark serves as the spiritual heart of Banda Aceh?',
    options: [
      'Masjid Raya Baiturrahman',
      'Masjid Agung Babussalam',
      'Museum Tsunami Aceh',
      'Rumah Adat Gayo',
    ],
    answerIndex: 0,
    loreId:
      'Masjid Raya Baiturrahman dibangun ulang pada masa Kesultanan Aceh dan tetap kokoh berdiri melintasi sejarah sebagai kebanggaan Serambi Mekkah.',
    loreEn:
      'Masjid Raya Baiturrahman stands as an enduring symbol of Acehnese resilience, spirituality, and classical Islamic architecture.',
  },
  {
    id: 'q2',
    image: PHOTO_ASSETS.byItemId.d2,
    region: 'Banda Aceh',
    hintId: 'Fasad kisi logam melengkungnya terinspirasi oleh tarian tradisional Aceh dan gelombang laut.',
    hintEn: 'Its curved metallic lattice facade draws inspiration from traditional Saman dance and ocean waves.',
    questionId: 'Bangunan memorial dan edukasi mitigasi bencana yang tampak pada foto ini adalah...',
    questionEn: 'Identify this modern memorial and coastal resilience museum in Banda Aceh:',
    options: [
      'Kapal PLTD Apung',
      'Museum Tsunami Aceh',
      'Pasar Kuliner Aceh',
      'Pantai Sumur Tiga',
    ],
    answerIndex: 1,
    loreId:
      'Dirancang oleh arsitek Ridwan Kamil, Museum Tsunami Aceh memadukan bentuk Rumoh Aceh dan filosofi tarian Saman dalam ruang refleksi yang khidmat.',
    loreEn:
      'Designed as an educational memorial, the Aceh Tsunami Museum blends Rumoh Aceh stilt geometry with Saman cultural motifs.',
  },
  {
    id: 'q3',
    image: PHOTO_ASSETS.byItemId.d6,
    region: 'Sabang',
    hintId: 'Terletak di Pulau Weh, terkenal dengan air jernih dan dermaga perahu menuju Pulau Rubiah.',
    hintEn: 'Situated on Pulau Weh, famed for crystal waters and wooden boats heading to Rubiah Island.',
    questionId: 'Kawasan wisata bahari dengan terumbu karang dangkal yang jernih ini bernama...',
    questionEn: 'Which coastal bay on Weh Island is pictured in this crystal-clear anchorage?',
    options: [
      'Pantai Lampuuk',
      'Danau Laut Tawar',
      'Pulau Weh – Iboih',
      'Pantai Lhoknga',
    ],
    answerIndex: 2,
    loreId:
      'Teluk Iboih di Sabang menjadi gerbang utama menuju taman laut Pulau Rubiah yang menjadi surga snorkeling ramah keluarga.',
    loreEn:
      'Iboih Bay on Pulau Weh serves as the serene gateway to Rubiah Island’s coral gardens and clear snorkeling waters.',
  },
  {
    id: 'q4',
    image: PHOTO_ASSETS.byItemId.d8,
    region: 'Aceh Tengah',
    hintId: 'Danau tekto-vulkanik luas di dataran tinggi Tanah Gayo, Takengon.',
    hintEn: 'A vast highland lake nestled in the Gayo mountains of Takengon.',
    questionId: 'Panorama danau berkabut di dataran tinggi Gayo pada gambar ini adalah...',
    questionEn: 'Name this scenic highland lake surrounded by misty ridges in Takengon:',
    options: [
      'Pantan Terong',
      'Danau Laut Tawar',
      'Burni Telong',
      'Pantai Sumur Tiga',
    ],
    answerIndex: 1,
    loreId:
      'Danau Laut Tawar dijuluki "laut di atas bukit" oleh masyarakat Gayo dan menjadi pusat kehidupan nelayan serta kebun kopi Arabika di sekitarnya.',
    loreEn:
      'Danau Laut Tawar sits high in the Gayo valley, surrounded by Arabica coffee slopes and traditional highland villages.',
  },
  {
    id: 'q5',
    image: PHOTO_ASSETS.byItemId.d11,
    region: 'Bener Meriah',
    hintId: 'Gunung api aktif yang menjulang di atas kebun kopi dataran tinggi Gayo.',
    hintEn: 'A volcanic peak rising above highland coffee plantations in Bener Meriah.',
    questionId: 'Puncak gunung berapi kebanggaan pendaki di Kabupaten Bener Meriah ini adalah...',
    questionEn: 'Which highland stratovolcano in Bener Meriah is shown rising above coffee terraces?',
    options: [
      'Burni Telong',
      'Pantan Terong',
      'Pantai Lampuuk',
      'Kapal PLTD Apung',
    ],
    answerIndex: 0,
    loreId:
      'Gunung Burni Telong memiliki ketinggian sekitar 2.624 mdpl dan dikelilingi hamparan perkebunan kopi Gayo yang subur.',
    loreEn:
      'Rising to 2,624 meters, Mount Burni Telong overlooks some of Indonesia’s finest highland Arabica coffee estates.',
  },
  {
    id: 'q6',
    image: PHOTO_ASSETS.byItemId.d4,
    region: 'Aceh Besar',
    hintId: 'Pantai berpasir putih dengan latar tebing kapur hijau di Lhoknga, Aceh Besar.',
    hintEn: 'Sweeping sandy cove backed by green limestone cliffs in Aceh Besar.',
    questionId: 'Pantai ikonik dengan tebing hijau di pesisir Aceh Besar ini dikenal sebagai...',
    questionEn: 'Which iconic sandy coastline with limestone cliffs lies just southwest of Banda Aceh?',
    options: [
      'Pantai Sumur Tiga',
      'Pulau Weh – Iboih',
      'Pantai Lampuuk',
      'Danau Laut Tawar',
    ],
    answerIndex: 2,
    loreId:
      'Pantai Lampuuk terkenal dengan garis pantai melengkung sepanjang lebih dari 5 km dan tebing kapur yang dramatis.',
    loreEn:
      'Pantai Lampuuk stretches along a scenic crescent bay framed by towering karst cliffs and coconut groves.',
  },
  {
    id: 'q7',
    image: PHOTO_ASSETS.byItemId.f1,
    region: 'Banda Aceh',
    hintId: 'Mi kuning tebal berbumbu kari rempah Aceh disajikan dengan emping, acar bawang, dan jeruk nipis.',
    hintEn: 'Thick yellow noodles braised in rich Acehnese spice curry with emping crackers and pickled shallots.',
    questionId: 'Hidangan mi kaya rempah kebanggaan kuliner Nusantara asal Aceh ini adalah...',
    questionEn: 'Which signature spice-rich noodle dish from Aceh is featured on this plate?',
    options: [
      'Kuah Pliek U',
      'Kue Timphan',
      'Mie Aceh',
      'Sambal Asam Udeung',
    ],
    answerIndex: 2,
    loreId:
      'Mie Aceh memadukan kapulaga, jintan, kunyit, dan cabai khas jalur rempah pesisir Aceh—tersedia versi goreng, tumis, atau kuah.',
    loreEn:
      'Mie Aceh reflects centuries of maritime spice trade, combining cardamom, cumin, turmeric, and chili in savory gravy.',
  },
  {
    id: 'q8',
    image: PHOTO_ASSETS.byItemId.d12,
    region: 'Aceh Tengah',
    hintId: 'Arsitektur rumah panggung kayu tradisional dengan ukiran khas warisan budaya lokal.',
    hintEn: 'Traditional carved timber stilt architecture reflecting highland heritage.',
    questionId: 'Warisan arsitektur kayu tradisional masyarakat dataran tinggi ini adalah...',
    questionEn: 'Identify this traditional carved timber stilt house representing Acehnese highland culture:',
    options: [
      'Rumah Adat Gayo',
      'Museum Tsunami Aceh',
      'Masjid Agung Babussalam',
      'Kapal PLTD Apung',
    ],
    answerIndex: 0,
    loreId:
      'Rumah Adat tradisional Aceh dan Gayo dirancang tahan gempa dengan struktur pasak kayu tanpa paku serta ornamen ukiran sarat filosofi.',
    loreEn:
      'Traditional timber stilt houses use interlocking mortise-and-tenon joinery resilient to earthquakes and rich with carved symbolism.',
  },
];

const MEMORY_PAIRS = [
  { key: 'mosque', label: 'Masjid Raya', image: PHOTO_ASSETS.byItemId.d1 },
  { key: 'museum', label: 'Museum Tsunami', image: PHOTO_ASSETS.byItemId.d2 },
  { key: 'lake', label: 'Laut Tawar', image: PHOTO_ASSETS.byItemId.d8 },
  { key: 'iboih', label: 'Pulau Weh', image: PHOTO_ASSETS.byItemId.d6 },
  { key: 'mie', label: 'Mie Aceh', image: PHOTO_ASSETS.byItemId.f1 },
  { key: 'coffee', label: 'Kopi Gayo', image: PHOTO_ASSETS.byItemId.f2 },
];

const CULTURAL_PAIR_DECK = [
  {
    id: 'cp1',
    region: 'Banda Aceh',
    leftId: 'Ranup Lampuan',
    leftEn: 'Ranup Lampuan',
    rightId: 'Wadah kuningan sirih penyambutan tamu kehormatan',
    rightEn: 'Ceremonial brass betel tray honoring arriving guests',
  },
  {
    id: 'cp2',
    region: 'Aceh Tengah',
    leftId: 'Tari Saman',
    leftEn: 'Saman Dance',
    rightId: 'Tarian seribu tangan Gayo berirama cepat warisan UNESCO',
    rightEn: 'UNESCO highland synchronized dance without instruments',
  },
  {
    id: 'cp3',
    region: 'Banda Aceh',
    leftId: 'Pinto Aceh',
    leftEn: 'Pinto Aceh',
    rightId: 'Motif ukiran & perhiasan khas gerbang Kesultanan Aceh',
    rightEn: 'Classic carved & filigree gateway motif of the Sultanate',
  },
  {
    id: 'cp4',
    region: 'Aceh Besar',
    leftId: 'Rumoh Aceh',
    leftEn: 'Rumoh Aceh',
    rightId: 'Rumah panggung kayu tahan gempa dengan sambungan pasak',
    rightEn: 'Quake-resilient stilt home joined with wooden pegs',
  },
  {
    id: 'cp5',
    region: 'Bener Meriah',
    leftId: 'Kupiah Meukeutop',
    leftEn: 'Kupiah Meukeutop',
    rightId: 'Penutup kepala adat berlilit kain tenun benang Kasab emas',
    rightEn: 'Traditional ceremonial cap wrapped in Kasab gold cloth',
  },
];

const HIGHSCORE_STORAGE_KEY = 'he_game_stats_v1';

function readGameStats() {
  try {
    const raw = window.localStorage.getItem(HIGHSCORE_STORAGE_KEY);
    if (!raw) return { bestScore: 0, unlockedRegions: [] };
    const parsed = JSON.parse(raw);
    return {
      bestScore: Number(parsed.bestScore || 0),
      unlockedRegions: Array.isArray(parsed.unlockedRegions) ? parsed.unlockedRegions : [],
    };
  } catch {
    return { bestScore: 0, unlockedRegions: [] };
  }
}

function saveGameStats(stats) {
  try {
    window.localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

function playTone(freq, durationMs = 110, type = 'sine', enabled = true) {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Ignore audio context blocks
  }
}

export function createTourismGameController({ getLang, getStrings }) {
  const saved = readGameStats();

  const gameState = {
    mode: 'quiz', // 'quiz' | 'memory'
    status: 'TITLE_MENU', // 'TITLE_MENU' | 'PLAYING' | 'ROUND_SUMMARY' | 'GAME_OVER'
    soundEnabled: true,
    bestScore: saved.bestScore,
    unlockedRegions: new Set(saved.unlockedRegions),

    // Quiz mode state
    questionIndex: 0,
    score: 0,
    lives: 3,
    streak: 0,
    hintUsed: false,
    selectedOption: null,
    isCorrect: false,

    // Memory mode state
    cards: [],
    flippedIndices: [],
    matchedKeys: new Set(),
    moves: 0,
    memoryElapsedSec: 0,
    memoryLocked: false,
    memoryTimerId: null,

    // Cultural Pair mode state
    pairLeftItems: [],
    pairRightItems: [],
    selectedPairLeft: null,
    matchedPairIds: new Set(),
    pairErrors: 0,
    pairWrongId: null,
  };

  function clearTimers() {
    if (gameState.memoryTimerId) {
      window.clearInterval(gameState.memoryTimerId);
      gameState.memoryTimerId = null;
    }
  }

  function persistStats() {
    if (gameState.score > gameState.bestScore) {
      gameState.bestScore = gameState.score;
    }
    saveGameStats({
      bestScore: gameState.bestScore,
      unlockedRegions: [...gameState.unlockedRegions],
    });
  }

  function startQuiz() {
    clearTimers();
    gameState.mode = 'quiz';
    gameState.status = 'PLAYING';
    gameState.questionIndex = 0;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.streak = 0;
    gameState.hintUsed = false;
    gameState.selectedOption = null;
    gameState.isCorrect = false;
    render();
  }

  function startMemory() {
    clearTimers();
    gameState.mode = 'memory';
    gameState.status = 'PLAYING';
    const deck = [...MEMORY_PAIRS, ...MEMORY_PAIRS].map((item, idx) => ({
      uid: `${item.key}-${idx}`,
      ...item,
    }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    gameState.cards = deck;
    gameState.flippedIndices = [];
    gameState.matchedKeys = new Set();
    gameState.moves = 0;
    gameState.memoryElapsedSec = 0;
    gameState.memoryLocked = false;

    gameState.memoryTimerId = window.setInterval(() => {
      if (gameState.mode === 'memory' && gameState.status === 'PLAYING') {
        gameState.memoryElapsedSec += 1;
        const timerEl = document.getElementById('memoryTimerVal');
        if (timerEl) timerEl.textContent = `${gameState.memoryElapsedSec}s`;
      }
    }, 1000);

    render();
  }

  function shuffleArray(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startCulturePair() {
    clearTimers();
    gameState.mode = 'culturePair';
    gameState.status = 'PLAYING';
    gameState.pairLeftItems = shuffleArray(CULTURAL_PAIR_DECK);
    gameState.pairRightItems = shuffleArray(CULTURAL_PAIR_DECK);
    gameState.selectedPairLeft = null;
    gameState.matchedPairIds = new Set();
    gameState.pairErrors = 0;
    gameState.pairWrongId = null;
    gameState.streak = 0;
    render();
  }

  function selectPairLeft(pairId) {
    if (gameState.status !== 'PLAYING' || gameState.matchedPairIds.has(pairId)) return;
    gameState.selectedPairLeft = pairId;
    gameState.pairWrongId = null;
    playTone(460, 70, 'sine', gameState.soundEnabled);
    render();
  }

  function selectPairRight(pairId) {
    if (gameState.status !== 'PLAYING' || !gameState.selectedPairLeft) return;
    if (gameState.matchedPairIds.has(pairId)) return;

    if (gameState.selectedPairLeft === pairId) {
      gameState.matchedPairIds.add(pairId);
      gameState.streak += 1;
      const pts = 120 * Math.min(3, gameState.streak);
      gameState.score += pts;
      const matchedEntry = CULTURAL_PAIR_DECK.find((entry) => entry.id === pairId);
      if (matchedEntry?.region) gameState.unlockedRegions.add(matchedEntry.region);
      gameState.selectedPairLeft = null;
      gameState.pairWrongId = null;
      playTone(690, 140, 'triangle', gameState.soundEnabled);
      persistStats();

      if (gameState.matchedPairIds.size === CULTURAL_PAIR_DECK.length) {
        gameState.status = 'GAME_OVER';
        playTone(784, 240, 'triangle', gameState.soundEnabled);
      }
      render();
    } else {
      gameState.streak = 0;
      gameState.pairErrors += 1;
      gameState.pairWrongId = pairId;
      playTone(210, 160, 'sawtooth', gameState.soundEnabled);
      render();
    }
  }

  function answerQuiz(optionIdx) {
    if (gameState.status !== 'PLAYING') return;
    const q = QUIZ_QUESTIONS[gameState.questionIndex];
    if (!q) return;

    gameState.selectedOption = optionIdx;
    const correct = optionIdx === q.answerIndex;
    gameState.isCorrect = correct;

    if (correct) {
      gameState.streak += 1;
      const multiplier = Math.min(3, gameState.streak);
      const basePoints = gameState.hintUsed ? 75 : 100;
      gameState.score += basePoints * multiplier;
      gameState.unlockedRegions.add(q.region);
      playTone(660, 140, 'triangle', gameState.soundEnabled);
    } else {
      gameState.streak = 0;
      gameState.lives = Math.max(0, gameState.lives - 1);
      playTone(220, 180, 'sawtooth', gameState.soundEnabled);
    }

    persistStats();
    gameState.status = 'ROUND_SUMMARY';
    render();
  }

  function advanceQuiz() {
    if (gameState.lives <= 0 || gameState.questionIndex >= QUIZ_QUESTIONS.length - 1) {
      gameState.status = 'GAME_OVER';
      playTone(523, 220, 'triangle', gameState.soundEnabled);
    } else {
      gameState.questionIndex += 1;
      gameState.hintUsed = false;
      gameState.selectedOption = null;
      gameState.status = 'PLAYING';
    }
    render();
  }

  function flipMemoryCard(cardIdx) {
    if (gameState.status !== 'PLAYING' || gameState.memoryLocked) return;
    const card = gameState.cards[cardIdx];
    if (!card) return;
    if (gameState.flippedIndices.includes(cardIdx) || gameState.matchedKeys.has(card.key)) {
      return;
    }

    playTone(440, 80, 'sine', gameState.soundEnabled);
    gameState.flippedIndices.push(cardIdx);
    render();

    if (gameState.flippedIndices.length === 2) {
      gameState.moves += 1;
      gameState.memoryLocked = true;
      const [firstIdx, secondIdx] = gameState.flippedIndices;
      const firstCard = gameState.cards[firstIdx];
      const secondCard = gameState.cards[secondIdx];

      if (firstCard.key === secondCard.key) {
        gameState.matchedKeys.add(firstCard.key);
        gameState.flippedIndices = [];
        gameState.memoryLocked = false;
        playTone(720, 140, 'triangle', gameState.soundEnabled);

        if (gameState.matchedKeys.size === MEMORY_PAIRS.length) {
          clearTimers();
          const bonus = Math.max(150, 600 - gameState.moves * 25);
          gameState.score += bonus;
          persistStats();
          gameState.status = 'GAME_OVER';
        }
        render();
      } else {
        window.setTimeout(() => {
          gameState.flippedIndices = [];
          gameState.memoryLocked = false;
          render();
        }, 680);
      }
    }
  }

  function render() {
    const mount = document.getElementById('tourismGameArena');
    if (!mount) return;

    const lang = getLang();
    const s = getStrings();
    const allRegions = ['Banda Aceh', 'Sabang', 'Aceh Besar', 'Aceh Tengah', 'Bener Meriah'];

    const stampsHtml = allRegions
      .map((region) => {
        const unlocked = gameState.unlockedRegions.has(region);
        return `
          <div class="passport-stamp ${unlocked ? 'unlocked' : ''}">
            <span>${escapeHtml(region)}</span>
            <small>${unlocked ? (lang === 'en' ? 'Stamped' : 'Tercatat') : (lang === 'en' ? 'Locked' : 'Terkunci')}</small>
          </div>
        `;
      })
      .join('');

    let bodyHtml = '';

    if (gameState.status === 'TITLE_MENU') {
      bodyHtml = `
        <div class="game-title-menu">
          <div class="game-mode-grid game-mode-grid-3">
            <div class="game-mode-card">
              <h3>${escapeHtml(s.gameQuizTitle)}</h3>
              <p>${escapeHtml(s.gameQuizDesc)}</p>
              <button type="button" class="btn btn-gold" data-game-start="quiz">
                ${escapeHtml(s.gameStartQuizBtn)}
              </button>
            </div>
            <div class="game-mode-card">
              <h3>${escapeHtml(s.gameMemoryTitle)}</h3>
              <p>${escapeHtml(s.gameMemoryDesc)}</p>
              <button type="button" class="btn btn-gold" data-game-start="memory">
                ${escapeHtml(s.gameStartMemoryBtn)}
              </button>
            </div>
            <div class="game-mode-card">
              <h3>${escapeHtml(s.gamePairTitle)}</h3>
              <p>${escapeHtml(s.gamePairDesc)}</p>
              <button type="button" class="btn btn-gold" data-game-start="culturePair">
                ${escapeHtml(s.gameStartPairBtn)}
              </button>
            </div>
          </div>
        </div>
      `;
    } else if (gameState.mode === 'quiz') {
      const q = QUIZ_QUESTIONS[gameState.questionIndex];
      const questionText = lang === 'en' ? q.questionEn : q.questionId;
      const hintText = lang === 'en' ? q.hintEn : q.hintId;
      const loreText = lang === 'en' ? q.loreEn : q.loreId;

      if (gameState.status === 'GAME_OVER') {
        const finishedAll = gameState.lives > 0;
        bodyHtml = `
          <div class="game-summary-box">
            <h3>${escapeHtml(finishedAll ? s.gameWinTitle : s.gameOverTitle)}</h3>
            <p class="tabular-nums">${escapeHtml(s.gameFinalScore)}: <strong>${gameState.score}</strong> · ${escapeHtml(s.gameBestScore)}: <strong>${gameState.bestScore}</strong></p>
            <div class="game-summary-actions">
              <button type="button" class="btn btn-gold" data-game-start="quiz">${escapeHtml(s.gamePlayAgainBtn)}</button>
              <button type="button" class="btn btn-heritage-ghost" data-game-start="memory">${escapeHtml(s.gameSwitchMemoryBtn)}</button>
            </div>
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="quiz-stage">
            <div class="quiz-photo-frame">
              <img
                src="${escapeHtml(q.image)}"
                alt="${escapeHtml(q.region)}"
                referrerPolicy="no-referrer"
              />
              <div class="quiz-progress-label tabular-nums">
                ${escapeHtml(s.gameQuestionLabel)} ${gameState.questionIndex + 1}/${QUIZ_QUESTIONS.length}
              </div>
            </div>

            <div class="quiz-content">
              <p class="quiz-question">${escapeHtml(questionText)}</p>

              ${
                gameState.hintUsed
                  ? `<div class="quiz-hint-box">${escapeHtml(hintText)}</div>`
                  : gameState.status === 'PLAYING'
                    ? `<button type="button" class="btn btn-heritage-ghost btn-sm" id="quizHintBtn" style="align-self: flex-start;">${escapeHtml(s.gameHintBtn)}</button>`
                    : ''
              }

              <div class="quiz-options">
                ${q.options
                  .map((opt, idx) => {
                    let stateClass = '';
                    if (gameState.status === 'ROUND_SUMMARY') {
                      if (idx === q.answerIndex) stateClass = 'is-correct';
                      else if (idx === gameState.selectedOption) stateClass = 'is-wrong';
                    }
                    return `
                      <button
                        type="button"
                        class="quiz-option-btn ${stateClass}"
                        data-quiz-answer="${idx}"
                        ${gameState.status !== 'PLAYING' ? 'disabled' : ''}
                      >
                        ${escapeHtml(opt)}
                      </button>
                    `;
                  })
                  .join('')}
              </div>

              ${
                gameState.status === 'ROUND_SUMMARY'
                  ? `
                  <div class="quiz-lore-panel ${gameState.isCorrect ? 'correct' : 'wrong'}">
                    <strong>${escapeHtml(gameState.isCorrect ? s.gameCorrectLabel : s.gameWrongLabel)}</strong>
                    <p>${escapeHtml(loreText)}</p>
                    <button type="button" class="btn btn-gold btn-sm" id="quizNextBtn">
                      ${escapeHtml(gameState.lives <= 0 || gameState.questionIndex >= QUIZ_QUESTIONS.length - 1 ? s.gameFinishBtn : s.gameNextBtn)}
                    </button>
                  </div>
                `
                  : ''
              }
            </div>
          </div>
        `;
      }
    } else if (gameState.mode === 'memory') {
      if (gameState.status === 'GAME_OVER') {
        const stars = gameState.moves <= 9 ? 3 : gameState.moves <= 13 ? 2 : 1;
        bodyHtml = `
          <div class="game-summary-box">
            <h3>${escapeHtml(s.gameMemoryCompleteTitle)}</h3>
            <p class="tabular-nums">
              ${stars} ★ · ${gameState.moves} ${escapeHtml(s.gameMovesLabel)} · ${gameState.memoryElapsedSec}s · ${escapeHtml(s.gameBestScore)}: <strong>${gameState.bestScore}</strong>
            </p>
            <div class="game-summary-actions">
              <button type="button" class="btn btn-gold" data-game-start="memory">${escapeHtml(s.gamePlayAgainBtn)}</button>
              <button type="button" class="btn btn-heritage-ghost" data-game-start="quiz">${escapeHtml(s.gameSwitchQuizBtn)}</button>
            </div>
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="memory-board">
            ${gameState.cards
              .map((card, idx) => {
                const isRevealed =
                  gameState.flippedIndices.includes(idx) ||
                  gameState.matchedKeys.has(card.key);
                const isMatched = gameState.matchedKeys.has(card.key);

                return `
                  <button
                    type="button"
                    class="memory-card ${isRevealed ? 'revealed' : ''} ${isMatched ? 'matched' : ''}"
                    data-memory-idx="${idx}"
                    aria-label="${escapeHtml(isRevealed ? card.label : s.gameHiddenCardLabel)}"
                    aria-pressed="${isRevealed ? 'true' : 'false'}"
                  >
                    <div class="memory-card-inner">
                      <div class="memory-card-back" aria-hidden="true">
                        <span class="songket-diamond"></span>
                      </div>
                      <div class="memory-card-front">
                        <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.label)}" referrerPolicy="no-referrer" />
                        <span>${escapeHtml(card.label)}</span>
                      </div>
                    </div>
                  </button>
                `;
              })
              .join('')}
          </div>
        `;
      }
    } else if (gameState.mode === 'culturePair') {
      if (gameState.status === 'GAME_OVER') {
        bodyHtml = `
          <div class="game-summary-box">
            <h3>${escapeHtml(s.gamePairCompleteTitle)}</h3>
            <p class="tabular-nums">
              ${CULTURAL_PAIR_DECK.length}/${CULTURAL_PAIR_DECK.length} · ${escapeHtml(s.gameMistakesLabel)}: ${gameState.pairErrors} · ${escapeHtml(s.gameFinalScore)}: <strong>${gameState.score}</strong>
            </p>
            <div class="game-summary-actions">
              <button type="button" class="btn btn-gold" data-game-start="culturePair">${escapeHtml(s.gamePlayAgainBtn)}</button>
              <button type="button" class="btn btn-heritage-ghost" data-game-start="quiz">${escapeHtml(s.gameSwitchQuizBtn)}</button>
            </div>
          </div>
        `;
      } else {
        bodyHtml = `
          <p class="pair-instruction">${escapeHtml(s.gamePairInstruction)}</p>
          <div class="pair-match-grid">
            <div class="pair-column">
              ${gameState.pairLeftItems
                .map((item) => {
                  const matched = gameState.matchedPairIds.has(item.id);
                  const selected = gameState.selectedPairLeft === item.id;
                  return `
                    <button
                      type="button"
                      class="pair-tile ${matched ? 'is-matched' : ''} ${selected ? 'is-selected' : ''}"
                      data-pair-left="${item.id}"
                      ${matched ? 'disabled' : ''}
                    >
                      <span>${escapeHtml(lang === 'en' ? item.leftEn : item.leftId)}</span>
                      <small>${escapeHtml(item.region)}</small>
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="pair-column">
              ${gameState.pairRightItems
                .map((item) => {
                  const matched = gameState.matchedPairIds.has(item.id);
                  const wrong = gameState.pairWrongId === item.id;
                  return `
                    <button
                      type="button"
                      class="pair-tile ${matched ? 'is-matched' : ''} ${wrong ? 'is-wrong' : ''}"
                      data-pair-right="${item.id}"
                      ${matched ? 'disabled' : ''}
                    >
                      <span>${escapeHtml(lang === 'en' ? item.rightEn : item.rightId)}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>
        `;
      }
    }

    mount.innerHTML = `
      <div class="game-hud">
        <div class="game-hud-metrics tabular-nums">
          <span>${escapeHtml(s.gameScoreLabel)}: <strong>${gameState.score}</strong></span>
          <span>${escapeHtml(s.gameBestScore)}: <strong>${gameState.bestScore}</strong></span>
          ${
            gameState.mode === 'quiz' && gameState.status !== 'TITLE_MENU'
              ? `<span>${escapeHtml(s.gameLivesLabel)}: <strong>${gameState.lives}/3</strong></span>
                 <span>Streak: <strong>${gameState.streak}x</strong></span>`
              : gameState.mode === 'memory' && gameState.status === 'PLAYING'
                ? `<span>${escapeHtml(s.gameMovesLabel)}: <strong>${gameState.moves}</strong></span>
                   <span>${escapeHtml(s.gamePairsLabel)}: <strong>${gameState.matchedKeys.size}/${MEMORY_PAIRS.length}</strong></span>
                   <span>${escapeHtml(s.gameTimeLabel)}: <strong id="memoryTimerVal">${gameState.memoryElapsedSec}s</strong></span>`
                : gameState.mode === 'culturePair' && gameState.status === 'PLAYING'
                  ? `<span>${escapeHtml(s.gamePairsLabel)}: <strong>${gameState.matchedPairIds.size}/${CULTURAL_PAIR_DECK.length}</strong></span>
                     <span>Streak: <strong>${gameState.streak}x</strong></span>`
                  : ''
          }
        </div>

        <div class="game-hud-controls">
          <button type="button" class="btn btn-heritage-ghost btn-sm" id="gameSoundToggle">
            ${escapeHtml(gameState.soundEnabled ? s.gameSoundOn : s.gameSoundOff)}
          </button>
          ${
            gameState.status !== 'TITLE_MENU'
              ? `<button type="button" class="btn btn-heritage-ghost btn-sm" id="gameMenuBtn">${escapeHtml(s.gameMenuBtn)}</button>`
              : ''
          }
        </div>
      </div>

      ${bodyHtml}

      <div class="passport-strip">
        <span class="passport-label">${escapeHtml(s.gamePassportLabel)} (${gameState.unlockedRegions.size}/5)</span>
        <div class="passport-stamps">${stampsHtml}</div>
      </div>
    `;

    bindGameEvents(mount);
  }

  function bindGameEvents(mount) {
    mount.querySelectorAll('[data-game-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-game-start');
        if (mode === 'memory') startMemory();
        else if (mode === 'culturePair') startCulturePair();
        else startQuiz();
      });
    });

    mount.querySelector('#gameSoundToggle')?.addEventListener('click', () => {
      gameState.soundEnabled = !gameState.soundEnabled;
      render();
    });

    mount.querySelector('#gameMenuBtn')?.addEventListener('click', () => {
      clearTimers();
      gameState.status = 'TITLE_MENU';
      render();
    });

    mount.querySelector('#quizHintBtn')?.addEventListener('click', () => {
      gameState.hintUsed = true;
      render();
    });

    mount.querySelectorAll('[data-quiz-answer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        answerQuiz(Number(btn.getAttribute('data-quiz-answer')));
      });
    });

    mount.querySelector('#quizNextBtn')?.addEventListener('click', advanceQuiz);

    mount.querySelectorAll('[data-memory-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        flipMemoryCard(Number(btn.getAttribute('data-memory-idx')));
      });
    });

    mount.querySelectorAll('[data-pair-left]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectPairLeft(btn.getAttribute('data-pair-left'));
      });
    });

    mount.querySelectorAll('[data-pair-right]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectPairRight(btn.getAttribute('data-pair-right'));
      });
    });
  }

  return {
    render,
    cleanup: clearTimers,
  };
}
