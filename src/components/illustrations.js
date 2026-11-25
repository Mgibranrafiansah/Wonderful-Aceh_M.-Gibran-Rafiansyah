import { escapeHtml } from '../utils/format.js';

export const PHOTO_ASSETS = {
  hero: '/src/assets/images/danau_laut_tawar_gayo_1795589141975.jpg',
  authShowcase: '/src/assets/images/masjid_raya_baiturrahman_1795589139004.jpg',
  byItemId: {
    d1: '/src/assets/images/masjid_raya_baiturrahman_1795589139004.jpg',
    d2: '/src/assets/images/museum_tsunami_aceh_authentic_1795592732770.jpg',
    d3: '/src/assets/images/kapal_pltd_apung_1795589139894.jpg',
    d4: '/src/assets/images/pantai_lampuuk_aceh_1795589140894.jpg',
    d5: '/src/assets/images/pantai_lhoknga_aceh_1795589998337.jpg',
    d6: '/src/assets/images/pulau_weh_iboih_1795589141641.jpg',
    d7: '/src/assets/images/pantai_sumur_tiga_1795590000791.jpg',
    d8: '/src/assets/images/danau_laut_tawar_gayo_1795589141975.jpg',
    d9: '/src/assets/images/pantan_terong_gayo_1795589996059.jpg',
    d10: '/src/assets/images/masjid_agung_babussalam_1795589996728.jpg',
    d11: '/src/assets/images/gunung_burni_telong_1795589996324.jpg',
    d12: '/src/assets/images/rumah_adat_gayo_1795589141470.jpg',
    d13: '/src/assets/images/pasar_kuliner_aceh_1795590221441.jpg',
    f1: '/src/assets/images/kuliner_mie_aceh_1795589142428.jpg',
    f2: '/src/assets/images/kopi_gayo_aceh_1795589142958.jpg',
    f3: '/src/assets/images/kuliner_kuah_pliek_u_1795589998311.jpg',
    f4: '/src/assets/images/kue_timphan_aceh_1795589998748.jpg',
    f5: '/src/assets/images/keripik_sambal_aceh_1795589998728.jpg',
    f6: '/src/assets/images/sambal_asam_udeung_1795590223970.jpg',
    s1: '/src/assets/images/akomodasi_syariah_aceh_1795589143854.jpg',
    s2: '/src/assets/images/guesthouse_pesisir_sabang_1795589999577.jpg',
    s3: '/src/assets/images/homestay_gayo_takengon_1795589999695.jpg',
  },
  byVisualKey: {
    mosque: '/src/assets/images/masjid_raya_baiturrahman_1795589139004.jpg',
    museum: '/src/assets/images/museum_tsunami_aceh_authentic_1795592732770.jpg',
    ship: '/src/assets/images/kapal_pltd_apung_1795589139894.jpg',
    beach: '/src/assets/images/pantai_lampuuk_aceh_1795589140894.jpg',
    coast: '/src/assets/images/pantai_lhoknga_aceh_1795589998337.jpg',
    island: '/src/assets/images/pulau_weh_iboih_1795589141641.jpg',
    lake: '/src/assets/images/danau_laut_tawar_gayo_1795589141975.jpg',
    highland: '/src/assets/images/pantan_terong_gayo_1795589996059.jpg',
    volcano: '/src/assets/images/gunung_burni_telong_1795589996324.jpg',
    heritage: '/src/assets/images/rumah_adat_gayo_1795589141470.jpg',
    culinary: '/src/assets/images/pasar_kuliner_aceh_1795590221441.jpg',
    noodle: '/src/assets/images/kuliner_mie_aceh_1795589142428.jpg',
    coffee: '/src/assets/images/kopi_gayo_aceh_1795589142958.jpg',
    stew: '/src/assets/images/kuliner_kuah_pliek_u_1795589998311.jpg',
    pastry: '/src/assets/images/kue_timphan_aceh_1795589998748.jpg',
    snack: '/src/assets/images/keripik_sambal_aceh_1795589998728.jpg',
    sambal: '/src/assets/images/sambal_asam_udeung_1795590223970.jpg',
    stayUrban: '/src/assets/images/akomodasi_syariah_aceh_1795589143854.jpg',
    stayCoast: '/src/assets/images/guesthouse_pesisir_sabang_1795589999577.jpg',
    stayHighland: '/src/assets/images/homestay_gayo_takengon_1795589999695.jpg',
  },
};

export function resolveItemImage(item) {
  if (!item) return PHOTO_ASSETS.hero;
  if (item.image && typeof item.image === 'string' && item.image.startsWith('/src/assets/')) {
    return item.image;
  }
  return (
    PHOTO_ASSETS.byItemId[item.id] ||
    PHOTO_ASSETS.byVisualKey[item.visualKey] ||
    PHOTO_ASSETS.hero
  );
}

