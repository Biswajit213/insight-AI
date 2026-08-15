export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedUser {
  id: string; // Supabase auth user UUID
  email: string;
  role: 'user' | 'admin';
  profileId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
