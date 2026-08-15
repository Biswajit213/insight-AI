import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkDatabaseUsers() {
  console.log('\n======================================================');
  console.log('  🔍 CHECKING LOGIN & USER DATA IN SUPABASE DATABASE  ');
  console.log('======================================================\n');
  console.log('Connecting to Supabase instance:', url);

  // 1. Fetch records from profiles table
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (profileErr) {
    console.error('\n❌ Error fetching from profiles table:', profileErr.message);
  } else {
    console.log(`\n👤 PROFILES TABLE RECORDS (Total: ${profiles?.length || 0}):`);
    if (profiles && profiles.length > 0) {
      console.table(profiles.map(p => ({
        ID: p.id,
        'User ID': p.user_id,
        Email: p.email,
        'Full Name': p.full_name,
        Role: p.role,
        'Last Updated': p.updated_at,
      })));
    } else {
      console.log('ℹ️ No user profiles found in database yet. Log in or sign up in the app to create a record!');
    }
  }

  // 2. Fetch login/signup records from audit_logs table
  const { data: logs, error: logErr } = await supabase
    .from('audit_logs')
    .select('*')
    .in('action', ['USER_LOGIN', 'USER_SIGNUP'])
    .order('created_at', { ascending: false });

  if (logErr) {
    console.error('\n❌ Error fetching from audit_logs table:', logErr.message);
  } else {
    console.log(`\n📋 AUDIT LOGS LOGIN/SIGNUP EVENTS (Total: ${logs?.length || 0}):`);
    if (logs && logs.length > 0) {
      console.table(logs.map(l => ({
        ID: l.id,
        'User ID': l.user_id,
        Action: l.action,
        'Email / Provider': JSON.stringify(l.metadata),
        Timestamp: l.created_at,
      })));
    } else {
      console.log('ℹ️ No login/signup audit logs found in database yet.');
    }
  }

  console.log('\n======================================================\n');
}

checkDatabaseUsers().catch(console.error);
