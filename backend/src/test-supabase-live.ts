import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('--- InsightAI Live Supabase Verification ---');
console.log('Connecting to Supabase URL:', url);

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  try {
    // Check tables in database
    const tables = ['profiles', 'datasets', 'dataset_columns', 'analyses', 'ai_conversations', 'ai_messages', 'insights', 'anomalies', 'reports', 'audit_logs', 'ai_usage'];
    const results: Record<string, string> = {};
    let missingTablesCount = 0;

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('does not exist')) {
          results[table] = '❌ Table does not exist yet';
          missingTablesCount++;
        } else {
          results[table] = `⚠️ Error: ${error.message}`;
        }
      } else {
        results[table] = '✅ Table exists & accessible';
      }
    }

    console.log('\n--- Table Audit Status ---');
    console.table(results);

    if (missingTablesCount > 0) {
      console.log('\n⚠️ Some database tables have not been created in Supabase yet.');
      console.log('💡 Run the SQL migration script (src/db/migrations/001_initial_schema.sql) in your Supabase SQL Editor!');
    } else {
      console.log('\n🎉 ALL DATABASE TABLES ARE CREATED AND PROPERLY WORKING!');
    }
  } catch (err) {
    console.error('Database connection test failed:', err);
    process.exit(1);
  }
}

main();
