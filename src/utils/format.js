export function formatRupiah(amount) {
  const num = Number(amount || 0);
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] || char;
  });
}

export function sanitizeUrl(url) {
  try {
    const parsed = new URL(String(url));
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    // Fallback below
  }
  return 'https://www.google.com/maps/search/?api=1&query=Aceh+Indonesia';
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
