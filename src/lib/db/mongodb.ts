// Polyfill for Bun node:v8 startup snapshot check in bson
if (typeof process !== "undefined" && typeof (process as any).getBuiltinModule === "function") {
  const orig = (process as any).getBuiltinModule.bind(process);
  (process as any).getBuiltinModule = (id: string) => {
    const m = orig(id);
    if (id === "v8" && m) {
      m.startupSnapshot = { isBuildingSnapshot: () => false };
    }
    return m;
  };
}

import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017/resumesprint";
export const dbName = process.env.MONGODB_DATABASE || process.env.MONGODB_DB_NAME || "resumesprint";

/**
 * Checks whether a given MongoClient has a healthy, non-closed topology.
 */
function isTopologyHealthy(client: MongoClient | undefined): boolean {
  if (!client) return false;
  try {
    const topo = (client as any)?.topology;
    if (!topo) return true; // Just created or connecting
    if (typeof topo.isDestroyed === "function" && topo.isDestroyed()) return false;
    const state = topo.s?.state;
    if (state === "closed" || state === "destroying" || state === "destroyed") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a live, healthy MongoClient instance. If the existing client's topology
 * closed due to a network blip or idle timeout, a new client is automatically provisioned.
 */
export function getMongoClient(): MongoClient {
  if (!global._mongoClient || !isTopologyHealthy(global._mongoClient)) {
    if (global._mongoClient) {
      try {
        global._mongoClient.close().catch(() => {});
      } catch {
        // ignore cleanup error
      }
    }

    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 0,
      tlsAllowInvalidCertificates: true,
    });

    global._mongoClient = client;
    global._mongoClientPromise = client.connect().catch((err) => {
      console.warn("MongoDB connection deferred:", err.message);
      return client;
    });
  }

  return global._mongoClient;
}

export function getClientPromise(): Promise<MongoClient> {
  getMongoClient();
  return global._mongoClientPromise!;
}

/**
 * A resilient Db proxy that dynamically binds to the active, healthy MongoClient.
 * Prevents MongoTopologyClosedError across server restarts or intermittent disconnects.
 */
export const mongoDb: Db = new Proxy({} as Db, {
  get(target, prop) {
    const activeClient = getMongoClient();
    const activeDb = activeClient.db(dbName);
    const val = (activeDb as any)[prop];
    return typeof val === "function" ? val.bind(activeDb) : val;
  },
});

/**
 * Checks if the current MongoDB connection is actively established and responsive.
 */
export function isMongoConnected(): boolean {
  try {
    const client = global._mongoClient;
    if (!client) return false;
    const topo = (client as any)?.topology;
    if (!topo) return false;
    if (typeof topo.isConnected === "function" && topo.isConnected()) return true;
    const state = topo.s?.state;
    return state === "connected";
  } catch {
    return false;
  }
}

/**
 * Returns the active Db instance for operations, throwing in tests if live mongo is disabled.
 */
export async function getDb(): Promise<Db> {
  if (process.env.NODE_ENV === "test" && !process.env.USE_LIVE_MONGO) {
    throw new Error("Test environment: offline fast fallback to local store");
  }
  const client = await getClientPromise();
  return client.db(dbName);
}

export const rawClient = getMongoClient();
export default getClientPromise();
