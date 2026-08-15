import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file if available
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  SUPABASE_URL: z.string().url().default('https://example.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('mock-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('mock-service-role-key'),
  
  MISTRAL_API_KEY: z.string().default('mock-mistral-key'),
  MISTRAL_MODEL: z.string().default('mistral-large-latest'),
  
  MAX_FILE_SIZE_MB: z.string().transform((val) => parseInt(val, 10)).default('50'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn('⚠️ Environment variable warning:', result.error.flatten().fieldErrors);
    return envSchema.parse({
      ...process.env,
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://example.supabase.co',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'mock-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key',
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || 'mock-mistral-key',
    });
  }
  return result.data;
};

export const env = parseEnv();
