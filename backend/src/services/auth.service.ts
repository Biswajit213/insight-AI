import { v5 as uuidv5, validate as validateUuid, v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase';
import { UserProfile } from '../types/auth';
import { logger } from '../utils/logger';

const NAMESPACE_UUID = '6ba7b810-9ed0-11d1-80b4-00c04fd430c8';

export function toValidUUID(idOrString?: string): string {
  if (!idOrString) return uuidv4();
  if (validateUuid(idOrString)) return idOrString;
  return uuidv5(idOrString, NAMESPACE_UUID);
}

/**
 * Look up an existing profile by email first.
 * This guarantees the same user always gets the same user_id regardless
 * of what userId string the frontend sends across different sessions/devices.
 */
async function findExistingProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: true }) // oldest = canonical profile
      .limit(1)
      .single();

    if (!error && data) return data as UserProfile;
  } catch {
    // not found
  }
  return null;
}

export class AuthService {
  public static async recordLogin(params: {
    email: string;
    fullName?: string;
    userId?: string;
    avatarUrl?: string;
    provider?: string;
  }): Promise<UserProfile> {
    const email = params.email.trim().toLowerCase();
    const fullName = params.fullName || email.split('@')[0];

    // ── Step 1: Look up existing profile by email ─────────────────────────
    // This is the KEY fix: always reuse the existing user_id for a given email.
    // Without this, different userId inputs cause different uuidv5 outputs,
    // resulting in multiple profiles per email and lost data on re-login.
    const existing = await findExistingProfileByEmail(email);
    const stableUserId = existing?.user_id || toValidUUID(params.userId || email);

    // ── Step 2: Upsert profile using the STABLE user_id ───────────────────
    const profileData = {
      user_id: stableUserId,
      email,
      full_name: fullName,
      avatar_url: params.avatarUrl || null,
      role: 'user',
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        logger.warn('Failed to upsert profile', { error: error.message });
      }

      try {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: stableUserId,
          action: 'USER_LOGIN',
          resource_type: 'auth',
          metadata: {
            email,
            provider: params.provider || 'email',
            login_at: new Date().toISOString(),
          },
        });
      } catch (logErr: any) {
        logger.warn('Failed to record audit log', { error: logErr?.message });
      }

      if (data) return data as UserProfile;
    } catch (err: any) {
      logger.error('Error during recordLogin', { message: err?.message });
    }

    return {
      id: stableUserId,
      user_id: stableUserId,
      full_name: fullName,
      email,
      avatar_url: params.avatarUrl || null,
      role: 'user',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public static async recordSignup(params: {
    email: string;
    fullName: string;
    userId?: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    const email = params.email.trim().toLowerCase();
    const fullName = params.fullName.trim();

    // Reuse existing profile if email already registered
    const existing = await findExistingProfileByEmail(email);
    const stableUserId = existing?.user_id || toValidUUID(params.userId || email);

    const profileData = {
      user_id: stableUserId,
      email,
      full_name: fullName,
      avatar_url: params.avatarUrl || null,
      role: 'user',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        logger.warn('Failed to upsert profile on signup', { error: error.message });
      }

      try {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: stableUserId,
          action: 'USER_SIGNUP',
          resource_type: 'auth',
          metadata: {
            email,
            full_name: fullName,
            registered_at: new Date().toISOString(),
          },
        });
      } catch (logErr: any) {
        logger.warn('Failed to record signup audit log', { error: logErr?.message });
      }

      if (data) return data as UserProfile;
    } catch (err: any) {
      logger.error('Error during recordSignup', { message: err?.message });
    }

    return {
      id: stableUserId,
      user_id: stableUserId,
      full_name: fullName,
      email,
      avatar_url: params.avatarUrl || null,
      role: 'user',
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    };
  }

  public static async syncUserProfile(
    userId: string,
    email: string,
    fullName?: string,
    avatarUrl?: string
  ): Promise<UserProfile> {
    return this.recordLogin({ email, fullName, userId, avatarUrl });
  }
}