export function renderHeroArtwork(customSrc = PHOTO_ASSETS.hero, alt = 'Panorama Danau Laut Tawar, Aceh') {
  return `
    <div class="media-fallback-layer" aria-hidden="true">
      <svg class="hero-visual-art" viewBox="0 0 800 540" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="skyHeroFallback" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0b3b2e" />
            <stop offset="55%" stop-color="#17614e" />
            <stop offset="100%" stop-color="#b7832b" />
          </linearGradient>
        </defs>
        <rect width="800" height="540" fill="url(#skyHeroFallback)" />
        <path d="M0 345 Q190 250 390 320 T800 300 L800 540 L0 540 Z" fill="#093227" />
      </svg>
    </div>
    <img
      class="hero-visual-img"
      src="${escapeHtml(customSrc)}"
      alt="${escapeHtml(alt)}"
      referrerPolicy="no-referrer"
      loading="eager"
      onerror="this.style.display='none'"
    />
  `;
}

export function renderCardArtwork(visualKey = 'mosque', title = '', itemOrId = null) {
  const palettes = {
    mosque: ['#093227', '#1c6350'],
    museum: ['#1b3b42', '#356670'],
    ship: ['#183446', '#2e5d75'],
    beach: ['#0f4f54', '#2c8280'],
    coast: ['#104850', '#277276'],
    island: ['#084c52', '#207f78'],
    lake: ['#123f36', '#2a6b5b'],
    highland: ['#1d4534', '#3f7357'],
    volcano: ['#243c35', '#466859'],
    heritage: ['#46321f', '#755436'],
    culinary: ['#4d2e1e', '#824d31'],
    noodle: ['#54271a', '#914526'],
    coffee: ['#362015', '#68402b'],
    stayUrban: ['#133c34', '#296357'],
  };

  const [bg1, bg2] = palettes[visualKey] || palettes.lake;
  const imgSrc =
    typeof itemOrId === 'object' && itemOrId !== null
      ? resolveItemImage(itemOrId)
      : PHOTO_ASSETS.byItemId[itemOrId] ||
        PHOTO_ASSETS.byVisualKey[visualKey] ||
        PHOTO_ASSETS.hero;

  return `
    <div class="card-media-fallback" style="background: linear-gradient(135deg, ${bg1}, ${bg2});" aria-hidden="true">
      <span>${escapeHtml(title)}</span>
    </div>
    <img
      class="card-media-img"
      src="${escapeHtml(imgSrc)}"
      alt="${escapeHtml(title)}"
      referrerPolicy="no-referrer"
      loading="lazy"
      onerror="this.style.display='none'"
    />
  `;
}

export function renderInteractiveAcehMap(regions, activeRegionName) {
  const pins = regions
    .map((region) => {
      const isActive = region.name === activeRegionName;
      return `
        <g
          class="map-pin ${isActive ? 'active' : ''}"
          data-map-region="${escapeHtml(region.name)}"
          tabindex="0"
          role="button"
          aria-pressed="${isActive ? 'true' : 'false'}"
          aria-label="${escapeHtml(region.name)}"
        >
          <circle cx="${region.cx}" cy="${region.cy}" r="${isActive ? 18 : 13}" fill="${isActive ? '#b7832b' : '#0b3b2e'}" opacity="0.24" />
          <circle class="pin-dot" cx="${region.cx}" cy="${region.cy}" r="8" fill="${isActive ? '#b7832b' : '#0b3b2e'}" stroke="#faf5ea" stroke-width="2.5" />
          <text
            x="${region.labelX}"
            y="${region.labelY}"
            font-size="12"
            font-weight="${isActive ? '700' : '600'}"
            fill="${isActive ? '#8f5f14' : '#1e1a14'}"
          >${escapeHtml(region.name)}</text>
        </g>
      `;
    })
    .join('');

  return `
    <svg class="map-svg" viewBox="0 0 500 300" role="img" aria-label="Peta ilustratif wilayah Aceh">
      <rect width="500" height="300" rx="14" fill="#ebe1ce" />
      <path d="M20 40 Q70 30 120 42" stroke="#cbbba0" stroke-width="1.5" fill="none" />
      <path d="M350 48 Q400 38 450 50" stroke="#cbbba0" stroke-width="1.5" fill="none" />
      <path d="M74 44 L108 38 L120 56 L104 72 L78 66 Z" fill="#b7cfb9" stroke="#477a63" stroke-width="2" />
      <path
        d="M122 86 L184 74 L242 98 L298 118 L352 152 L386 196 L354 246 L296 268 L236 250 L186 218 L146 168 L118 124 Z"
        fill="#c2d6bf"
        stroke="#477a63"
        stroke-width="2.5"
      />
      <path
        d="M155 96 Q170 122 184 138 T245 184 T274 218"
        fill="none"
        stroke="#85652d"
        stroke-width="2.5"
        stroke-dasharray="5 5"
      />
      ${pins}
    </svg>
  `;
}
