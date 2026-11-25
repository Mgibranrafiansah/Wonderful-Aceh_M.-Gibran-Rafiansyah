import { t } from '../i18n/translations.js';
import { escapeHtml } from '../utils/format.js';
import { api, setAuthToken } from '../utils/api.js';
import { PHOTO_ASSETS, renderHeroArtwork } from './illustrations.js';

export function renderAuthView({
  root,
  lang,
  authStatus,
  activeTab,
  onTabChange,
  onLanguageChange,
  onAuthenticated,
  onOpenCulture,
}) {
  const tr = (key) => t(key, lang);
  const canClaimAdmin = !authStatus.adminClaimed && !authStatus.envAdminConfigured;
  const currentTab =
    activeTab === 'claim-admin' && !canClaimAdmin
      ? 'login'
      : activeTab || (canClaimAdmin ? 'claim-admin' : 'login');

  root.innerHTML = `
    <div class="auth-shell">
      <header class="site-header">
        <div class="container header-inner">
          <a href="#" class="brand-wordmark">Wonderful <span>Aceh</span></a>
          <div class="header-cta">
            <button type="button" class="btn btn-heritage-ghost btn-sm" id="openCultureFromAuthBtn">
              ${escapeHtml(tr('openCulturePopupBtn'))}
            </button>
            <div class="segmented" role="group" aria-label="Language switcher">
              <button
                type="button"
                class="segmented-btn ${lang === 'id' ? 'active' : ''}"
                aria-pressed="${lang === 'id' ? 'true' : 'false'}"
                data-auth-lang="id"
              >ID</button>
              <button
                type="button"
                class="segmented-btn ${lang === 'en' ? 'active' : ''}"
                aria-pressed="${lang === 'en' ? 'true' : 'false'}"
                data-auth-lang="en"
              >EN</button>
            </div>
          </div>
        </div>
      </header>

      <main class="auth-main">
        <div class="container">
          <div class="auth-grid">
            <section class="auth-showcase">
              <div class="auth-showcase-visual">
                ${renderHeroArtwork(PHOTO_ASSETS.authShowcase, 'Masjid Raya Baiturrahman, Banda Aceh')}
                <div class="hero-visual-scrim">
                  <strong>Masjid Raya Baiturrahman</strong>
                  <span>${escapeHtml(tr('heroCaptionSub'))}</span>
                </div>
              </div>

              <div class="auth-role-matrix">
                <h2>${escapeHtml(tr('roleMatrixTitle'))}</h2>
                <div class="role-row">
                  <strong>${escapeHtml(tr('roleUserLabel'))}</strong>
                  <p>${escapeHtml(tr('roleUserDesc'))}</p>
                </div>
                <div class="role-row">
                  <strong>${escapeHtml(tr('roleOperatorLabel'))}</strong>
                  <p>${escapeHtml(tr('roleOperatorDesc'))}</p>
                </div>
                <div class="role-row">
                  <strong>${escapeHtml(tr('roleAdminLabel'))}</strong>
                  <p>${escapeHtml(tr('roleAdminDesc'))}</p>
                </div>
              </div>
            </section>

            <section class="auth-card panel">
              <div class="section-eyebrow">WONDERFUL ACEH · PORTAL</div>
              <h1 class="auth-heading">${escapeHtml(tr('authTitle'))}</h1>
              <p class="panel-sub">${escapeHtml(tr('authSubtitle'))}</p>

              <div class="segmented auth-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  class="segmented-btn ${currentTab === 'login' ? 'active' : ''}"
                  aria-selected="${currentTab === 'login' ? 'true' : 'false'}"
                  data-auth-tab="login"
                >${escapeHtml(tr('authTabLogin'))}</button>
                <button
                  type="button"
                  role="tab"
                  class="segmented-btn ${currentTab === 'register' ? 'active' : ''}"
                  aria-selected="${currentTab === 'register' ? 'true' : 'false'}"
                  data-auth-tab="register"
                >${escapeHtml(tr('authTabRegister'))}</button>
                ${
                  canClaimAdmin
                    ? `<button
                        type="button"
                        role="tab"
                        class="segmented-btn ${currentTab === 'claim-admin' ? 'active' : ''}"
                        aria-selected="${currentTab === 'claim-admin' ? 'true' : 'false'}"
                        data-auth-tab="claim-admin"
                      >${escapeHtml(tr('authTabClaimAdmin'))}</button>`
                    : ''
                }
              </div>

              ${
                currentTab === 'claim-admin'
                  ? `<div class="advisory-note" style="margin-top: 0; margin-bottom: 18px;">${escapeHtml(tr('authClaimNotice'))}</div>`
                  : ''
              }

              <form id="authForm" class="auth-form" novalidate>
                ${
                  currentTab !== 'login'
                    ? `
                    <div class="field">
                      <label for="authName">${escapeHtml(tr('authNameLabel'))}</label>
                      <input
                        id="authName"
                        name="name"
                        type="text"
                        class="input"
                        autocomplete="name"
                        placeholder="${escapeHtml(tr('authNamePlaceholder'))}"
                        required
                      />
                    </div>
                  `
                    : ''
                }

                <div class="field">
                  <label for="authEmail">${escapeHtml(tr('authEmailLabel'))}</label>
                  <input
                    id="authEmail"
                    name="email"
                    type="email"
                    class="input"
                    autocomplete="email"
                    placeholder="${escapeHtml(tr('authEmailPlaceholder'))}"
                    required
                  />
                </div>

                <div class="field">
                  <label for="authPassword">${escapeHtml(tr('authPasswordLabel'))}</label>
                  <input
                    id="authPassword"
                    name="password"
                    type="password"
                    class="input"
                    autocomplete="${currentTab === 'login' ? 'current-password' : 'new-password'}"
                    placeholder="${escapeHtml(tr('authPasswordPlaceholder'))}"
                    required
                  />
                </div>

                <div id="authErrorBox" class="auth-error" role="alert" aria-live="polite" hidden></div>

                <button type="submit" id="authSubmitBtn" class="btn btn-primary" style="width: 100%;">
                  ${escapeHtml(
                    currentTab === 'login'
                      ? tr('authLoginBtn')
                      : currentTab === 'register'
                        ? tr('authRegisterBtn')
                        : tr('authClaimAdminBtn'),
                  )}
                </button>

                ${
                  currentTab === 'login' && authStatus.envAdminConfigured
                    ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">${escapeHtml(tr('authEnvAdminHint'))}</p>`
                    : ''
                }
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  `;

  root.querySelector('#openCultureFromAuthBtn')?.addEventListener('click', () => {
    if (typeof onOpenCulture === 'function') onOpenCulture();
  });

  root.querySelectorAll('[data-auth-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      onLanguageChange(btn.getAttribute('data-auth-lang'));
    });
  });

  root.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      onTabChange(tab.getAttribute('data-auth-tab'));
    });
  });

  const form = root.querySelector('#authForm');
  const errorBox = root.querySelector('#authErrorBox');
  const submitBtn = root.querySelector('#authSubmitBtn');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!errorBox || !submitBtn) return;

    errorBox.hidden = true;
    errorBox.textContent = '';

    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = tr('authSigningIn');

    try {
      let res;
      if (currentTab === 'claim-admin') {
        res = await api.claimAdmin({ name, email, password });
      } else if (currentTab === 'register') {
        res = await api.register({ name, email, password });
      } else {
        res = await api.login({ email, password });
      }

      setAuthToken(res.token);
      await onAuthenticated(res.user);
    } catch (err) {
      errorBox.textContent = err.message || 'Authentication error';
      errorBox.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}
