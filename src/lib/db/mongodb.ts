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

let rawClient: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
      tlsAllowInvalidCertificates: true,
    });
  }
  rawClient = global._mongoClient;

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = rawClient.connect().catch((err) => {
      console.warn("MongoDB connection deferred:", err.message);
      // Reset so next attempt can reconnect
      global._mongoClient = undefined;
      global._mongoClientPromise = undefined;
      return rawClient;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  rawClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 2500,
    connectTimeoutMS: 2500,
    tlsAllowInvalidCertificates: true,
  });
  clientPromise = rawClient.connect().catch((err) => {
    console.warn("MongoDB connection deferred:", err.message);
    return rawClient;
  });
}

export const mongoDb: Db = rawClient.db(dbName);

export function isMongoConnected(): boolean {
  try {
    const topo = (rawClient as any)?.topology;
    return Boolean(
      topo &&
        typeof topo.isConnected === "function" &&
        topo.isConnected() &&
        (typeof topo.isDestroyed !== "function" || !topo.isDestroyed())
    );
  } catch {
    return false;
  }
}

export async function getDb(): Promise<Db> {
  if (process.env.NODE_ENV === "test" && !process.env.USE_LIVE_MONGO) {
    throw new Error("Test environment: offline fast fallback to local store");
  }
  const client = await clientPromise;
  return client.db(dbName);
}

export { rawClient };
export default clientPromise;
