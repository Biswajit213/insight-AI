import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.MISTRAL_API_KEY || '1nzuiLuicMC0qco5YIKbbgqhkjkprZyd';
console.log('Testing Mistral AI API connection with key starting with:', apiKey.slice(0, 5) + '...');

const client = new Mistral({ apiKey });

async function main() {
  try {
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: 'You are InsightAI, an AI data analyst.' },
        { role: 'user', content: 'Hello! Respond with "InsightAI backend connection verified successfully!"' },
      ],
    });

    console.log('Response status: SUCCESS');
    console.log('Mistral output:', response.choices?.[0]?.message?.content);
    if (response.usage) {
      console.log('Tokens used:', response.usage);
    }
  } catch (error) {
    console.error('Mistral AI API call failed:', error);
    process.exit(1);
  }
}

main();
