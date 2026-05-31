import { Redis } from '@upstash/redis';

const redisUrl = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn('Upstash Redis environment variables are missing. Please define VITE_UPSTASH_REDIS_REST_URL and VITE_UPSTASH_REDIS_REST_TOKEN.');
}

export const redis = new Redis({
  url: redisUrl || 'https://placeholder.upstash.io',
  token: redisToken || 'placeholder-token',
});
