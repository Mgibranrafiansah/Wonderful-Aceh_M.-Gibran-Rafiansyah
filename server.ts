import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import {
  SEED_DESTINATIONS,
  SEED_FOODS,
  SEED_PACKAGES,
  SEED_STAYS,
} from './src/data/seed.js';

type Role = 'user' | 'operator' | 'admin';
type CatalogType = 'destinations' | 'foods' | 'stays' | 'packages';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
}

interface FavoriteItem {
  id: string;
  itemId: string;
  type: string;
  date: string;
}

interface ItineraryRecord {
  id: string;
  name: string;
  date: string;
  days: number;
  people: number;
  activities: Array<{ day: number; items: string[] }>;
  total: number;
  destinationIds: string[];
  transportCost?: number;
  stayCost?: number;
  mealCost?: number;
  activityCost?: number;
}

interface AuthStore {
  users: UserRecord[];
  favoritesByUser: Record<string, FavoriteItem[]>;
  itinerariesByUser: Record<string, ItineraryRecord[]>;
}

interface CatalogStore {
  destinations: Array<Record<string, unknown>>;
  foods: Array<Record<string, unknown>>;
  stays: Array<Record<string, unknown>>;
  packages: Array<Record<string, unknown>>;
}

interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUTH_FILE = path.resolve(DATA_DIR, 'auth-store.json');
const CATALOG_FILE = path.resolve(DATA_DIR, 'catalog-store.json');

const ALLOWED_CATALOG_TYPES = new Set<CatalogType>([
  'destinations',
  'foods',
  'stays',
  'packages',
]);

const ALLOWED_MANAGED_ROLES = new Set<Role>(['user', 'operator']);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAuthStore(): AuthStore {
  ensureDataDir();
  if (!fs.existsSync(AUTH_FILE)) {
    const initial: AuthStore = {
      users: [],
      favoritesByUser: {},
      itinerariesByUser: {},
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AuthStore>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      favoritesByUser:
        parsed.favoritesByUser && typeof parsed.favoritesByUser === 'object'
          ? parsed.favoritesByUser
          : {},
      itinerariesByUser:
        parsed.itinerariesByUser && typeof parsed.itinerariesByUser === 'object'
          ? parsed.itinerariesByUser
          : {},
    };
  } catch {
    return { users: [], favoritesByUser: {}, itinerariesByUser: {} };
  }
}

function writeAuthStore(store: AuthStore): void {
  ensureDataDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function defaultCatalog(): CatalogStore {
  return {
    destinations: clone(SEED_DESTINATIONS),
    foods: clone(SEED_FOODS),
    stays: clone(SEED_STAYS),
    packages: clone(SEED_PACKAGES),
  };
}

function readCatalogStore(): CatalogStore {
  ensureDataDir();
  if (!fs.existsSync(CATALOG_FILE)) {
    const initial = defaultCatalog();
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(CATALOG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CatalogStore>;
    return {
      destinations: Array.isArray(parsed.destinations)
        ? parsed.destinations
        : clone(SEED_DESTINATIONS),
      foods: Array.isArray(parsed.foods) ? parsed.foods : clone(SEED_FOODS),
      stays: Array.isArray(parsed.stays) ? parsed.stays : clone(SEED_STAYS),
      packages: Array.isArray(parsed.packages)
        ? parsed.packages
        : clone(SEED_PACKAGES),
    };
  } catch {
    return defaultCatalog();
  }
}

function writeCatalogStore(store: CatalogStore): void {
  ensureDataDir();
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(store, null, 2), 'utf8');
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

function verifyEnvPasscode(input: string): boolean {
  const configured = (process.env.ADMIN_PASSCODE || '').trim();
  if (!configured) return false;
  const a = Buffer.from(input, 'utf8');
  const b = Buffer.from(configured, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function signToken(user: { id: string; role: Role }): string {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): { sub: string; role: Role } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as { sub?: string; role?: Role; exp?: number };
    if (!parsed.sub || !parsed.role || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return { sub: parsed.sub, role: parsed.role };
  } catch {
    return null;
  }
}

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Simple rate limiter for auth endpoints
const authAttempts = new Map<string, { count: number; resetAt: number }>();
function checkAuthRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const record = authAttempts.get(ip);
  if (!record || now > record.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    next();
    return;
  }
  if (record.count >= 30) {
    res.status(429).json({ error: 'Terlalu banyak percobaan. Coba beberapa menit lagi.' });
    return;
  }
  record.count += 1;
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autentikasi diperlukan.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir.' });
    return;
  }

  // Handle env-passcode ephemeral admin session or persisted user
  if (decoded.sub === 'env-admin' && (process.env.ADMIN_PASSCODE || '').trim()) {
    req.authUser = {
      id: 'env-admin',
      name: 'Administrator',
      email: 'admin@halalexplore.local',
      role: 'admin',
    };
    next();
    return;
  }

  const store = readAuthStore();
  const user = store.users.find((u) => u.id === decoded.sub);
  if (!user) {
    res.status(401).json({ error: 'Akun tidak ditemukan.' });
    return;
  }

  req.authUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  next();
}

function requireRole(allowed: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser || !allowed.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Akses ditolak untuk peran Anda.' });
      return;
    }
    next();
  };
}

