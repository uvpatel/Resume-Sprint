import fs from "fs";
import path from "path";
import { getDb } from "./mongodb";
import {
  ResumeRecord,
  ScanRecord,
  OptimizationRecord,
  UserRecord,
} from "./types";

// Persistent file-backed store for multi-process Next.js dev server synchronization
const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "db.json");

interface LocalStore {
  users: Record<string, UserRecord>;
  resumes: Record<string, ResumeRecord>;
  scans: Record<string, ScanRecord>;
  optimizations: Record<string, OptimizationRecord>;
}

export const DEMO_USER_ID = "usr_demo_01";
export const DEMO_USER: UserRecord = {
  id: DEMO_USER_ID,
  email: "urvilpatel700@gmail.com",
  name: "Urvil Patel",
  image: "https://github.com/uvpatel.png",
  createdAt: new Date().toISOString(),
};

function readLocalStore(): LocalStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial: LocalStore = {
        users: { [DEMO_USER_ID]: DEMO_USER },
        resumes: {},
        scans: {},
        optimizations: {},
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {
      users: { [DEMO_USER_ID]: DEMO_USER },
      resumes: {},
      scans: {},
      optimizations: {},
    };
  }
}

function writeLocalStore(store: LocalStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

// ----------------- Users -----------------

export async function getUserById(id: string): Promise<UserRecord | null> {
  try {
    const db = await getDb();
    const doc = await db.collection("users").findOne({ _id: id as any });
    if (doc) {
      return {
        id: (doc as any)._id.toString(),
        email: (doc as any).email,
        name: (doc as any).name,
        createdAt: (doc as any).createdAt,
      };
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  return store.users[id] || (id === DEMO_USER_ID ? DEMO_USER : null);
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase().trim();
  try {
    const db = await getDb();
    const doc = await db.collection("users").findOne({ email: normalized });
    if (doc) {
      return {
        id: (doc as any)._id.toString(),
        email: (doc as any).email,
        name: (doc as any).name,
        createdAt: (doc as any).createdAt,
      };
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  for (const user of Object.values(store.users)) {
    if (user.email.toLowerCase() === normalized) {
      return user;
    }
  }
  return null;
}

export async function createUser(email: string, name?: string): Promise<UserRecord> {
  const normalized = email.toLowerCase().trim();
  const existing = await getUserByEmail(normalized);
  if (existing) return existing;

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: UserRecord = {
    id,
    email: normalized,
    name: name || normalized.split("@")[0],
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await getDb();
    await db.collection("users").insertOne({
      _id: id as any,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
    });
  } catch {
    // fallback
  }

  const store = readLocalStore();
  store.users[id] = newUser;
  writeLocalStore(store);

  return newUser;
}

// ----------------- Resumes -----------------

export async function saveResume(resume: ResumeRecord): Promise<ResumeRecord> {
  try {
    const db = await getDb();
    await db.collection("resumes").updateOne(
      { _id: resume.id as any },
      { $set: { ...resume, _id: resume.id as any } },
      { upsert: true }
    );
  } catch {
    // fallback
  }
  const store = readLocalStore();
  store.resumes[resume.id] = resume;
  writeLocalStore(store);
  return resume;
}

export async function getResumeById(id: string): Promise<ResumeRecord | null> {
  try {
    const db = await getDb();
    const doc = await db.collection("resumes").findOne({ _id: id as any });
    if (doc) {
      const { _id, ...rest } = doc as any;
      return { id: _id.toString(), ...rest } as ResumeRecord;
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  return store.resumes[id] || null;
}

export async function getResumesByUserId(userId: string): Promise<ResumeRecord[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection("resumes")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    if (docs.length > 0) {
      return docs.map((doc: any) => {
        const { _id, ...rest } = doc;
        return { id: _id.toString(), ...rest } as ResumeRecord;
      });
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  return Object.values(store.resumes)
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteResume(id: string, userId: string): Promise<boolean> {
  try {
    const db = await getDb();
    await db.collection("resumes").deleteOne({ _id: id as any, userId });
    await db.collection("scans").deleteMany({ resumeId: id, userId });
    await db.collection("optimizations").deleteMany({ resumeId: id, userId });
  } catch {
    // fallback
  }
  const store = readLocalStore();
  const item = store.resumes[id];
  if (item && item.userId === userId) {
    delete store.resumes[id];
    for (const [sId, scan] of Object.entries(store.scans)) {
      if (scan.resumeId === id) delete store.scans[sId];
    }
    for (const [oId, opt] of Object.entries(store.optimizations)) {
      if (opt.resumeId === id) delete store.optimizations[oId];
    }
    writeLocalStore(store);
    return true;
  }
  return false;
}

// ----------------- Scans -----------------

export async function saveScan(scan: ScanRecord): Promise<ScanRecord> {
  try {
    const db = await getDb();
    await db.collection("scans").updateOne(
      { _id: scan.id as any },
      { $set: { ...scan, _id: scan.id as any } },
      { upsert: true }
    );
  } catch {
    // fallback
  }
  const store = readLocalStore();
  store.scans[scan.id] = scan;
  writeLocalStore(store);
  return scan;
}

export async function getScanById(id: string): Promise<ScanRecord | null> {
  try {
    const db = await getDb();
    const doc = await db.collection("scans").findOne({ _id: id as any });
    if (doc) {
      const { _id, ...rest } = doc as any;
      return { id: _id.toString(), ...rest } as ScanRecord;
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  return store.scans[id] || null;
}

export async function getLatestScanByResumeId(resumeId: string): Promise<ScanRecord | null> {
  try {
    const db = await getDb();
    const doc = await db
      .collection("scans")
      .find({ resumeId })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    if (doc) {
      const { _id, ...rest } = doc as any;
      return { id: _id.toString(), ...rest } as ScanRecord;
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  const matched = Object.values(store.scans)
    .filter((s) => s.resumeId === resumeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return matched[0] || null;
}

export async function getScansByUserId(userId: string): Promise<ScanRecord[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection("scans")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    if (docs.length > 0) {
      return docs.map((doc: any) => {
        const { _id, ...rest } = doc;
        return { id: _id.toString(), ...rest } as ScanRecord;
      });
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  return Object.values(store.scans)
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ----------------- Optimizations -----------------

export async function saveOptimization(opt: OptimizationRecord): Promise<OptimizationRecord> {
  try {
    const db = await getDb();
    await db.collection("optimizations").updateOne(
      { _id: opt.id as any },
      { $set: { ...opt, _id: opt.id as any } },
      { upsert: true }
    );
  } catch {
    // fallback
  }
  const store = readLocalStore();
  store.optimizations[opt.id] = opt;
  writeLocalStore(store);
  return opt;
}

export async function getOptimizationByResumeId(resumeId: string): Promise<OptimizationRecord | null> {
  try {
    const db = await getDb();
    const doc = await db
      .collection("optimizations")
      .find({ resumeId })
      .sort({ updatedAt: -1 })
      .limit(1)
      .next();
    if (doc) {
      const { _id, ...rest } = doc as any;
      return { id: _id.toString(), ...rest } as OptimizationRecord;
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  const matched = Object.values(store.optimizations)
    .filter((o) => o.resumeId === resumeId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return matched[0] || null;
}

export async function getOptimizationById(id: string): Promise<OptimizationRecord | null> {
  try {
    const db = await getDb();
    const doc = await db.collection("optimizations").findOne({ _id: id as any });
    if (doc) {
      const { _id, ...rest } = doc as any;
      return { id: _id.toString(), ...rest } as OptimizationRecord;
    }
  } catch {
    // fallback
  }
  const store = readLocalStore();
  return store.optimizations[id] || null;
}
