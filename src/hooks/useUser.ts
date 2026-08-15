import { useState, useEffect } from 'react';
import { getCurrentUser } from '../data/users';
import type { User } from '../types';

export function useUser(): User {
  const [user, setUser] = useState<User>(() => getCurrentUser());

  useEffect(() => {
    const handleUserChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('storage', handleUserChange);
    window.addEventListener('insightai_user_updated', handleUserChange);

    return () => {
      window.removeEventListener('storage', handleUserChange);
      window.removeEventListener('insightai_user_updated', handleUserChange);
    };
  }, []);

  return user;
}
