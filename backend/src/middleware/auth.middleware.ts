import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const authenticateToken = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        const testUserHeader = req.headers['x-test-user-id'];
        if (testUserHeader) {
          req.user = {
            id: String(testUserHeader),
            email: 'test@insightai.com',
            role: 'user',
            profileId: String(testUserHeader),
          };
          return next();
        }
      }
      throw new UnauthorizedError('Missing or invalid Authorization header.');
    }

    const token = authHeader.split(' ')[1];

    // Dev mock tokens
    if (token === 'mock-token' || token === 'mock-user-token') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@insightai.com',
        role: 'user',
        profileId: '00000000-0000-0000-0000-000000000001',
      };
      return next();
    }

    // ── Strategy 1: Real Supabase JWT (Google OAuth) ──────────────────────
    const { data: { user }, error: jwtError } = await supabaseAdmin.auth.getUser(token);
    if (!jwtError && user) {
      req.user = {
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata?.role as 'user' | 'admin') || 'user',
        profileId: user.id,
      };
      return next();
    }

    // ── Strategy 2: Email-login UUID — match token to profiles.user_id ───
    if (UUID_REGEX.test(token)) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, email, role')
        .eq('user_id', token)
        .single();

      if (!profileError && profile) {
        req.user = {
          id: profile.user_id,
          email: profile.email || '',
          role: (profile.role as 'user' | 'admin') || 'user',
          profileId: profile.user_id,
        };
        return next();
      }
    }

    // ── Strategy 3: Token matches a non-UUID pattern — look up by email ───
    // This handles edge cases where an old non-UUID token is still in
    // localStorage. We look it up via the x-user-email header if present.
    const emailHeader = req.headers['x-user-email'] as string | undefined;
    if (emailHeader) {
      const { data: emailProfile, error: emailError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, email, role')
        .eq('email', emailHeader.trim().toLowerCase())
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!emailError && emailProfile) {
        req.user = {
          id: emailProfile.user_id,
          email: emailProfile.email || '',
          role: (emailProfile.role as 'user' | 'admin') || 'user',
          profileId: emailProfile.user_id,
        };
        return next();
      }
    }

    logger.warn('All auth strategies failed', { tokenPrefix: token.slice(0, 12) });
    throw new UnauthorizedError('Invalid or expired authentication token');
  } catch (err) {
    next(err);
  }
};
