import { db } from '@/lib/db/client';
import { logs } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const logService = {
  async getLogs(page = 1, limit = DEFAULT_LIMIT) {
    const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const data = db
      .select()
      .from(logs)
      .orderBy(desc(logs.id))
      .limit(safeLimit)
      .offset(offset)
      .all();

    const countResult = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(logs)
      .all();
    const total = Number(countResult[0]?.count ?? 0);

    return {
      data,
      page: safePage,
      limit: safeLimit,
      total,
      hasMore: offset + data.length < total,
    };
  },
};
