import { redis } from './redisClient';

/**
 * Checks if a specific action keys has exceeded the rate limit.
 * 
 * @param key The unique key identifier (e.g. `rate_limit:submit_offer:userId`)
 * @param limit Maximum allowed actions in the duration window
 * @param durationSeconds Duration of the rate limit window in seconds
 * @returns Object indicating if the action is allowed and the current count
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  durationSeconds: number
): Promise<{ success: boolean; count: number }> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, durationSeconds);
    }
    return {
      success: current <= limit,
      count: current,
    };
  } catch (error) {
    console.error('[RateLimiter] Error connecting to Redis database:', error);
    // Fail-open to ensure user experience isn't blocked by database/network drops
    return { success: true, count: 0 };
  }
}
