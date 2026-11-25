import { escapeHtml } from '../utils/format.js';

let backdropEl = null;
let dialogEl = null;
let lastFocusedEl = null;

function ensureModal() {
  if (backdropEl) return { backdropEl, dialogEl };

  backdropEl = document.createElement('div');
  backdropEl.className = 'modal-backdrop';
  backdropEl.setAttribute('role', 'dialog');
  backdropEl.setAttribute('aria-modal', 'true');
  backdropEl.setAttribute('aria-labelledby', 'modal-heading');

  dialogEl = document.createElement('div');
  dialogEl.className = 'modal-dialog';

  backdropEl.appendChild(dialogEl);
  document.body.appendChild(backdropEl);

  backdropEl.addEventListener('click', (event) => {
    if (event.target === backdropEl) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && backdropEl.classList.contains('open')) {
      closeModal();
    }
  });

  return { backdropEl, dialogEl };
}

export function openModal(innerHtml, onMount) {
  const { backdropEl: backdrop, dialogEl: dialog } = ensureModal();
  lastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  dialog.innerHTML = `
    <button type="button" class="modal-close" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
    ${innerHtml}
  `;

  const closeBtn = dialog.querySelector('.modal-close');
  closeBtn?.addEventListener('click', closeModal);

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (typeof onMount === 'function') {
    onMount(dialog);
  }

  closeBtn?.focus();
}

export function closeModal() {
  if (!backdropEl) return;
  backdropEl.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocusedEl) {
    lastFocusedEl.focus();
    lastFocusedEl = null;
  }
}

export function openConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm }) {
  openModal(
    `
      <h2 id="modal-heading" class="modal-title">${escapeHtml(title)}</h2>
      <p style="color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6;">
        ${escapeHtml(message)}
      </p>
      <div class="modal-footer-actions">
        <button type="button" class="btn btn-danger" data-confirm-yes>${escapeHtml(confirmLabel)}</button>
        <button type="button" class="btn btn-ghost" data-confirm-no>${escapeHtml(cancelLabel)}</button>
      </div>
    `,
    (dialog) => {
      dialog.querySelector('[data-confirm-no]')?.addEventListener('click', closeModal);
      dialog.querySelector('[data-confirm-yes]')?.addEventListener('click', () => {
        closeModal();
        onConfirm();
      });
    },
  );
}
