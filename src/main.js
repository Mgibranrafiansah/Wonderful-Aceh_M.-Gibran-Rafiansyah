import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { ACEH_REGIONS } from './catalog/seed.js';
import { TRANSLATIONS, t } from './i18n/translations.js';
import { escapeHtml, formatRupiah, sanitizeUrl, todayIsoDate } from './utils/format.js';
import { api, clearAuthToken } from './utils/api.js';
import {
  PHOTO_ASSETS,
  renderCardArtwork,
  renderHeroArtwork,
  renderInteractiveAcehMap,
} from './components/illustrations.js';
import { renderAuthView } from './components/authView.js';
import {
  hasSeenCulturalPopup,
  openCulturalWelcomePopup,
} from './components/culturalPopup.js';
import { createCulturalShowcaseController } from './components/culturalShowcase.js';
import { createPhotoLocatorController } from './components/photoLocator.js';
import { createTourismGameController } from './components/tourismGame.js';
import { showToast } from './components/toast.js';
import { closeModal, openConfirmModal, openModal } from './components/modal.js';

const LANG_STORAGE_KEY = 'he_language_v2';

function readStoredLanguage() {
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

function saveStoredLanguage(langCode) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, langCode);
  } catch {
    // Ignore storage restriction
  }
}

const appState = {
  language: readStoredLanguage(),
  currentUser: null,
  authStatus: { adminClaimed: false, envAdminConfigured: false, hasUsers: false },
  authTab: 'login',
  destinations: [],
  foods: [],
  stays: [],
  packages: [],
  favorites: [],
  savedItineraries: [],
  managedUsers: [],
};

const uiState = {
  searchQuery: '',
  selectedRegion: '',
  selectedCategory: '',
  sortBy: 'featured',
  favoritesOnly: false,
  activeMapRegion: ACEH_REGIONS[0].name,
  planner: {
    name: '',
    date: todayIsoDate(),
    days: 3,
    travelers: 2,
    selectedDestinationIds: [],
    transportCost: 300000,
    stayCost: 350000,
    mealCost: 100000,
    activityCost: 150000,
    lastGeneratedItinerary: null,
  },
  packageFilter: {
    interest: 'all',
    maxBudget: 2000000,
  },
  adminType: 'destinations',
  mobileMenuOpen: false,
};

function lang() {
  return appState.language;
}

function tr(key) {
  return t(key, lang());
}

const tourismGame = createTourismGameController({
  getLang: lang,
  getStrings: () => TRANSLATIONS[lang()] || TRANSLATIONS.id,
});

const culturalShowcase = createCulturalShowcaseController({
  getLang: lang,
});

const photoLocator = createPhotoLocatorController({
  getLang: lang,
  getDestinations: () => appState.destinations,
  getFoods: () => appState.foods,
  onOpenDestinationDetail: (id) => openDestinationDetailModal(id),
  onJumpCulinary: () => {
    document.getElementById('culinary')?.scrollIntoView({ behavior: 'smooth' });
  },
  onFilterRegionOnMap: (regencyOrCity) => {
    const lower = String(regencyOrCity || '').toLowerCase();
    const matchedRegion = ACEH_REGIONS.find((r) => lower.includes(r.name.toLowerCase()));
    if (matchedRegion) {
      uiState.activeMapRegion = matchedRegion.name;
      renderMapSection();
    }
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  },
  onUnauthorized: handleUnauthorizedError,
});

function roleLabel(role) {
  if (role === 'admin') return tr('roleAdminLabel');
  if (role === 'operator') return tr('roleOperatorLabel');
  return tr('roleUserLabel');
}

function canManageCatalog() {
  return (
    appState.currentUser?.role === 'operator' ||
    appState.currentUser?.role === 'admin'
  );
}

function isAdmin() {
  return appState.currentUser?.role === 'admin';
}

function isFavorite(destinationId) {
  return appState.favorites.some(
    (fav) => fav.itemId === destinationId && fav.type === 'destination',
  );
}

function calculateBudgetTotal() {
  const days = Math.max(1, Number(uiState.planner.days || 1));
  const travelers = Math.max(1, Number(uiState.planner.travelers || 1));
  const transport = Math.max(0, Number(uiState.planner.transportCost || 0));
  const stayPerNight = Math.max(0, Number(uiState.planner.stayCost || 0));
  const mealPerPersonDay = Math.max(0, Number(uiState.planner.mealCost || 0));
  const activityPerPerson = Math.max(0, Number(uiState.planner.activityCost || 0));

  const stayTotal = stayPerNight * Math.max(0, days - 1);
  const mealTotal = mealPerPersonDay * days * travelers;
  const activityTotal = activityPerPerson * travelers;
  const total = transport + stayTotal + mealTotal + activityTotal;

  return {
    days,
    travelers,
    transport,
    stayTotal,
    mealTotal,
    activityTotal,
    total,
  };
}

function handleUnauthorizedError(err) {
  if (err?.status === 401) {
    clearAuthToken();
    appState.currentUser = null;
    showToast(err.message || 'Session expired', 'error');
    bootstrapAuth();
    return true;
  }
  return false;
}

async function loadAuthenticatedData(user) {
  appState.currentUser = user;
  const [catalog, workspace] = await Promise.all([
    api.getCatalog(),
    api.getUserWorkspace(),
  ]);

  appState.destinations = catalog.destinations || [];
  appState.foods = catalog.foods || [];
  appState.stays = catalog.stays || [];
  appState.packages = catalog.packages || [];
  appState.favorites = workspace.favorites || [];
  appState.savedItineraries = workspace.itineraries || [];

  if (user.role === 'admin') {
    const usersRes = await api.listUsers();
    appState.managedUsers = usersRes.users || [];
  } else {
    appState.managedUsers = [];
  }

  renderMainApp();
  showToast(`${tr('authWelcomeToast')} ${user.name}`);
}

async function bootstrapAuth() {
  document.documentElement.lang = lang();
  const root = document.getElementById('app');
  if (!root) return;

  try {
    appState.authStatus = await api.getAuthStatus();
  } catch {
    appState.authStatus = { adminClaimed: false, envAdminConfigured: false, hasUsers: false };
  }

  if (!appState.authStatus.adminClaimed && !appState.authStatus.envAdminConfigured) {
    appState.authTab = 'claim-admin';
  } else if (appState.authTab === 'claim-admin') {
    appState.authTab = 'login';
  }

  renderAuthScreen();

  if (!hasSeenCulturalPopup()) {
    openCulturalWelcomePopup({
      lang: lang(),
    });
  }
}

function openCultureModalFromMain() {
  openCulturalWelcomePopup({
    lang: lang(),
    onExploreGame: appState.currentUser
      ? () => {
          document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' });
        }
      : null,
  });
}

function renderAuthScreen() {
  document.documentElement.lang = lang();
  const root = document.getElementById('app');
  if (!root) return;

  renderAuthView({
    root,
    lang: lang(),
    authStatus: appState.authStatus,
    activeTab: appState.authTab,
    onTabChange: (nextTab) => {
      appState.authTab = nextTab;
      renderAuthScreen();
    },
    onLanguageChange: (nextLang) => {
      appState.language = nextLang;
      saveStoredLanguage(nextLang);
      renderAuthScreen();
    },
    onAuthenticated: async (user) => {
      await loadAuthenticatedData(user);
    },
    onOpenCulture: () => {
      openCulturalWelcomePopup({ lang: lang() });
    },
  });
}

function buildNavLinks() {
  if (!canManageCatalog()) {
    return [
      { href: '#photo-locator', label: tr('navLocator') },
      { href: '#destinations', label: tr('navDest') },
      { href: '#map', label: tr('navMap') },
      { href: '#game', label: tr('navGame') },
      { href: '#planner', label: tr('navPlan') },
    ];
  }

  if (isAdmin()) {
    return [
      { href: '#photo-locator', label: tr('navLocator') },
      { href: '#destinations', label: tr('navDest') },
      { href: '#game', label: tr('navGame') },
      { href: '#admin', label: tr('navManage') },
      { href: '#users', label: tr('navUsers') },
    ];
  }

  return [
    { href: '#photo-locator', label: tr('navLocator') },
    { href: '#destinations', label: tr('navDest') },
    { href: '#game', label: tr('navGame') },
    { href: '#planner', label: tr('navPlan') },
    { href: '#admin', label: tr('navManage') },
  ];
}

