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

export class AuthService {
  public static async recordLogin(params: {
    email: string;
    fullName?: string;
    userId?: string;
    avatarUrl?: string;
    provider?: string;
  }): Promise<UserProfile> {
    const email = params.email.trim().toLowerCase();
    const rawUserId = params.userId || email;
    const validUserId = toValidUUID(rawUserId);
    const fullName = params.fullName || email.split('@')[0];

    const profileData = {
      user_id: validUserId,
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
        logger.warn('Failed to upsert profile to database', { error: error.message });
      }

      try {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: validUserId,
          action: 'USER_LOGIN',
          resource_type: 'auth',
          metadata: {
            email,
            provider: params.provider || 'email',
            login_at: new Date().toISOString(),
          },
        });
      } catch (logErr: any) {
        logger.warn('Failed to record login audit log', { error: logErr?.message });
      }

      if (data) {
        return data as UserProfile;
      }
    } catch (err: any) {
      logger.error('Error during recordLogin in AuthService', { message: err?.message });
    }

    return {
      id: validUserId,
      user_id: validUserId,
      full_name: fullName,
      email,
      avatar_url: params.avatarUrl || null,
      role: 'user',
      created_at: new Date().toISOString(),
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
    const rawUserId = params.userId || email;
    const validUserId = toValidUUID(rawUserId);
    const fullName = params.fullName.trim();

    const profileData = {
      user_id: validUserId,
      email,
      full_name: fullName,
      avatar_url: params.avatarUrl || null,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        logger.warn('Failed to insert user profile on signup', { error: error.message });
      }

      try {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: validUserId,
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

      if (data) {
        return data as UserProfile;
      }
    } catch (err: any) {
      logger.error('Error during recordSignup in AuthService', { message: err?.message });
    }

    return {
      id: validUserId,
      user_id: validUserId,
      full_name: fullName,
      email,
      avatar_url: params.avatarUrl || null,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

