// global.d.ts
import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// This ensures that the above `declare global` doesn't cause issues in other files
export {};