function renderMainApp() {
  document.documentElement.lang = lang();
  const root = document.getElementById('app');
  if (!root || !appState.currentUser) return;

  const navLinks = buildNavLinks();
  const user = appState.currentUser;
  const showCatalogManager = canManageCatalog();
  const showUserManager = isAdmin();

  root.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <a href="#" class="brand-wordmark">Wonderful <span>Aceh</span></a>

        <nav class="primary-nav" aria-label="Main navigation">
          ${navLinks
            .map(
              (link) =>
                `<a href="${link.href}" class="nav-link">${escapeHtml(link.label)}</a>`,
            )
            .join('')}
        </nav>

        <div class="header-cta">
          <button type="button" class="btn btn-heritage-ghost btn-sm" id="openCulturePopupBtn">
            ${escapeHtml(tr('openCulturePopupBtn'))}
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="logoutBtn">
            ${escapeHtml(tr('authLogoutBtn'))}
          </button>
          <button
            type="button"
            class="mobile-menu-btn"
            id="mobileMenuToggle"
            aria-expanded="${uiState.mobileMenuOpen ? 'true' : 'false'}"
            aria-label="Toggle navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div class="mobile-drawer ${uiState.mobileMenuOpen ? 'open' : ''}" id="mobileDrawer">
      <a href="#photo-locator" data-mobile-nav>${escapeHtml(tr('navLocator'))}</a>
      <a href="#destinations" data-mobile-nav>${escapeHtml(tr('navDest'))}</a>
      <a href="#map" data-mobile-nav>${escapeHtml(tr('navMap'))}</a>
      <a href="#culinary" data-mobile-nav>${escapeHtml(tr('navFood'))}</a>
      <a href="#stay" data-mobile-nav>${escapeHtml(tr('navStay'))}</a>
      <a href="#tradition" data-mobile-nav>${escapeHtml(tr('navTradition'))}</a>
      <a href="#game" data-mobile-nav>${escapeHtml(tr('navGame'))}</a>
      <a href="#planner" data-mobile-nav>${escapeHtml(tr('navPlan'))}</a>
      <a href="#packages" data-mobile-nav>${escapeHtml(tr('packagesTitle'))}</a>
      ${showCatalogManager ? `<a href="#admin" data-mobile-nav>${escapeHtml(tr('navManage'))}</a>` : ''}
      ${showUserManager ? `<a href="#users" data-mobile-nav>${escapeHtml(tr('navUsers'))}</a>` : ''}
      <button type="button" class="btn btn-secondary" id="mobileCultureBtn" style="margin-top: 8px;">
        ${escapeHtml(tr('openCulturePopupBtn'))}
      </button>
      <button type="button" class="btn btn-ghost" id="mobileLogoutBtn" style="margin-top: 8px;">
        ${escapeHtml(tr('authLogoutBtn'))}
      </button>
    </div>

    <main>
      <section class="hero">
        <div class="container">
          <div class="hero-utility-row">
            <span class="hero-kicker">
              ${escapeHtml(tr('activeAccountPrefix'))} ${escapeHtml(user.name)} · ${escapeHtml(tr('activeRolePrefix'))} ${escapeHtml(roleLabel(user.role))}
            </span>
            <div class="segmented" role="group" aria-label="Language switcher">
              <button
                type="button"
                class="segmented-btn ${lang() === 'id' ? 'active' : ''}"
                aria-pressed="${lang() === 'id' ? 'true' : 'false'}"
                data-set-lang="id"
              >ID</button>
              <button
                type="button"
                class="segmented-btn ${lang() === 'en' ? 'active' : ''}"
                aria-pressed="${lang() === 'en' ? 'true' : 'false'}"
                data-set-lang="en"
              >EN</button>
            </div>
          </div>

          <div class="hero-grid">
            <div class="hero-copy">
              <h1 class="hero-title">${tr('heroTitle')}</h1>
              <p class="hero-lead">${escapeHtml(tr('heroDesc'))}</p>
              <div class="hero-actions">
                <button type="button" class="btn btn-primary" data-scroll-target="photo-locator">
                  ${escapeHtml(tr('heroPhotoCheckBtn'))}
                </button>
                <button type="button" class="btn btn-secondary" data-scroll-target="destinations">
                  ${escapeHtml(tr('exploreBtn'))}
                </button>
                <button
                  type="button"
                  class="btn btn-heritage-ghost"
                  data-scroll-target="${showCatalogManager ? 'admin' : 'planner'}"
                >
                  ${escapeHtml(showCatalogManager ? tr('navManage') : tr('makePlanBtn'))}
                </button>
              </div>
            </div>

            <div class="hero-visual-frame">
              ${renderHeroArtwork()}
              <div class="hero-visual-scrim">
                <strong>${escapeHtml(tr('heroCaptionTitle'))}</strong>
                <span>${escapeHtml(tr('heroCaptionSub'))}</span>
              </div>
            </div>
          </div>

          <div class="hero-kpi-strip" id="heroKpis"></div>
        </div>
      </section>

      <section class="section" id="photo-locator">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('locatorEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('locatorTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('locatorSub'))}</p>
            </div>
          </div>
          <div id="photoLocatorMount"></div>
        </div>
      </section>

      <div class="songket-divider" aria-hidden="true"></div>

      <section class="section section-alt" id="destinations">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('destEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('destTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('destSub'))}</p>
            </div>
            <span class="section-meta-note tabular-nums" id="destCountNote"></span>
          </div>

          <div class="filter-bar">
            <div class="field">
              <label for="searchInput">${escapeHtml(tr('searchLabel'))}</label>
              <input
                id="searchInput"
                class="input"
                type="search"
                value="${escapeHtml(uiState.searchQuery)}"
                placeholder="${escapeHtml(tr('searchPlaceholder'))}"
              />
            </div>
            <div class="field">
              <label for="regionFilter">${escapeHtml(tr('regionLabel'))}</label>
              <select id="regionFilter" class="select"></select>
            </div>
            <div class="field">
              <label for="categoryFilter">${escapeHtml(tr('categoryLabel'))}</label>
              <select id="categoryFilter" class="select"></select>
            </div>
            <div class="field">
              <label for="sortFilter">${escapeHtml(tr('sortLabel'))}</label>
              <select id="sortFilter" class="select">
                <option value="featured" ${uiState.sortBy === 'featured' ? 'selected' : ''}>${escapeHtml(tr('sortFeatured'))}</option>
                <option value="name" ${uiState.sortBy === 'name' ? 'selected' : ''}>${escapeHtml(tr('sortName'))}</option>
                <option value="costAsc" ${uiState.sortBy === 'costAsc' ? 'selected' : ''}>${escapeHtml(tr('sortCostAsc'))}</option>
                <option value="costDesc" ${uiState.sortBy === 'costDesc' ? 'selected' : ''}>${escapeHtml(tr('sortCostDesc'))}</option>
              </select>
            </div>
            <div class="field" style="justify-content: flex-end;">
              <button type="button" class="btn btn-ghost" id="resetFiltersBtn">
                ${escapeHtml(tr('resetBtn'))}
              </button>
            </div>
          </div>

          <div class="filter-actions-row">
            <div class="filter-tabs" id="categoryTabs"></div>
            <button
              type="button"
              class="filter-tab ${uiState.favoritesOnly ? 'active' : ''}"
              id="favToggleBtn"
              aria-pressed="${uiState.favoritesOnly ? 'true' : 'false'}"
            ></button>
          </div>

          <div class="card-grid" id="destinationCards"></div>
        </div>
      </section>

      <section class="section section-alt" id="map">
        <div class="container">
          <div class="map-layout">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('mapEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('mapTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('mapDesc'))}</p>
              <div class="region-list" id="regionList"></div>
            </div>

            <div class="map-canvas">
              <div id="interactiveMapContainer"></div>
              <div class="map-selected-bar" id="mapSelectedBar"></div>
              <p class="map-selected-bar" style="border-top: 0; margin-top: 8px; padding-top: 0; font-size: 0.75rem; color: var(--text-muted);">
                ${escapeHtml(tr('mapDisclaimer'))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="culinary">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('foodEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('foodTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('foodSub'))}</p>
            </div>
          </div>
          <div class="card-grid" id="foodCards"></div>
          <div class="advisory-note">${escapeHtml(tr('foodNotice'))}</div>
        </div>
      </section>

      <section class="section section-alt" id="stay">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('stayEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('stayTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('staySub'))}</p>
            </div>
          </div>
          <div class="card-grid" id="stayCards"></div>
          <div class="advisory-note">${escapeHtml(tr('stayNotice'))}</div>
        </div>
      </section>

      <div class="songket-divider" aria-hidden="true"></div>

      <section class="section" id="tradition">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('traditionEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('traditionTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('traditionSub'))}</p>
            </div>
          </div>
          <div id="culturalShowcaseMount"></div>
        </div>
      </section>

      <section class="section section-heritage-dark" id="game">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('gameEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('gameTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('gameSub'))}</p>
            </div>
          </div>
          <div class="game-arena" id="tourismGameArena"></div>
        </div>
      </section>

      <section class="section" id="planner">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('plannerEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('plannerTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('plannerSub'))}</p>
            </div>
          </div>

          <div class="two-panel-grid">
            <div class="panel">
              <h3 class="panel-title">${escapeHtml(tr('plannerFormTitle'))}</h3>
              <p class="panel-sub">${escapeHtml(tr('plannerFormSub'))}</p>

              <form id="itineraryForm" novalidate>
                <div class="form-grid">
                  <div class="field full">
                    <label for="tripName">${escapeHtml(tr('tripNameLabel'))}</label>
                    <input
                      id="tripName"
                      class="input"
                      type="text"
                      value="${escapeHtml(uiState.planner.name || tr('tripNameDefault'))}"
                      required
                    />
                  </div>
                  <div class="field">
                    <label for="tripDate">${escapeHtml(tr('tripDateLabel'))}</label>
                    <input
                      id="tripDate"
                      class="input"
                      type="date"
                      value="${escapeHtml(uiState.planner.date)}"
                    />
                  </div>
                  <div class="field">
                    <label for="tripDays">${escapeHtml(tr('tripDaysLabel'))}</label>
                    <select id="tripDays" class="select">
                      ${[1, 2, 3, 4, 5]
                        .map(
                          (d) =>
                            `<option value="${d}" ${Number(uiState.planner.days) === d ? 'selected' : ''}>${d}</option>`,
                        )
                        .join('')}
                    </select>
                  </div>
                  <div class="field full">
                    <label for="travelers">${escapeHtml(tr('travelersLabel'))}</label>
                    <input
                      id="travelers"
                      class="input tabular-nums"
                      type="number"
                      min="1"
                      max="30"
                      value="${Number(uiState.planner.travelers)}"
                    />
                  </div>
                  <div class="field full">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                      <label>${escapeHtml(tr('pickDestinationsLabel'))} (<span id="selectedDestCount" class="tabular-nums">0</span>)</label>
                      <button type="button" class="btn btn-ghost btn-sm" id="clearPickerBtn" style="min-height: 28px; padding: 4px 10px;">
                        ${escapeHtml(tr('clearSelectionBtn'))}
                      </button>
                    </div>
                    <div class="dest-picker-grid" id="destPickerGrid"></div>
                  </div>
                  <div class="field full">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                      ${escapeHtml(tr('buildSaveBtn'))}
                    </button>
                  </div>
                </div>
              </form>

              <div class="itinerary-result" id="itineraryOutput"></div>

              <div class="itinerary-result">
                <h4 style="font-size: 0.9375rem; margin-bottom: 10px;">${escapeHtml(tr('savedTripsTitle'))}</h4>
                <div class="saved-list" id="savedTripsList"></div>
              </div>
            </div>

            <div class="panel">
              <h3 class="panel-title">${escapeHtml(tr('budgetTitle'))}</h3>
              <p class="panel-sub">${escapeHtml(tr('budgetSub'))}</p>

              <div class="form-grid">
                <div class="field">
                  <label for="transportCost">${escapeHtml(tr('transportLabel'))}</label>
                  <input
                    id="transportCost"
                    class="input tabular-nums"
                    type="number"
                    min="0"
                    step="10000"
                    value="${Number(uiState.planner.transportCost)}"
                  />
                </div>
                <div class="field">
                  <label for="stayCost">${escapeHtml(tr('stayCostLabel'))}</label>
                  <input
                    id="stayCost"
                    class="input tabular-nums"
                    type="number"
                    min="0"
                    step="10000"
                    value="${Number(uiState.planner.stayCost)}"
                  />
                </div>
                <div class="field">
                  <label for="mealCost">${escapeHtml(tr('mealCostLabel'))}</label>
                  <input
                    id="mealCost"
                    class="input tabular-nums"
                    type="number"
                    min="0"
                    step="5000"
                    value="${Number(uiState.planner.mealCost)}"
                  />
                </div>
                <div class="field">
                  <label for="activityCost">${escapeHtml(tr('activityCostLabel'))}</label>
                  <input
                    id="activityCost"
                    class="input tabular-nums"
                    type="number"
                    min="0"
                    step="5000"
                    value="${Number(uiState.planner.activityCost)}"
                  />
                </div>
              </div>

              <div class="budget-summary-box">
                <span>${escapeHtml(tr('estimatedTotalLabel'))}</span>
                <strong class="tabular-nums" id="budgetTotal"></strong>
              </div>
              <p class="budget-breakdown tabular-nums" id="budgetBreakdown"></p>
              <div class="advisory-note" style="margin-top: 16px;">
                ${escapeHtml(tr('budgetNotice'))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-alt" id="packages">
        <div class="container">
          <div class="section-header">
            <div>
              <div class="section-eyebrow">${escapeHtml(tr('packagesEyebrow'))}</div>
              <h2 class="section-title">${escapeHtml(tr('packagesTitle'))}</h2>
              <p class="section-subtitle">${escapeHtml(tr('packagesSub'))}</p>
            </div>
          </div>

          <div class="two-panel-grid">
            <div class="panel">
              <h3 class="panel-title">${escapeHtml(tr('findPackageTitle'))}</h3>
              <div class="form-grid" style="margin-top: 14px; margin-bottom: 18px;">
                <div class="field">
                  <label for="interestFilter">${escapeHtml(tr('interestLabel'))}</label>
                  <select id="interestFilter" class="select">
                    <option value="all" ${uiState.packageFilter.interest === 'all' ? 'selected' : ''}>${escapeHtml(tr('allInterests'))}</option>
                    <option value="Religi" ${uiState.packageFilter.interest === 'Religi' ? 'selected' : ''}>Religi</option>
                    <option value="Alam" ${uiState.packageFilter.interest === 'Alam' ? 'selected' : ''}>Alam</option>
                    <option value="Bahari" ${uiState.packageFilter.interest === 'Bahari' ? 'selected' : ''}>Bahari</option>
                    <option value="Sejarah" ${uiState.packageFilter.interest === 'Sejarah' ? 'selected' : ''}>Sejarah</option>
                    <option value="Budaya" ${uiState.packageFilter.interest === 'Budaya' ? 'selected' : ''}>Budaya</option>
                    <option value="Kuliner" ${uiState.packageFilter.interest === 'Kuliner' ? 'selected' : ''}>Kuliner</option>
                  </select>
                </div>
                <div class="field">
                  <label for="maxBudgetFilter">${escapeHtml(tr('maxBudgetLabel'))}</label>
                  <input
                    id="maxBudgetFilter"
                    class="input tabular-nums"
                    type="number"
                    min="0"
                    step="50000"
                    value="${Number(uiState.packageFilter.maxBudget)}"
                  />
                </div>
              </div>
              <div class="list-stack" id="recommendationOutput"></div>
            </div>

            <div class="panel">
              <h3 class="panel-title">${escapeHtml(tr('samplePackagesTitle'))}</h3>
              <div class="list-stack" id="packageCatalogList" style="margin-top: 14px;"></div>
            </div>
          </div>
        </div>
      </section>

      ${
        showCatalogManager
          ? `
        <section class="section" id="admin">
          <div class="container">
            <div class="section-header">
              <div>
                <div class="section-eyebrow">${escapeHtml(tr('adminEyebrow'))}</div>
                <h2 class="section-title">${escapeHtml(isAdmin() ? tr('adminTitle') : tr('operatorTitle'))}</h2>
                <p class="section-subtitle">${escapeHtml(isAdmin() ? tr('adminSub') : tr('operatorSub'))}</p>
              </div>
              <span class="section-meta-note">${escapeHtml(roleLabel(user.role))}</span>
            </div>

            <div class="panel">
              <div class="admin-toolbar">
                <div class="segmented" role="tablist" aria-label="Catalog entity type">
                  ${['destinations', 'foods', 'stays', 'packages']
                    .map((typeKey) => {
                      const labelMap = {
                        destinations: tr('adminDestinations'),
                        foods: tr('adminFoods'),
                        stays: tr('adminStays'),
                        packages: tr('adminPackages'),
                      };
                      const active = uiState.adminType === typeKey;
                      return `<button type="button" role="tab" class="segmented-btn ${active ? 'active' : ''}" aria-selected="${active ? 'true' : 'false'}" data-admin-tab="${typeKey}">${escapeHtml(labelMap[typeKey])}</button>`;
                    })
                    .join('')}
                </div>

                <div class="admin-actions">
                  <button type="button" class="btn btn-primary btn-sm" id="adminAddBtn">
                    ${escapeHtml(tr('addDataBtn'))}
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm" id="exportJsonBtn">
                    ${escapeHtml(tr('exportJsonBtn'))}
                  </button>
                  ${
                    isAdmin()
                      ? `<button type="button" class="btn btn-ghost btn-sm" id="resetDemoBtn">
                          ${escapeHtml(tr('resetDemoBtn'))}
                        </button>`
                      : ''
                  }
                </div>
              </div>

              <div class="list-stack" id="adminList"></div>
            </div>
          </div>
        </section>
      `
          : ''
      }

      ${
        showUserManager
          ? `
        <section class="section section-alt" id="users">
          <div class="container">
            <div class="section-header">
              <div>
                <div class="section-eyebrow">${escapeHtml(tr('usersEyebrow'))}</div>
                <h2 class="section-title">${escapeHtml(tr('usersTitle'))}</h2>
                <p class="section-subtitle">${escapeHtml(tr('usersSub'))}</p>
              </div>
              <span class="section-meta-note tabular-nums" id="userCountNote"></span>
            </div>

            <div class="two-panel-grid">
              <div class="panel">
                <h3 class="panel-title">${escapeHtml(tr('createUserTitle'))}</h3>
                <form id="createUserForm" style="margin-top: 16px;" novalidate>
                  <div class="form-grid">
                    <div class="field full">
                      <label for="newUserName">${escapeHtml(tr('authNameLabel'))}</label>
                      <input id="newUserName" name="name" type="text" class="input" required />
                    </div>
                    <div class="field full">
                      <label for="newUserEmail">${escapeHtml(tr('authEmailLabel'))}</label>
                      <input id="newUserEmail" name="email" type="email" class="input" required />
                    </div>
                    <div class="field">
                      <label for="newUserPassword">${escapeHtml(tr('authPasswordLabel'))}</label>
                      <input id="newUserPassword" name="password" type="password" class="input" placeholder="${escapeHtml(tr('authPasswordPlaceholder'))}" required />
                    </div>
                    <div class="field">
                      <label for="newUserRole">${escapeHtml(tr('userRoleLabel'))}</label>
                      <select id="newUserRole" name="role" class="select">
                        <option value="operator">${escapeHtml(tr('roleOperatorLabel'))}</option>
                        <option value="user">${escapeHtml(tr('roleUserLabel'))}</option>
                      </select>
                    </div>
                    <div class="field full">
                      <button type="submit" class="btn btn-primary" style="width: 100%;">
                        ${escapeHtml(tr('createUserBtn'))}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div class="panel">
                <h3 class="panel-title">${escapeHtml(tr('registeredUsersTitle'))}</h3>
                <div class="list-stack" id="managedUsersList" style="margin-top: 16px;"></div>
              </div>
            </div>
          </div>
        </section>
      `
          : ''
      }
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">Wonderful <span>Aceh</span></div>
            <p class="footer-copy">${escapeHtml(tr('footerDesc'))}</p>
          </div>
          <div class="footer-col">
            <h3>${escapeHtml(tr('footerExplore'))}</h3>
            <a href="#photo-locator">${escapeHtml(tr('navLocator'))}</a>
            <a href="#destinations">${escapeHtml(tr('navDest'))}</a>
            <a href="#map">${escapeHtml(tr('navMap'))}</a>
            <a href="#tradition">${escapeHtml(tr('navTradition'))}</a>
            <a href="#game">${escapeHtml(tr('navGame'))}</a>
          </div>
          <div class="footer-col">
            <h3>${escapeHtml(tr('footerPlan'))}</h3>
            <a href="#planner">${escapeHtml(tr('navPlan'))}</a>
            <a href="#packages">${escapeHtml(tr('packagesTitle'))}</a>
            ${showCatalogManager ? `<a href="#admin">${escapeHtml(tr('navManage'))}</a>` : ''}
            ${showUserManager ? `<a href="#users">${escapeHtml(tr('navUsers'))}</a>` : ''}
          </div>
          <div class="footer-col">
            <h3>${lang() === 'en' ? 'Language' : 'Bahasa'}</h3>
            <div class="segmented" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2);">
              <button
                type="button"
                class="segmented-btn ${lang() === 'id' ? 'active' : ''}"
                aria-pressed="${lang() === 'id' ? 'true' : 'false'}"
                data-set-lang="id"
                style="${lang() === 'id' ? '' : 'color: #d6e8e0;'}"
              >ID</button>
              <button
                type="button"
                class="segmented-btn ${lang() === 'en' ? 'active' : ''}"
                aria-pressed="${lang() === 'en' ? 'true' : 'false'}"
                data-set-lang="en"
                style="${lang() === 'en' ? '' : 'color: #d6e8e0;'}"
              >EN</button>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 ${escapeHtml(tr('footerCopyright'))}</span>
        </div>
      </div>
    </footer>
  `;

  bindShellEvents();
  refreshDynamicViews();
}

function renderHeroKpis() {
  const container = document.getElementById('heroKpis');
  if (!container) return;

  const regionCount = new Set(appState.destinations.map((d) => d.region)).size;
  container.innerHTML = `
    <div class="kpi-cell">
      <strong class="tabular-nums">${regionCount}</strong>
      <span>${escapeHtml(tr('statRegionsLabel'))}</span>
    </div>
    <div class="kpi-cell">
      <strong class="tabular-nums">${appState.destinations.length}</strong>
      <span>${escapeHtml(tr('statDestLabel'))}</span>
    </div>
    <div class="kpi-cell">
      <strong class="tabular-nums">1–5</strong>
      <span>${escapeHtml(tr('statDaysLabel'))}</span>
    </div>
    <div class="kpi-cell">
      <strong>${escapeHtml(roleLabel(appState.currentUser?.role || 'user'))}</strong>
      <span>${escapeHtml(tr('activeRolePrefix').replace(':', ''))}</span>
    </div>
  `;
}

function renderFilterControls() {
  const regionSelect = document.getElementById('regionFilter');
  const categorySelect = document.getElementById('categoryFilter');
  const tabsContainer = document.getElementById('categoryTabs');
  const favToggleBtn = document.getElementById('favToggleBtn');

  const regions = [...new Set(appState.destinations.map((d) => d.region))].sort();
  const categories = [...new Set(appState.destinations.map((d) => d.category))].sort();

  if (regionSelect) {
    regionSelect.innerHTML = `
      <option value="">${escapeHtml(tr('allRegions'))}</option>
      ${regions
        .map(
          (r) =>
            `<option value="${escapeHtml(r)}" ${uiState.selectedRegion === r ? 'selected' : ''}>${escapeHtml(r)}</option>`,
        )
        .join('')}
    `;
  }

  if (categorySelect) {
    categorySelect.innerHTML = `
      <option value="">${escapeHtml(tr('allCategories'))}</option>
      ${categories
        .map(
          (c) =>
            `<option value="${escapeHtml(c)}" ${uiState.selectedCategory === c ? 'selected' : ''}>${escapeHtml(c)}</option>`,
        )
        .join('')}
    `;
  }

  if (tabsContainer) {
    const allTabs = ['', ...categories];
    tabsContainer.innerHTML = allTabs
      .map((cat) => {
        const label = cat === '' ? tr('allTab') : cat;
        const active = uiState.selectedCategory === cat;
        return `<button type="button" class="filter-tab ${active ? 'active' : ''}" data-filter-cat="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
      })
      .join('');
  }

  if (favToggleBtn) {
    favToggleBtn.textContent = `${tr('favFilterBtn')} (${appState.favorites.length})`;
    favToggleBtn.classList.toggle('active', uiState.favoritesOnly);
    favToggleBtn.setAttribute('aria-pressed', uiState.favoritesOnly ? 'true' : 'false');
  }
}