function sanitizeCatalogRecord(
  type: CatalogType,
  body: Record<string, unknown>,
): Record<string, unknown> | null {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 140) return null;

  const toStringArray = (val: unknown): string[] => {
    if (Array.isArray(val)) {
      return val.map((v) => String(v).trim()).filter(Boolean).slice(0, 20);
    }
    if (typeof val === 'string') {
      return val.split(',').map((v) => v.trim()).filter(Boolean).slice(0, 20);
    }
    return [];
  };

  if (type === 'destinations') {
    const rawMaps = typeof body.maps === 'string' ? body.maps.trim() : '';
    let safeMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' Aceh')}`;
    if (rawMaps) {
      try {
        const parsed = new URL(rawMaps);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
          safeMaps = parsed.href;
        }
      } catch {
        // Keep safe default
      }
    }
    return {
      name,
      category: String(body.category || 'Alam').trim(),
      region: String(body.region || 'Banda Aceh').trim(),
      desc: String(body.desc || '').trim(),
      descEn: String(body.descEn || body.desc || '').trim(),
      address: String(body.address || '').trim(),
      cost: Math.max(0, Number(body.cost || 0)),
      facilities: toStringArray(body.facilities),
      prayer: String(body.prayer || '').trim(),
      maps: safeMaps,
      visualKey: String(body.visualKey || 'lake').trim(),
      featured: Boolean(body.featured),
    };
  }

  if (type === 'foods') {
    return {
      name,
      category: String(body.category || 'Kuliner khas').trim(),
      region: String(body.region || 'Banda Aceh').trim(),
      price: Math.max(0, Number(body.price || 0)),
      halal: String(body.halal || 'Belum diverifikasi').trim(),
      source: String(body.source || '').trim(),
      contact: String(body.contact || '').replace(/[^\d]/g, '').slice(0, 20),
      visualKey: String(body.visualKey || 'noodle').trim(),
    };
  }

  if (type === 'stays') {
    return {
      name,
      region: String(body.region || 'Banda Aceh').trim(),
      price: Math.max(0, Number(body.price || 0)),
      facilities: toStringArray(body.facilities),
      muslim: toStringArray(body.muslim),
      contact: String(body.contact || '').replace(/[^\d]/g, '').slice(0, 20),
      visualKey: String(body.visualKey || 'stayUrban').trim(),
    };
  }

  return {
    name,
    days: Math.max(1, Math.min(14, Number(body.days || 2))),
    cost: Math.max(0, Number(body.cost || 0)),
    interest: String(body.interest || 'Religi').trim(),
    desc: String(body.desc || '').trim(),
    destinations: toStringArray(body.destinations),
  };
}

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer(): Promise<void> {
  const app = express();
  app.use('/api/identify-landmark', express.json({ limit: '6mb' }));
  app.use(express.json({ limit: '256kb' }));

  // Auth status (safe public check)
  app.get('/api/auth/status', (_req, res) => {
    const store = readAuthStore();
    const adminClaimed = store.users.some((u) => u.role === 'admin');
    const envAdminConfigured = Boolean((process.env.ADMIN_PASSCODE || '').trim());
    res.json({
      adminClaimed,
      envAdminConfigured,
      hasUsers: store.users.length > 0,
    });
  });

  // First-run atomic admin claim when ADMIN_PASSCODE is unset and no admin exists
  app.post('/api/auth/claim-admin', checkAuthRateLimit, async (req, res) => {
    const envAdminConfigured = Boolean((process.env.ADMIN_PASSCODE || '').trim());
    if (envAdminConfigured) {
      res.status(409).json({ error: 'Admin dikelola melalui konfigurasi server.' });
      return;
    }

    const store = readAuthStore();
    if (store.users.some((u) => u.role === 'admin')) {
      res.status(409).json({ error: 'Akun admin awal sudah diklaim.' });
      return;
    }

    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || name.length < 2) {
      res.status(400).json({ error: 'Nama minimal 2 karakter.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
      return;
    }
    if (store.users.some((u) => u.email === email)) {
      res.status(409).json({ error: 'Email sudah terdaftar.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const adminUser: UserRecord = {
      id: `usr-${crypto.randomUUID()}`,
      name,
      email,
      role: 'admin',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    store.users.push(adminUser);
    writeAuthStore(store);

    const token = signToken({ id: adminUser.id, role: 'admin' });
    res.status(201).json({ token, user: sanitizeUser(adminUser) });
  });

  // Public registration (always creates standard 'user' role)
  app.post('/api/auth/register', checkAuthRateLimit, async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || name.length < 2) {
      res.status(400).json({ error: 'Nama lengkap minimal 2 karakter.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
      return;
    }

    const store = readAuthStore();
    if (store.users.some((u) => u.email === email)) {
      res.status(409).json({ error: 'Email sudah terdaftar.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser: UserRecord = {
      id: `usr-${crypto.randomUUID()}`,
      name,
      email,
      role: 'user',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    writeAuthStore(store);

    const token = signToken({ id: newUser.id, role: 'user' });
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  // Login endpoint for user, operator, and admin
  app.post('/api/auth/login', checkAuthRateLimit, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!password) {
      res.status(400).json({ error: 'Kata sandi wajib diisi.' });
      return;
    }

    // Check configured ADMIN_PASSCODE override if logging in as admin
    if ((email === 'admin' || email === 'admin@halalexplore.local') && verifyEnvPasscode(password)) {
      const token = signToken({ id: 'env-admin', role: 'admin' });
      res.json({
        token,
        user: {
          id: 'env-admin',
          name: 'Administrator',
          email: 'admin@halalexplore.local',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Masukkan email yang valid.' });
      return;
    }

    const store = readAuthStore();
    const user = store.users.find((u) => u.email === email);
    if (!user) {
      res.status(401).json({ error: 'Email atau kata sandi salah.' });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Email atau kata sandi salah.' });
      return;
    }

    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: sanitizeUser(user) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.authUser });
  });

  // Catalog endpoints
  app.get('/api/catalog', requireAuth, (_req, res) => {
    const catalog = readCatalogStore();
    res.json(catalog);
  });

  app.post(
    '/api/catalog/:type',
    requireAuth,
    requireRole(['operator', 'admin']),
    (req, res) => {
      const type = req.params.type as CatalogType;
      if (!ALLOWED_CATALOG_TYPES.has(type)) {
        res.status(400).json({ error: 'Kategori katalog tidak valid.' });
        return;
      }
      const clean = sanitizeCatalogRecord(type, (req.body || {}) as Record<string, unknown>);
      if (!clean) {
        res.status(400).json({ error: 'Data tidak valid.' });
        return;
      }

      const catalog = readCatalogStore();
      const created = {
        id: `${type[0]}${Date.now()}`,
        ...clean,
      };
      catalog[type].unshift(created);
      writeCatalogStore(catalog);
      res.status(201).json({ item: created });
    },
  );

  app.put(
    '/api/catalog/:type/:id',
    requireAuth,
    requireRole(['operator', 'admin']),
    (req, res) => {
      const type = req.params.type as CatalogType;
      const id = req.params.id;
      if (!ALLOWED_CATALOG_TYPES.has(type)) {
        res.status(400).json({ error: 'Kategori katalog tidak valid.' });
        return;
      }
      const clean = sanitizeCatalogRecord(type, (req.body || {}) as Record<string, unknown>);
      if (!clean) {
        res.status(400).json({ error: 'Data tidak valid.' });
        return;
      }

      const catalog = readCatalogStore();
      const idx = catalog[type].findIndex((item) => item.id === id);
      if (idx < 0) {
        res.status(404).json({ error: 'Data tidak ditemukan.' });
        return;
      }

      catalog[type][idx] = { ...catalog[type][idx], ...clean, id };
      writeCatalogStore(catalog);
      res.json({ item: catalog[type][idx] });
    },
  );

  app.delete(
    '/api/catalog/:type/:id',
    requireAuth,
    requireRole(['operator', 'admin']),
    (req, res) => {
      const type = req.params.type as CatalogType;
      const id = req.params.id;
      if (!ALLOWED_CATALOG_TYPES.has(type)) {
        res.status(400).json({ error: 'Kategori katalog tidak valid.' });
        return;
      }

      const catalog = readCatalogStore();
      const before = catalog[type].length;
      catalog[type] = catalog[type].filter((item) => item.id !== id);
      if (catalog[type].length === before) {
        res.status(404).json({ error: 'Data tidak ditemukan.' });
        return;
      }
      writeCatalogStore(catalog);
      res.json({ deleted: id });
    },
  );

  // Admin-only catalog reset
  app.post('/api/catalog/reset', requireAuth, requireRole(['admin']), (_req, res) => {
    const reset = defaultCatalog();
    writeCatalogStore(reset);
    res.json(reset);
  });

  // Per-user workspace (favorites & saved itineraries)
  app.get('/api/user/workspace', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.authUser!.id;
    const store = readAuthStore();
    res.json({
      favorites: store.favoritesByUser[userId] || [],
      itineraries: store.itinerariesByUser[userId] || [],
    });
  });

  app.put('/api/user/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.authUser!.id;
    const favorites = Array.isArray(req.body?.favorites) ? req.body.favorites : [];
    const store = readAuthStore();
    store.favoritesByUser[userId] = favorites.slice(0, 100);
    writeAuthStore(store);
    res.json({ favorites: store.favoritesByUser[userId] });
  });

  app.put('/api/user/itineraries', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.authUser!.id;
    const itineraries = Array.isArray(req.body?.itineraries) ? req.body.itineraries : [];
    const store = readAuthStore();
    store.itinerariesByUser[userId] = itineraries.slice(0, 50);
    writeAuthStore(store);
    res.json({ itineraries: store.itinerariesByUser[userId] });
  });

  // Admin-only User & Role Management
  app.get('/api/admin/users', requireAuth, requireRole(['admin']), (_req, res) => {
    const store = readAuthStore();
    res.json({ users: store.users.map(sanitizeUser) });
  });

  app.post(
    '/api/admin/users',
    requireAuth,
    requireRole(['admin']),
    async (req, res) => {
      const name = String(req.body?.name || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const role = req.body?.role as Role;

      if (!name || name.length < 2) {
        res.status(400).json({ error: 'Nama minimal 2 karakter.' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Format email tidak valid.' });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
        return;
      }
      if (!ALLOWED_MANAGED_ROLES.has(role)) {
        res.status(400).json({ error: 'Role harus user atau operator.' });
        return;
      }

      const store = readAuthStore();
      if (store.users.some((u) => u.email === email)) {
        res.status(409).json({ error: 'Email sudah terdaftar.' });
        return;
      }

      const passwordHash = await hashPassword(password);
      const created: UserRecord = {
        id: `usr-${crypto.randomUUID()}`,
        name,
        email,
        role,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      store.users.push(created);
      writeAuthStore(store);
      res.status(201).json({ user: sanitizeUser(created) });
    },
  );

  app.patch(
    '/api/admin/users/:id/role',
    requireAuth,
    requireRole(['admin']),
    (req: AuthenticatedRequest, res) => {
      const targetId = req.params.id;
      const nextRole = req.body?.role as Role;

      if (!ALLOWED_MANAGED_ROLES.has(nextRole)) {
        res.status(400).json({ error: 'Role hanya dapat diubah ke user atau operator.' });
        return;
      }
      if (targetId === req.authUser?.id) {
        res.status(400).json({ error: 'Tidak dapat mengubah role akun sendiri.' });
        return;
      }

      const store = readAuthStore();
      const user = store.users.find((u) => u.id === targetId);
      if (!user) {
        res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        return;
      }
      if (user.role === 'admin') {
        res.status(400).json({ error: 'Role akun admin lain tidak dapat diturunkan.' });
        return;
      }

      user.role = nextRole;
      writeAuthStore(store);
      res.json({ user: sanitizeUser(user) });
    },
  );

  app.delete(
    '/api/admin/users/:id',
    requireAuth,
    requireRole(['admin']),
    (req: AuthenticatedRequest, res) => {
      const targetId = req.params.id;
      if (targetId === req.authUser?.id) {
        res.status(400).json({ error: 'Tidak dapat menghapus akun yang sedang aktif.' });
        return;
      }

      const store = readAuthStore();
      const target = store.users.find((u) => u.id === targetId);
      if (!target) {
        res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        return;
      }
      if (target.role === 'admin') {
        res.status(400).json({ error: 'Akun admin tidak dapat dihapus melalui rute ini.' });
        return;
      }

      store.users = store.users.filter((u) => u.id !== targetId);
      delete store.favoritesByUser[targetId];
      delete store.itinerariesByUser[targetId];
      writeAuthStore(store);
      res.json({ deleted: targetId });
    },
  );

  // Server-side Gemini Vision endpoint: Identify Aceh tourist spot / landmark from uploaded photo
  app.post(
    '/api/identify-landmark',
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const reqLang = req.body?.lang === 'en' ? 'en' : 'id';
      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            reqLang === 'en'
              ? 'Photo recognition key (GEMINI_API_KEY) is not configured yet in Settings > Secrets.'
              : 'Kunci layanan analisis foto (GEMINI_API_KEY) belum dikonfigurasi di Settings > Secrets.',
        });
        return;
      }

      const rawMime = String(req.body?.mimeType || '').trim().toLowerCase();
      if (!ALLOWED_IMAGE_MIMES.has(rawMime)) {
        res.status(400).json({
          error:
            reqLang === 'en'
              ? 'Image format must be JPEG, PNG, or WebP.'
              : 'Format gambar harus JPEG, PNG, atau WebP.',
        });
        return;
      }

      const rawBase64 = String(req.body?.imageBase64 || '').trim();
      const cleanedBase64 = rawBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      if (!cleanedBase64 || cleanedBase64.length < 100) {
        res.status(400).json({
          error:
            reqLang === 'en'
              ? 'Uploaded photo data is empty or invalid.'
              : 'Data foto tidak valid atau kosong.',
        });
        return;
      }
      if (cleanedBase64.length > 5_500_000) {
        res.status(413).json({
          error:
            reqLang === 'en'
              ? 'Image size is too large. Maximum supported is around 4 MB.'
              : 'Ukuran foto terlalu besar. Maksimal sekitar 4 MB.',
        });
        return;
      }

      const catalog = readCatalogStore();
      const catalogSummary = [
        ...catalog.destinations.map(
          (d) =>
            `[${String(d.id)}] ${String(d.name)} (${String(d.region)}, ${String(d.category)} - ${String(d.address)})`,
        ),
        ...catalog.foods.map(
          (f) => `[${String(f.id)}] Kuliner: ${String(f.name)} (${String(f.region)})`,
        ),
      ].join('\n');

      const systemInstruction =
        reqLang === 'en'
          ? 'You are an expert Aceh tourism, geography, architecture, and cultural heritage visual analyst for Wonderful Aceh. Examine the uploaded photo carefully for architectural details (domes, carvings, curved hulls, stilt houses), coastal topography (cliffs, islands, reefs, boats), highland volcanoes/lakes, or Acehnese culinary dishes. You MUST clearly state WHERE the tourist spot is located in locationVerdict (e.g., "This tourist site is Masjid Raya Baiturrahman, located in Baiturrahman District, Banda Aceh City, Aceh Province."). Also fill regencyOrCity, districtOrArea, specificLocation, distanceFromCapital, coordinatesLabel, visualClues, concise description, visitorTips, and matchedCatalogId (if matching a catalog entry below; otherwise empty string). If the photo is clearly NOT in Aceh, set isAcehRelated=false and explicitly state where it appears to be located in locationVerdict without guessing falsely.'
          : 'Anda adalah pakar pariwisata, geografi, arsitektur, dan warisan budaya Aceh untuk platform Wonderful Aceh. Analisis foto yang diunggah dengan cermat berdasarkan ciri visual (kubah masjid, ukiran rumah adat, kapal/monumen tsunami, pantai & pulau Sabang/Aceh Besar, danau/gunung dataran tinggi Gayo, atau kuliner khas). Anda WAJIB menjawab secara tegas di mana wisata tersebut berada pada field locationVerdict dengan kalimat langsung (contoh: "Wisata ini adalah Masjid Raya Baiturrahman yang berlokasi di Kecamatan Baiturrahman, Kota Banda Aceh, Provinsi Aceh."). Lengkapi pula regencyOrCity (Kabupaten/Kota), districtOrArea (Kecamatan/Gampong), specificLocation (alamat/lokasi rinci), distanceFromCapital (jarak & waktu tempuh dari Banda Aceh), coordinatesLabel (perkiraan lintang/bujur), visualClues (3–4 bukti visual pada foto), description, visitorTips, serta matchedCatalogId jika cocok dengan daftar katalog berikut. Jika foto jelas berada di luar Aceh, set isAcehRelated=false dan jelaskan lokasinya secara jujur pada locationVerdict.';

      const promptText =
        reqLang === 'en'
          ? `Pinpoint the exact tourist destination and where in Aceh this photo was taken.\n\nReference catalog entries:\n${catalogSummary}`
          : `Analisis foto ini dan jelaskan secara jelas ini tempat wisata apa serta berada di mana (Kabupaten/Kota, Kecamatan, dan alamat di Provinsi Aceh).\n\nDaftar katalog referensi:\n${catalogSummary}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: rawMime,
                  data: cleanedBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isAcehRelated: {
                  type: Type.BOOLEAN,
                  description:
                    'True if the image depicts a tourist attraction, landmark, or culinary heritage in Aceh, Indonesia.',
                },
                confidence: {
                  type: Type.INTEGER,
                  description: 'Estimated confidence score from 0 to 100.',
                },
                placeName: {
                  type: Type.STRING,
                  description: 'Identified tourist spot, monument, or dish name.',
                },
                locationVerdict: {
                  type: Type.STRING,
                  description:
                    'Clear 1-sentence conclusion directly stating what the tourist spot is and exactly where it is located.',
                },
                regencyOrCity: {
                  type: Type.STRING,
                  description:
                    'Regency or city in Aceh (e.g., Kota Banda Aceh, Kota Sabang, Kabupaten Aceh Besar, Kabupaten Aceh Tengah, Kabupaten Bener Meriah).',
                },
                districtOrArea: {
                  type: Type.STRING,
                  description:
                    'Sub-district (Kecamatan), village (Gampong), or coastal/highland zone.',
                },
                specificLocation: {
                  type: Type.STRING,
                  description:
                    'Specific street address, village, or landmark orientation description.',
                },
                distanceFromCapital: {
                  type: Type.STRING,
                  description:
                    'Approximate distance and travel time from central Banda Aceh (e.g., "± 15 km / 25 menit dari pusat Banda Aceh").',
                },
                coordinatesLabel: {
                  type: Type.STRING,
                  description:
                    'Approximate geographic coordinates string (e.g., "5.5536° LU, 95.3171° BT").',
                },
                category: {
                  type: Type.STRING,
                  description:
                    'One of: Religi, Sejarah, Bahari, Alam, Budaya, Kuliner, Umum.',
                },
                visualClues: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 4 concrete visual elements observed directly in the photo.',
                },
                description: {
                  type: Type.STRING,
                  description: 'Informative overview of the identified place.',
                },
                visitorTips: {
                  type: Type.STRING,
                  description:
                    'Practical tips for visitors including access, timing, or Muslim-friendly etiquette.',
                },
                matchedCatalogId: {
                  type: Type.STRING,
                  description:
                    'Exact catalog item ID (e.g. d1, d8, f1) if matched, or empty string.',
                },
                mapsSearchQuery: {
                  type: Type.STRING,
                  description: 'Concise search query for locating the spot on Google Maps.',
                },
              },
              required: [
                'isAcehRelated',
                'confidence',
                'placeName',
                'locationVerdict',
                'regencyOrCity',
                'districtOrArea',
                'specificLocation',
                'distanceFromCapital',
                'coordinatesLabel',
                'category',
                'visualClues',
                'description',
                'visitorTips',
                'matchedCatalogId',
                'mapsSearchQuery',
              ],
            },
          },
        });

        const rawJson = (response.text || '{}').trim();
        const parsed = JSON.parse(rawJson) as Record<string, unknown>;

        const placeName = String(parsed.placeName || '').trim() || (reqLang === 'en' ? 'Identified Location' : 'Lokasi Teridentifikasi');
        const regencyOrCity = String(parsed.regencyOrCity || '').trim() || 'Aceh';
        const districtOrArea = String(parsed.districtOrArea || '').trim();
        const specificLocation = String(parsed.specificLocation || '').trim() || regencyOrCity;
        const rawVerdict = String(parsed.locationVerdict || '').trim();
        const fallbackVerdict =
          reqLang === 'en'
            ? `This destination is ${placeName}, located in ${districtOrArea ? `${districtOrArea}, ` : ''}${regencyOrCity}, Aceh.`
            : `Wisata ini adalah ${placeName} yang berlokasi di ${districtOrArea ? `${districtOrArea}, ` : ''}${regencyOrCity}, Provinsi Aceh.`;

        res.json({
          result: {
            isAcehRelated: Boolean(parsed.isAcehRelated),
            confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence || 0)))),
            placeName,
            locationVerdict: rawVerdict || fallbackVerdict,
            regencyOrCity,
            districtOrArea,
            specificLocation,
            distanceFromCapital: String(parsed.distanceFromCapital || '').trim(),
            coordinatesLabel: String(parsed.coordinatesLabel || '').trim(),
            category: String(parsed.category || 'Umum'),
            visualClues: Array.isArray(parsed.visualClues)
              ? parsed.visualClues.map((c) => String(c)).slice(0, 5)
              : [],
            description: String(parsed.description || ''),
            visitorTips: String(parsed.visitorTips || ''),
            matchedCatalogId: String(parsed.matchedCatalogId || '').trim(),
            mapsSearchQuery: String(parsed.mapsSearchQuery || `${placeName} ${regencyOrCity} Aceh`),
          },
        });
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error ? err.message : 'Gagal menganalisis foto lokasi.';
        console.error('Gemini identify-landmark error:', rawMsg);

        const lower = rawMsg.toLowerCase();
        let friendlyError = '';
        let statusCode = 502;

        if (lower.includes('permission_denied') || lower.includes('403') || lower.includes('free tier is not available')) {
          statusCode = 403;
          friendlyError =
            reqLang === 'en'
              ? 'Gemini AI analysis could not run because this project requires a billing-enabled API key. Please check or select your Gemini API key in Settings > Secrets.'
              : 'Analisis foto AI belum dapat berjalan karena proyek Gemini saat ini memerlukan API key aktif/berbayar. Silakan periksa atau pilih Gemini API key pada panel Settings > Secrets.';
        } else if (lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
          statusCode = 400;
          friendlyError =
            reqLang === 'en'
              ? 'The configured Gemini API key is invalid. Please update GEMINI_API_KEY in Settings > Secrets.'
              : 'Kunci Gemini API tidak valid. Silakan perbarui GEMINI_API_KEY pada panel Settings > Secrets.';
        } else if (lower.includes('resource_exhausted') || lower.includes('429')) {
          statusCode = 429;
          friendlyError =
            reqLang === 'en'
              ? 'Gemini API quota exceeded. Please try again shortly or check your quota in Settings > Secrets.'
              : 'Kuota Gemini API sedang penuh. Coba lagi sebentar atau periksa kuota di Settings > Secrets.';
        } else {
          friendlyError =
            reqLang === 'en'
              ? `Could not analyze photo right now: ${rawMsg}`
              : `Gagal mengenali lokasi foto saat ini: ${rawMsg}`;
        }

        res.status(statusCode).json({ error: friendlyError });
      }
    },
  );

  // Ensure body-parser or payload size errors return clean JSON
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.too.large') {
      res.status(413).json({
        error: 'Ukuran foto melebihi batas unggah server. Silakan pilih foto yang lebih ringkas.',
      });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Format permintaan JSON tidak valid.' });
      return;
    }
    next(err);
  });

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HalalExplore Aceh server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
