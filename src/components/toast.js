import { escapeHtml } from '../utils/format.js';

let containerEl = null;

function ensureContainer() {
  if (containerEl) return containerEl;
  containerEl = document.createElement('div');
  containerEl.className = 'toast-region';
  containerEl.setAttribute('aria-live', 'polite');
  containerEl.setAttribute('aria-atomic', 'false');
  document.body.appendChild(containerEl);
  return containerEl;
}

export function showToast(message, variant = 'default') {
  const host = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${variant === 'error' ? 'toast-error' : ''}`;
  toast.setAttribute('role', 'status');

  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  `;

  const remove = () => {
    toast.remove();
  };

  toast.querySelector('.toast-close')?.addEventListener('click', remove);
  host.appendChild(toast);

  window.setTimeout(remove, 3800);
}