function renderDestinations() {
  const grid = document.getElementById('destinationCards');
  const countNote = document.getElementById('destCountNote');
  if (!grid) return;

  const query = uiState.searchQuery.trim().toLowerCase();
  const region = uiState.selectedRegion;
  const category = uiState.selectedCategory;

  const filtered = appState.destinations
    .filter((d) => {
      const descText = lang() === 'en' && d.descEn ? d.descEn : d.desc;
      const matchesQuery =
        !query ||
        `${d.name} ${descText} ${d.region} ${d.category} ${d.address}`
          .toLowerCase()
          .includes(query);
      const matchesRegion = !region || d.region === region;
      const matchesCategory = !category || d.category === category;
      const matchesFav = !uiState.favoritesOnly || isFavorite(d.id);
      return matchesQuery && matchesRegion && matchesCategory && matchesFav;
    })
    .sort((a, b) => {
      if (uiState.sortBy === 'name') return a.name.localeCompare(b.name);
      if (uiState.sortBy === 'costAsc') return Number(a.cost) - Number(b.cost);
      if (uiState.sortBy === 'costDesc') return Number(b.cost) - Number(a.cost);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });

  if (countNote) {
    countNote.textContent = `${filtered.length} ${tr('destCountLabel')}`;
  }

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>${escapeHtml(tr('noDestinations'))}</p>
        <button type="button" class="btn btn-secondary btn-sm" id="emptyResetBtn">
          ${escapeHtml(tr('resetFiltersCta'))}
        </button>
      </div>
    `;
    document.getElementById('emptyResetBtn')?.addEventListener('click', resetDestinationFilters);
    return;
  }

  grid.innerHTML = filtered
    .map((dest) => {
      const fav = isFavorite(dest.id);
      const description = lang() === 'en' && dest.descEn ? dest.descEn : dest.desc;
      const priceText =
        Number(dest.cost) === 0
          ? tr('freeLabel')
          : `${tr('startsFrom')} ${formatRupiah(dest.cost)}*`;

      return `
        <article class="card">
          <div class="card-media">
            ${renderCardArtwork(dest.visualKey || 'lake', dest.name, dest)}
            <button
              type="button"
              class="card-favorite-btn"
              aria-pressed="${fav ? 'true' : 'false'}"
              aria-label="${escapeHtml(fav ? tr('removeFavAria') : tr('addFavAria'))}"
              data-fav-id="${escapeHtml(dest.id)}"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>${escapeHtml(dest.category)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(dest.region)}</span>
            </div>
            <h3 class="card-title">${escapeHtml(dest.name)}</h3>
            <p class="card-desc">${escapeHtml(description)}</p>
            <div class="card-footer">
              <span class="card-price tabular-nums">${escapeHtml(priceText)}</span>
              <button type="button" class="btn btn-ghost btn-sm" data-detail-id="${escapeHtml(dest.id)}">
                ${escapeHtml(tr('detailBtn'))}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderMapSection() {
  const regionListEl = document.getElementById('regionList');
  const mapContainerEl = document.getElementById('interactiveMapContainer');
  const mapSelectedBar = document.getElementById('mapSelectedBar');
  if (!regionListEl || !mapContainerEl || !mapSelectedBar) return;

  regionListEl.innerHTML = ACEH_REGIONS.map((region) => {
    const count = appState.destinations.filter((d) => d.region === region.name).length;
    const isActive = region.name === uiState.activeMapRegion;
    const summary = lang() === 'en' ? region.summaryEn : region.summaryId;

    return `
      <button
        type="button"
        class="region-item ${isActive ? 'active' : ''}"
        data-select-region="${escapeHtml(region.name)}"
      >
        <div>
          <strong>${escapeHtml(region.name)}</strong>
          <span>${escapeHtml(summary)}</span>
        </div>
        <span class="region-count tabular-nums">${count} ${escapeHtml(tr('destUnit'))}</span>
      </button>
    `;
  }).join('');

  mapContainerEl.innerHTML = renderInteractiveAcehMap(ACEH_REGIONS, uiState.activeMapRegion);

  const activeRegionObj =
    ACEH_REGIONS.find((r) => r.name === uiState.activeMapRegion) || ACEH_REGIONS[0];
  const activeSummary =
    lang() === 'en' ? activeRegionObj.summaryEn : activeRegionObj.summaryId;

  const regionPhotoMap = {
    'Banda Aceh': PHOTO_ASSETS.byItemId.d1,
    Sabang: PHOTO_ASSETS.byItemId.d6,
    'Aceh Besar': PHOTO_ASSETS.byItemId.d4,
    'Aceh Tengah': PHOTO_ASSETS.byItemId.d8,
    'Bener Meriah': PHOTO_ASSETS.byItemId.d11,
  };
  const regionImg = regionPhotoMap[activeRegionObj.name] || PHOTO_ASSETS.hero;

  mapSelectedBar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 240px;">
      <img
        src="${escapeHtml(regionImg)}"
        alt="${escapeHtml(activeRegionObj.name)}"
        class="map-selected-thumb"
        referrerPolicy="no-referrer"
      />
      <div>
        <strong style="display: block; font-size: 0.9375rem; color: var(--text-primary);">
          ${escapeHtml(tr('mapSelectedPrefix'))} ${escapeHtml(activeRegionObj.name)}
        </strong>
        <p>${escapeHtml(activeSummary)}</p>
      </div>
    </div>
    <button type="button" class="btn btn-secondary btn-sm" id="applyMapRegionBtn">
      ${escapeHtml(tr('mapFilterBtn'))}
    </button>
  `;

  document.getElementById('applyMapRegionBtn')?.addEventListener('click', () => {
    uiState.selectedRegion = activeRegionObj.name;
    uiState.favoritesOnly = false;
    renderFilterControls();
    renderDestinations();
    document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function renderFoods() {
  const container = document.getElementById('foodCards');
  if (!container) return;

  if (!appState.foods.length) {
    container.innerHTML = `<div class="empty-state"><p>${escapeHtml(tr('emptyList'))}</p></div>`;
    return;
  }

  container.innerHTML = appState.foods
    .map((food) => {
      const waText = encodeURIComponent(
        `Halo, saya ingin bertanya tentang ${food.name} (Wonderful Aceh).`,
      );
      const waUrl = `https://wa.me/${encodeURIComponent(food.contact || '6280000000000')}?text=${waText}`;

      return `
        <article class="card">
          <div class="card-media">
            ${renderCardArtwork(food.visualKey || 'noodle', food.name, food)}
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>${escapeHtml(food.category)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(food.region)}</span>
            </div>
            <h3 class="card-title">${escapeHtml(food.name)}</h3>
            <p class="card-desc">${escapeHtml(food.source || '')}</p>
            <div class="card-status-line">
              ${escapeHtml(tr('halalStatusPrefix'))} ${escapeHtml(food.halal || 'Belum diverifikasi')}
            </div>
            <div class="card-footer">
              <span class="card-price tabular-nums">${escapeHtml(formatRupiah(food.price))}*</span>
              <a
                class="btn btn-ghost btn-sm"
                href="${waUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${escapeHtml(tr('whatsappBtn'))}
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderStays() {
  const container = document.getElementById('stayCards');
  if (!container) return;

  if (!appState.stays.length) {
    container.innerHTML = `<div class="empty-state"><p>${escapeHtml(tr('emptyList'))}</p></div>`;
    return;
  }

  container.innerHTML = appState.stays
    .map((stay) => {
      const waText = encodeURIComponent(
        `Halo, saya ingin bertanya tentang ${stay.name} (Wonderful Aceh).`,
      );
      const waUrl = `https://wa.me/${encodeURIComponent(stay.contact || '6280000000000')}?text=${waText}`;

      return `
        <article class="card">
          <div class="card-media">
            ${renderCardArtwork(stay.visualKey || 'stayUrban', stay.name, stay)}
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>${escapeHtml(tr('navStay'))}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(stay.region)}</span>
            </div>
            <h3 class="card-title">${escapeHtml(stay.name)}</h3>
            <p class="card-desc">
              <strong>${escapeHtml(tr('stayMuslimLabel'))}:</strong> ${(stay.muslim || []).map(escapeHtml).join(' · ')}<br />
              <span style="color: var(--text-muted);">${escapeHtml(tr('stayFacilitiesLabel'))}: ${(stay.facilities || []).map(escapeHtml).join(', ')}</span>
            </p>
            <div class="card-footer">
              <span class="card-price tabular-nums">${escapeHtml(formatRupiah(stay.price))}${escapeHtml(tr('stayPerNight'))}</span>
              <a
                class="btn btn-ghost btn-sm"
                href="${waUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${escapeHtml(tr('whatsappBtn'))}
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderDestinationPicker() {
  const grid = document.getElementById('destPickerGrid');
  const countEl = document.getElementById('selectedDestCount');
  if (!grid) return;

  const selectedSet = new Set(uiState.planner.selectedDestinationIds);
  if (countEl) {
    countEl.textContent = String(selectedSet.size);
  }

  grid.innerHTML = appState.destinations
    .map((d) => {
      const checked = selectedSet.has(d.id);
      return `
        <label class="dest-pick-item">
          <input type="checkbox" value="${escapeHtml(d.id)}" ${checked ? 'checked' : ''} data-pick-dest />
          <span>
            <strong>${escapeHtml(d.name)}</strong>
            <span>${escapeHtml(d.region)} · ${escapeHtml(d.category)}</span>
          </span>
        </label>
      `;
    })
    .join('');
}

function renderBudgetSummary() {
  const totalEl = document.getElementById('budgetTotal');
  const breakdownEl = document.getElementById('budgetBreakdown');
  if (!totalEl || !breakdownEl) return;

  const b = calculateBudgetTotal();
  totalEl.textContent = formatRupiah(b.total);

  if (lang() === 'en') {
    breakdownEl.textContent = `Transport ${formatRupiah(b.transport)} · Stay (${Math.max(0, b.days - 1)} nights) ${formatRupiah(b.stayTotal)} · Meals ${formatRupiah(b.mealTotal)} · Activities ${formatRupiah(b.activityTotal)} (${b.travelers} travelers).`;
  } else {
    breakdownEl.textContent = `Transportasi ${formatRupiah(b.transport)} · Akomodasi (${Math.max(0, b.days - 1)} malam) ${formatRupiah(b.stayTotal)} · Konsumsi ${formatRupiah(b.mealTotal)} · Aktivitas ${formatRupiah(b.activityTotal)} (${b.travelers} wisatawan).`;
  }
}

function renderGeneratedItinerary() {
  const output = document.getElementById('itineraryOutput');
  if (!output) return;

  const item = uiState.planner.lastGeneratedItinerary;
  if (!item) {
    output.innerHTML = '';
    return;
  }

  output.innerHTML = `
    <div style="margin-bottom: 12px;">
      <strong style="font-size: 0.9375rem; color: var(--text-primary);">${escapeHtml(item.name)}</strong>
      <span style="display: block; font-size: 0.8125rem; color: var(--text-muted);">
        ${item.days} ${escapeHtml(tr('daysUnit'))} · ${item.people} ${escapeHtml(tr('travelersLabel').toLowerCase())} · ${escapeHtml(item.date || '')}
      </span>
    </div>
    ${item.activities
      .map(
        (dayPlan) => `
      <div class="day-row">
        <strong>${escapeHtml(tr('dayLabel'))} ${dayPlan.day}</strong>
        <span style="text-align: right; color: var(--text-secondary);">
          ${dayPlan.items.length ? dayPlan.items.map(escapeHtml).join(' → ') : escapeHtml(tr('freeTimeLabel'))}
        </span>
      </div>
    `,
      )
      .join('')}
    <div class="budget-summary-box" style="margin-top: 14px;">
      <span>${escapeHtml(tr('estimatedTotalLabel'))}</span>
      <strong class="tabular-nums">${escapeHtml(formatRupiah(item.total))}</strong>
    </div>
  `;
}

function renderSavedTrips() {
  const container = document.getElementById('savedTripsList');
  if (!container) return;

  if (!appState.savedItineraries.length) {
    container.innerHTML = `<p style="font-size: 0.8125rem; color: var(--text-muted);">${escapeHtml(tr('noSavedTrips'))}</p>`;
    return;
  }

  container.innerHTML = appState.savedItineraries
    .map(
      (trip) => `
      <div class="saved-item">
        <div>
          <strong>${escapeHtml(trip.name)}</strong>
          <span class="tabular-nums">${trip.days} ${escapeHtml(tr('daysUnit'))} · ${trip.people} pax · ${escapeHtml(formatRupiah(trip.total))}</span>
        </div>
        <div class="list-row-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-load-trip="${escapeHtml(trip.id)}">
            ${escapeHtml(tr('loadTripBtn'))}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-delete-trip="${escapeHtml(trip.id)}">
            ${escapeHtml(tr('deleteTripBtn'))}
          </button>
        </div>
      </div>
    `,
    )
    .join('');
}

function renderPackages() {
  const recContainer = document.getElementById('recommendationOutput');
  const catalogContainer = document.getElementById('packageCatalogList');
  if (!recContainer || !catalogContainer) return;

  const interest = uiState.packageFilter.interest;
  const maxBudget = Math.max(0, Number(uiState.packageFilter.maxBudget || 0));

  const matched = appState.packages.filter((pkg) => {
    const matchesInterest =
      interest === 'all' ||
      pkg.interest === interest ||
      (pkg.destinations || []).some(
        (id) => appState.destinations.find((d) => d.id === id)?.category === interest,
      );
    const matchesBudget = Number(pkg.cost) <= maxBudget;
    return matchesInterest && matchesBudget;
  });

  if (!matched.length) {
    recContainer.innerHTML = `<div class="empty-state" style="padding: 24px;"><p style="margin: 0;">${escapeHtml(tr('noMatchingPackages'))}</p></div>`;
  } else {
    recContainer.innerHTML = matched
      .map(
        (pkg) => `
        <div class="list-row">
          <div class="list-row-info">
            <strong>${escapeHtml(pkg.name)}</strong>
            <span>${pkg.days} ${escapeHtml(tr('daysUnit'))} · ${escapeHtml(pkg.desc)}</span>
          </div>
          <div class="list-row-actions">
            <strong class="tabular-nums" style="color: var(--accent-primary);">${escapeHtml(formatRupiah(pkg.cost))}</strong>
            <button type="button" class="btn btn-primary btn-sm" data-use-package="${escapeHtml(pkg.id)}">
              ${escapeHtml(tr('usePackageBtn'))}
            </button>
          </div>
        </div>
      `,
      )
      .join('');
  }

  catalogContainer.innerHTML = appState.packages
    .map(
      (pkg) => `
      <div class="list-row">
        <div class="list-row-info">
          <strong>${escapeHtml(pkg.name)}</strong>
          <span>${pkg.days} ${escapeHtml(tr('daysUnit'))} · ${escapeHtml(pkg.interest)} · ${(pkg.destinations || []).length} ${escapeHtml(tr('destUnit'))}</span>
        </div>
        <strong class="tabular-nums" style="color: var(--accent-primary);">${escapeHtml(formatRupiah(pkg.cost))}</strong>
      </div>
    `,
    )
    .join('');
}

function renderAdminList() {
  const container = document.getElementById('adminList');
  if (!container || !canManageCatalog()) return;

  const type = uiState.adminType;
  const items = appState[type] || [];

  if (!items.length) {
    container.innerHTML = `<div class="empty-state" style="padding: 28px;"><p style="margin: 0;">${escapeHtml(tr('emptyList'))}</p></div>`;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const meta =
        type === 'destinations'
          ? `${item.region} · ${item.category} · ${formatRupiah(item.cost)}`
          : type === 'packages'
            ? `${item.days} ${tr('daysUnit')} · ${item.interest} · ${formatRupiah(item.cost)}`
            : `${item.region} · ${formatRupiah(item.price)}`;

      return `
        <div class="list-row">
          <div class="list-row-info">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="tabular-nums">${escapeHtml(meta)}</span>
          </div>
          <div class="list-row-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-admin-edit="${escapeHtml(item.id)}">
              ${escapeHtml(tr('editBtn'))}
            </button>
            <button type="button" class="btn btn-danger btn-sm" data-admin-delete="${escapeHtml(item.id)}">
              ${escapeHtml(tr('deleteBtn'))}
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderManagedUsers() {
  const listEl = document.getElementById('managedUsersList');
  const countEl = document.getElementById('userCountNote');
  if (!listEl || !isAdmin()) return;

  if (countEl) {
    countEl.textContent = `${appState.managedUsers.length} akun`;
  }

  if (!appState.managedUsers.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding: 24px;"><p style="margin: 0;">${escapeHtml(tr('emptyList'))}</p></div>`;
    return;
  }

  listEl.innerHTML = appState.managedUsers
    .map((u) => {
      const isSelf = u.id === appState.currentUser?.id;
      const isOtherAdmin = u.role === 'admin';
      const nextRole = u.role === 'operator' ? 'user' : 'operator';
      const toggleLabel =
        u.role === 'operator' ? tr('demoteUserBtn') : tr('promoteOperatorBtn');

      return `
        <div class="list-row">
          <div class="list-row-info">
            <strong>${escapeHtml(u.name)}</strong>
            <span>${escapeHtml(u.email)} · ${escapeHtml(roleLabel(u.role))}</span>
          </div>
          <div class="list-row-actions">
            ${
              !isSelf && !isOtherAdmin
                ? `
                <button type="button" class="btn btn-secondary btn-sm" data-user-role-id="${escapeHtml(u.id)}" data-next-role="${nextRole}">
                  ${escapeHtml(toggleLabel)}
                </button>
                <button type="button" class="btn btn-danger btn-sm" data-user-delete-id="${escapeHtml(u.id)}">
                  ${escapeHtml(tr('deleteBtn'))}
                </button>
              `
                : `<span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(roleLabel(u.role))}</span>`
            }
          </div>
        </div>
      `;
    })
    .join('');
}

function openDestinationDetailModal(destId) {
  const dest = appState.destinations.find((d) => d.id === destId);
  if (!dest) return;

  const fav = isFavorite(dest.id);
  const desc = lang() === 'en' && dest.descEn ? dest.descEn : dest.desc;
  const costText = Number(dest.cost) === 0 ? tr('freeLabel') : formatRupiah(dest.cost);

  openModal(
    `
      <div class="modal-photo-frame">
        ${renderCardArtwork(dest.visualKey || 'lake', dest.name, dest)}
      </div>
      <div class="section-eyebrow" style="margin-bottom: 6px;">${escapeHtml(dest.category)} · ${escapeHtml(dest.region)}</div>
      <h2 id="modal-heading" class="modal-title">${escapeHtml(dest.name)}</h2>
      <p style="color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.65;">${escapeHtml(desc)}</p>

      <dl class="detail-specs">
        <div class="detail-spec">
          <dt>${escapeHtml(tr('modalAddress'))}</dt>
          <dd>${escapeHtml(dest.address)}</dd>
        </div>
        <div class="detail-spec">
          <dt>${escapeHtml(tr('modalCost'))}</dt>
          <dd class="tabular-nums">${escapeHtml(costText)}</dd>
        </div>
        <div class="detail-spec">
          <dt>${escapeHtml(tr('modalFacilities'))}</dt>
          <dd>${(dest.facilities || []).map(escapeHtml).join(', ') || '-'}</dd>
        </div>
        <div class="detail-spec">
          <dt>${escapeHtml(tr('modalPrayer'))}</dt>
          <dd>${escapeHtml(dest.prayer || '-')}</dd>
        </div>
      </dl>

      <div class="advisory-note" style="margin-top: 0;">${escapeHtml(tr('modalDetailNotice'))}</div>

      <div class="modal-footer-actions">
        <a
          class="btn btn-primary"
          href="${escapeHtml(sanitizeUrl(dest.maps))}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${escapeHtml(tr('openMapsBtn'))}
        </a>
        <button type="button" class="btn btn-secondary" data-modal-fav="${escapeHtml(dest.id)}">
          ${escapeHtml(fav ? tr('removeFavAria') : tr('addFavAria'))}
        </button>
      </div>
    `,
    (dialog) => {
      dialog.querySelector('[data-modal-fav]')?.addEventListener('click', async () => {
        await toggleFavorite(dest.id);
        openDestinationDetailModal(dest.id);
      });
    },
  );
}

function openAdminItemModal(editId = null) {
  if (!canManageCatalog()) return;
  const type = uiState.adminType;
  const list = appState[type];
  const existing = editId ? list.find((item) => item.id === editId) : null;

  const schemas = {
    destinations: [
      { key: 'name', label: 'Nama Destinasi / Name', type: 'text', required: true, full: true },
      { key: 'category', label: 'Kategori / Category', type: 'select', options: ['Religi', 'Sejarah', 'Bahari', 'Alam', 'Budaya', 'Kuliner'] },
      { key: 'region', label: 'Wilayah / Region', type: 'select', options: ACEH_REGIONS.map((r) => r.name) },
      { key: 'cost', label: 'Estimasi Biaya (Rp)', type: 'number', min: 0 },
      { key: 'address', label: 'Alamat / Address', type: 'text' },
      { key: 'desc', label: 'Deskripsi / Description', type: 'textarea', full: true },
      { key: 'prayer', label: 'Fasilitas Ibadah', type: 'text', full: true },
      { key: 'facilities', label: 'Fasilitas (pisahkan dengan koma)', type: 'text', full: true },
      { key: 'maps', label: 'Tautan Google Maps (opsional)', type: 'url', full: true },
    ],
    foods: [
      { key: 'name', label: 'Nama Kuliner / Produk', type: 'text', required: true, full: true },
      { key: 'category', label: 'Kategori', type: 'select', options: ['Kuliner khas', 'Produk UMKM'] },
      { key: 'region', label: 'Wilayah', type: 'select', options: ACEH_REGIONS.map((r) => r.name) },
      { key: 'price', label: 'Perkiraan Harga (Rp)', type: 'number', min: 0 },
      { key: 'contact', label: 'Nomor WhatsApp (628...)', type: 'text' },
      { key: 'halal', label: 'Status Halal', type: 'text' },
      { key: 'source', label: 'Catatan Sumber / Verifikasi', type: 'textarea', full: true },
    ],
    stays: [
      { key: 'name', label: 'Nama Akomodasi', type: 'text', required: true, full: true },
      { key: 'region', label: 'Wilayah', type: 'select', options: ACEH_REGIONS.map((r) => r.name) },
      { key: 'price', label: 'Tarif per Malam (Rp)', type: 'number', min: 0 },
      { key: 'contact', label: 'Nomor WhatsApp (628...)', type: 'text' },
      { key: 'facilities', label: 'Fasilitas Umum (pisahkan dengan koma)', type: 'text', full: true },
      { key: 'muslim', label: 'Informasi Ramah Muslim (pisahkan dengan koma)', type: 'text', full: true },
    ],
    packages: [
      { key: 'name', label: 'Nama Paket', type: 'text', required: true, full: true },
      { key: 'interest', label: 'Minat Utama', type: 'select', options: ['Religi', 'Alam', 'Bahari', 'Sejarah', 'Budaya', 'Kuliner'] },
      { key: 'days', label: 'Durasi (hari)', type: 'number', min: 1 },
      { key: 'cost', label: 'Estimasi Biaya (Rp)', type: 'number', min: 0 },
      { key: 'desc', label: 'Ringkasan Paket', type: 'textarea', full: true },
      { key: 'destinations', label: 'ID Destinasi (contoh: d1, d2)', type: 'text', full: true },
    ],
  };

  const fields = schemas[type] || schemas.destinations;
  const titlePrefix = existing ? tr('editBtn') : tr('addDataBtn');

  const formFieldsHtml = fields
    .map((f) => {
      const rawVal = existing ? existing[f.key] : f.key === 'halal' ? 'Belum diverifikasi' : '';
      const val = Array.isArray(rawVal) ? rawVal.join(', ') : (rawVal ?? '');

      let inputHtml = '';
      if (f.type === 'select') {
        inputHtml = `
          <select name="${f.key}" class="select">
            ${f.options
              .map(
                (opt) =>
                  `<option value="${escapeHtml(opt)}" ${val === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`,
              )
              .join('')}
          </select>
        `;
      } else if (f.type === 'textarea') {
        inputHtml = `<textarea name="${f.key}" class="textarea">${escapeHtml(val)}</textarea>`;
      } else {
        inputHtml = `<input name="${f.key}" class="input" type="${f.type}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.required ? 'required' : ''} value="${escapeHtml(val)}" />`;
      }

      return `
        <div class="field ${f.full ? 'full' : ''}">
          <label>${escapeHtml(f.label)}</label>
          ${inputHtml}
        </div>
      `;
    })
    .join('');

  openModal(
    `
      <h2 id="modal-heading" class="modal-title">${escapeHtml(titlePrefix)}</h2>
      <form id="adminRecordForm">
        <div class="form-grid">${formFieldsHtml}</div>
        <div class="modal-footer-actions">
          <button type="submit" class="btn btn-primary">${escapeHtml(tr('saveBtn'))}</button>
          <button type="button" class="btn btn-ghost" data-admin-cancel>${escapeHtml(tr('cancelBtn'))}</button>
        </div>
      </form>
    `,
    (dialog) => {
      dialog.querySelector('[data-admin-cancel]')?.addEventListener('click', closeModal);
      dialog.querySelector('#adminRecordForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const record = {};

        for (const [k, v] of formData.entries()) {
          if (['facilities', 'muslim', 'destinations'].includes(k)) {
            record[k] = String(v)
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean);
          } else if (['cost', 'price', 'days'].includes(k)) {
            record[k] = Math.max(0, Number(v || 0));
          } else {
            record[k] = String(v).trim();
          }
        }

        if (!record.name) return;

        try {
          if (existing) {
            const res = await api.updateCatalogItem(type, existing.id, record);
            const idx = appState[type].findIndex((x) => x.id === existing.id);
            if (idx >= 0) appState[type][idx] = res.item;
          } else {
            const res = await api.createCatalogItem(type, record);
            appState[type].unshift(res.item);
          }
          closeModal();
          refreshDynamicViews();
          showToast(tr('toastDataSaved'));
        } catch (err) {
          if (!handleUnauthorizedError(err)) {
            showToast(err.message, 'error');
          }
        }
      });
    },
  );
}

