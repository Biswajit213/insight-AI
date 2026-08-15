import { Mistral } from '@mistralai/mistralai';
import { env } from './env';

export const mistralClient = new Mistral({
  apiKey: env.MISTRAL_API_KEY,
});

export const MISTRAL_MODEL = env.MISTRAL_MODEL;
