import { createClient } from '@supabase/supabase-js';
import { storeLoginData } from '../services/authApi';

const SUPABASE_URL = 'https://jfuuzdrdhveuijprezql.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_98B0qXWwuPmK28Uv-bbppw_pAg8mijV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Automatically sync real Supabase Auth session (e.g. Google OAuth callbacks)
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    const email = session.user.email;
    const fullName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      email?.split('@')[0];
    const avatarUrl = session.user.user_metadata?.avatar_url;

    if (email) {
      localStorage.setItem('insightai_token', session.access_token || session.user.id);
      localStorage.setItem('insightai_user_email', email);
      localStorage.setItem('insightai_user_name', fullName || 'Analytics User');
      window.dispatchEvent(new Event('insightai_user_updated'));

      await storeLoginData({
        email,
        fullName: fullName || 'Analytics User',
        userId: session.user.id,
        avatarUrl,
        provider: 'google',
      });
    }
  }
});

export async function signInWithGoogle(returnTo = '/app') {
  const redirectTo = `${window.location.origin}${returnTo}`;
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function signOutUser() {
  localStorage.removeItem('insightai_token');
  localStorage.removeItem('insightai_user_email');
  localStorage.removeItem('insightai_user_name');
  window.dispatchEvent(new Event('insightai_user_updated'));
  return supabase.auth.signOut();
}
