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
    const avatarUrl =
      session.user.user_metadata?.avatar_url ||
      session.user.user_metadata?.picture ||
      null;

    if (email) {
      // Store real Supabase user ID as the token (not a fake timestamp one)
      const userId = session.user.id;

      localStorage.setItem('insightai_token', userId);
      localStorage.setItem('insightai_user_email', email);
      localStorage.setItem('insightai_user_name', fullName || 'Analytics User');
      if (avatarUrl) {
        localStorage.setItem('insightai_user_avatar', avatarUrl);
      } else {
        localStorage.removeItem('insightai_user_avatar');
      }
      window.dispatchEvent(new Event('insightai_user_updated'));

      // Persist real profile to database
      await storeLoginData({
        email,
        fullName: fullName || 'Analytics User',
        userId,
        avatarUrl: avatarUrl ?? undefined,
        provider: 'google',
      });
    }
  } else {
    // Session ended — clear local storage
    localStorage.removeItem('insightai_token');
    localStorage.removeItem('insightai_user_email');
    localStorage.removeItem('insightai_user_name');
    localStorage.removeItem('insightai_user_avatar');
    window.dispatchEvent(new Event('insightai_user_updated'));
  }
});

export async function signInWithGoogle(_returnTo = '/app') {
  // Always redirect to /auth/callback which handles the OAuth session exchange,
  // then navigates to the dashboard once the session is confirmed.
  const redirectTo = `${window.location.origin}/auth/callback`;
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account', // always show Google account picker
      },
    },
  });
}

export async function signOutUser() {
  localStorage.removeItem('insightai_token');
  localStorage.removeItem('insightai_user_email');
  localStorage.removeItem('insightai_user_name');
  localStorage.removeItem('insightai_user_avatar');
  window.dispatchEvent(new Event('insightai_user_updated'));
  return supabase.auth.signOut();
}
