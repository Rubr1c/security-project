import { db } from '@/lib/db/client';
import { logs } from '@/lib/db/schema';

export const logService = {
  async getAllLogs() {
    return db.select().from(logs).all();
  }
};