async function toggleFavorite(destId) {
  const idx = appState.favorites.findIndex(
    (f) => f.itemId === destId && f.type === 'destination',
  );
  if (idx >= 0) {
    appState.favorites.splice(idx, 1);
  } else {
    appState.favorites.push({
      id: `fav-${Date.now()}`,
      itemId: destId,
      type: 'destination',
      date: new Date().toISOString(),
    });
  }

  renderFilterControls();
  renderDestinations();

  try {
    await api.saveFavorites(appState.favorites);
  } catch (err) {
    handleUnauthorizedError(err);
  }
}

function resetDestinationFilters() {
  uiState.searchQuery = '';
  uiState.selectedRegion = '';
  uiState.selectedCategory = '';
  uiState.sortBy = 'featured';
  uiState.favoritesOnly = false;

  const searchInput = document.getElementById('searchInput');
  const sortFilter = document.getElementById('sortFilter');
  if (searchInput) searchInput.value = '';
  if (sortFilter) sortFilter.value = 'featured';

  renderFilterControls();
  renderDestinations();
}

function refreshDynamicViews() {
  renderHeroKpis();
  photoLocator.render();
  renderFilterControls();
  renderDestinations();
  renderMapSection();
  renderFoods();
  renderStays();
  culturalShowcase.render();
  tourismGame.render();
  renderDestinationPicker();
  renderBudgetSummary();
  renderGeneratedItinerary();
  renderSavedTrips();
  renderPackages();
  renderAdminList();
  renderManagedUsers();
}

function logout() {
  tourismGame.cleanup();
  culturalShowcase.cleanup();
  photoLocator.reset();
  clearAuthToken();
  appState.currentUser = null;
  appState.managedUsers = [];
  uiState.mobileMenuOpen = false;
  showToast(tr('authLoggedOutToast'));
  bootstrapAuth();
}

function bindShellEvents() {
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('mobileLogoutBtn')?.addEventListener('click', logout);
  document.getElementById('openCulturePopupBtn')?.addEventListener('click', openCultureModalFromMain);
  document.getElementById('mobileCultureBtn')?.addEventListener('click', () => {
    uiState.mobileMenuOpen = false;
    document.getElementById('mobileDrawer')?.classList.remove('open');
    openCultureModalFromMain();
  });

  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLang = btn.getAttribute('data-set-lang');
      if (nextLang !== appState.language) {
        appState.language = nextLang;
        saveStoredLanguage(nextLang);
        renderMainApp();
      }
    });
  });

  document.querySelectorAll('[data-scroll-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-scroll-target');
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  mobileToggle?.addEventListener('click', () => {
    uiState.mobileMenuOpen = !uiState.mobileMenuOpen;
    mobileToggle.setAttribute('aria-expanded', uiState.mobileMenuOpen ? 'true' : 'false');
    mobileDrawer?.classList.toggle('open', uiState.mobileMenuOpen);
  });

  document.querySelectorAll('[data-mobile-nav]').forEach((link) => {
    link.addEventListener('click', () => {
      uiState.mobileMenuOpen = false;
      mobileToggle?.setAttribute('aria-expanded', 'false');
      mobileDrawer?.classList.remove('open');
    });
  });

  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    uiState.searchQuery = e.target.value;
    renderDestinations();
  });

  document.getElementById('regionFilter')?.addEventListener('change', (e) => {
    uiState.selectedRegion = e.target.value;
    renderDestinations();
  });

  document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
    uiState.selectedCategory = e.target.value;
    renderFilterControls();
    renderDestinations();
  });

  document.getElementById('sortFilter')?.addEventListener('change', (e) => {
    uiState.sortBy = e.target.value;
    renderDestinations();
  });

  document.getElementById('resetFiltersBtn')?.addEventListener('click', resetDestinationFilters);

  document.getElementById('favToggleBtn')?.addEventListener('click', () => {
    uiState.favoritesOnly = !uiState.favoritesOnly;
    renderFilterControls();
    renderDestinations();
  });

  document.getElementById('categoryTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter-cat]');
    if (!btn) return;
    uiState.selectedCategory = btn.getAttribute('data-filter-cat') || '';
    renderFilterControls();
    renderDestinations();
  });

  document.getElementById('destinationCards')?.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav-id]');
    if (favBtn) {
      toggleFavorite(favBtn.getAttribute('data-fav-id'));
      return;
    }

    const detailBtn = e.target.closest('[data-detail-id]');
    if (detailBtn) {
      openDestinationDetailModal(detailBtn.getAttribute('data-detail-id'));
    }
  });

  document.getElementById('regionList')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-select-region]');
    if (!item) return;
    uiState.activeMapRegion = item.getAttribute('data-select-region');
    renderMapSection();
  });

  const mapContainer = document.getElementById('interactiveMapContainer');
  mapContainer?.addEventListener('click', (e) => {
    const pin = e.target.closest('[data-map-region]');
    if (!pin) return;
    uiState.activeMapRegion = pin.getAttribute('data-map-region');
    renderMapSection();
  });

  mapContainer?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const pin = e.target.closest('[data-map-region]');
    if (!pin) return;
    e.preventDefault();
    uiState.activeMapRegion = pin.getAttribute('data-map-region');
    renderMapSection();
  });

  document.getElementById('destPickerGrid')?.addEventListener('change', (e) => {
    const checkbox = e.target.closest('[data-pick-dest]');
    if (!checkbox) return;
    const id = checkbox.value;
    const next = new Set(uiState.planner.selectedDestinationIds);
    if (checkbox.checked) next.add(id);
    else next.delete(id);
    uiState.planner.selectedDestinationIds = [...next];
    const countEl = document.getElementById('selectedDestCount');
    if (countEl) countEl.textContent = String(next.size);
  });

  document.getElementById('clearPickerBtn')?.addEventListener('click', () => {
    uiState.planner.selectedDestinationIds = [];
    renderDestinationPicker();
  });

  document.getElementById('tripName')?.addEventListener('input', (e) => {
    uiState.planner.name = e.target.value;
  });

  document.getElementById('tripDate')?.addEventListener('change', (e) => {
    uiState.planner.date = e.target.value;
  });

  document.getElementById('tripDays')?.addEventListener('change', (e) => {
    uiState.planner.days = Number(e.target.value || 1);
    renderBudgetSummary();
  });

  document.getElementById('travelers')?.addEventListener('input', (e) => {
    uiState.planner.travelers = Math.max(1, Number(e.target.value || 1));
    renderBudgetSummary();
  });

  ['transportCost', 'stayCost', 'mealCost', 'activityCost'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      uiState.planner[id] = Math.max(0, Number(e.target.value || 0));
      renderBudgetSummary();
    });
  });

  document.getElementById('itineraryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selected = uiState.planner.selectedDestinationIds
      .map((id) => appState.destinations.find((d) => d.id === id))
      .filter(Boolean);

    if (!selected.length) {
      showToast(tr('toastPickDestination'), 'error');
      return;
    }

    const days = Math.max(1, Number(uiState.planner.days || 1));
    const people = Math.max(1, Number(uiState.planner.travelers || 1));
    const acts = Array.from({ length: days }, (_, dayIdx) => ({
      day: dayIdx + 1,
      items: selected.filter((_, idx) => idx % days === dayIdx).map((d) => d.name),
    }));

    const budget = calculateBudgetTotal();
    const tripRecord = {
      id: `it-${Date.now()}`,
      name: (uiState.planner.name || tr('tripNameDefault')).trim(),
      date: uiState.planner.date,
      days,
      people,
      activities: acts,
      total: budget.total,
      destinationIds: [...uiState.planner.selectedDestinationIds],
      transportCost: uiState.planner.transportCost,
      stayCost: uiState.planner.stayCost,
      mealCost: uiState.planner.mealCost,
      activityCost: uiState.planner.activityCost,
    };

    uiState.planner.lastGeneratedItinerary = tripRecord;
    appState.savedItineraries.unshift(tripRecord);
    renderGeneratedItinerary();
    renderSavedTrips();

    try {
      await api.saveItineraries(appState.savedItineraries);
      showToast(tr('toastItinerarySaved'));
    } catch (err) {
      if (!handleUnauthorizedError(err)) showToast(err.message, 'error');
    }
  });

  document.getElementById('savedTripsList')?.addEventListener('click', async (e) => {
    const loadBtn = e.target.closest('[data-load-trip]');
    if (loadBtn) {
      const id = loadBtn.getAttribute('data-load-trip');
      const trip = appState.savedItineraries.find((item) => item.id === id);
      if (!trip) return;

      uiState.planner.name = trip.name;
      uiState.planner.date = trip.date || todayIsoDate();
      uiState.planner.days = trip.days;
      uiState.planner.travelers = trip.people;
      uiState.planner.selectedDestinationIds = [...(trip.destinationIds || [])];
      if (trip.transportCost !== undefined) uiState.planner.transportCost = trip.transportCost;
      if (trip.stayCost !== undefined) uiState.planner.stayCost = trip.stayCost;
      if (trip.mealCost !== undefined) uiState.planner.mealCost = trip.mealCost;
      if (trip.activityCost !== undefined) uiState.planner.activityCost = trip.activityCost;
      uiState.planner.lastGeneratedItinerary = trip;

      renderMainApp();
      document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
      showToast(tr('toastItineraryLoaded'));
      return;
    }

    const delBtn = e.target.closest('[data-delete-trip]');
    if (delBtn) {
      const id = delBtn.getAttribute('data-delete-trip');
      appState.savedItineraries = appState.savedItineraries.filter((item) => item.id !== id);
      renderSavedTrips();
      try {
        await api.saveItineraries(appState.savedItineraries);
        showToast(tr('toastItineraryDeleted'));
      } catch (err) {
        handleUnauthorizedError(err);
      }
    }
  });

  document.getElementById('interestFilter')?.addEventListener('change', (e) => {
    uiState.packageFilter.interest = e.target.value;
    renderPackages();
  });

  document.getElementById('maxBudgetFilter')?.addEventListener('input', (e) => {
    uiState.packageFilter.maxBudget = Math.max(0, Number(e.target.value || 0));
    renderPackages();
  });

  document.getElementById('recommendationOutput')?.addEventListener('click', (e) => {
    const useBtn = e.target.closest('[data-use-package]');
    if (!useBtn) return;

    const pkg = appState.packages.find((p) => p.id === useBtn.getAttribute('data-use-package'));
    if (!pkg) return;

    uiState.planner.name = pkg.name;
    uiState.planner.days = Math.min(5, Math.max(1, Number(pkg.days || 2)));
    uiState.planner.selectedDestinationIds = [...(pkg.destinations || [])];

    renderMainApp();
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
    showToast(tr('toastPackageApplied'));
  });

  // Operator & Admin catalog management events
  document.querySelectorAll('[data-admin-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      uiState.adminType = tab.getAttribute('data-admin-tab');
      renderMainApp();
    });
  });

  document.getElementById('adminAddBtn')?.addEventListener('click', () => {
    openAdminItemModal(null);
  });

  document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      destinations: appState.destinations,
      foods: appState.foods,
      stays: appState.stays,
      packages: appState.packages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wonderful-aceh-catalog.json';
    link.click();
    URL.revokeObjectURL(url);
    showToast(tr('toastExported'));
  });

  document.getElementById('resetDemoBtn')?.addEventListener('click', () => {
    openConfirmModal({
      title: tr('confirmResetTitle'),
      message: tr('confirmResetBody'),
      confirmLabel: tr('confirmBtn'),
      cancelLabel: tr('cancelBtn'),
      onConfirm: async () => {
        try {
          const reset = await api.resetCatalog();
          appState.destinations = reset.destinations;
          appState.foods = reset.foods;
          appState.stays = reset.stays;
          appState.packages = reset.packages;
          refreshDynamicViews();
          showToast(tr('toastResetDone'));
        } catch (err) {
          if (!handleUnauthorizedError(err)) showToast(err.message, 'error');
        }
      },
    });
  });

  document.getElementById('adminList')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-admin-edit]');
    if (editBtn) {
      openAdminItemModal(editBtn.getAttribute('data-admin-edit'));
      return;
    }

    const delBtn = e.target.closest('[data-admin-delete]');
    if (delBtn) {
      const id = delBtn.getAttribute('data-admin-delete');
      openConfirmModal({
        title: tr('confirmDeleteTitle'),
        message: tr('confirmDeleteBody'),
        confirmLabel: tr('confirmBtn'),
        cancelLabel: tr('cancelBtn'),
        onConfirm: async () => {
          const type = uiState.adminType;
          try {
            await api.deleteCatalogItem(type, id);
            appState[type] = appState[type].filter((item) => item.id !== id);
            refreshDynamicViews();
            showToast(tr('toastDataDeleted'));
          } catch (err) {
            if (!handleUnauthorizedError(err)) showToast(err.message, 'error');
          }
        },
      });
    }
  });

  // Admin-only User & Role Management events
  document.getElementById('createUserForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
      role: String(formData.get('role') || 'operator'),
    };

    try {
      const res = await api.createManagedUser(payload);
      appState.managedUsers.push(res.user);
      form.reset();
      renderManagedUsers();
      showToast(tr('toastUserCreated'));
    } catch (err) {
      if (!handleUnauthorizedError(err)) showToast(err.message, 'error');
    }
  });

  document.getElementById('managedUsersList')?.addEventListener('click', async (e) => {
    const roleBtn = e.target.closest('[data-user-role-id]');
    if (roleBtn) {
      const userId = roleBtn.getAttribute('data-user-role-id');
      const nextRole = roleBtn.getAttribute('data-next-role');
      try {
        const res = await api.updateUserRole(userId, nextRole);
        const idx = appState.managedUsers.findIndex((u) => u.id === userId);
        if (idx >= 0) appState.managedUsers[idx] = res.user;
        renderManagedUsers();
        showToast(tr('toastUserUpdated'));
      } catch (err) {
        if (!handleUnauthorizedError(err)) showToast(err.message, 'error');
      }
      return;
    }

    const deleteUserBtn = e.target.closest('[data-user-delete-id]');
    if (deleteUserBtn) {
      const userId = deleteUserBtn.getAttribute('data-user-delete-id');
      openConfirmModal({
        title: tr('confirmDeleteUserTitle'),
        message: tr('confirmDeleteUserBody'),
        confirmLabel: tr('confirmBtn'),
        cancelLabel: tr('cancelBtn'),
        onConfirm: async () => {
          try {
            await api.deleteManagedUser(userId);
            appState.managedUsers = appState.managedUsers.filter((u) => u.id !== userId);
            renderManagedUsers();
            showToast(tr('toastUserDeleted'));
          } catch (err) {
            if (!handleUnauthorizedError(err)) showToast(err.message, 'error');
          }
        },
      });
    }
  });
}

bootstrapAuth();
