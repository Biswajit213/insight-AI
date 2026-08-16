import type { User } from '../types';

export function getCurrentUser(): User {
  const savedEmail = localStorage.getItem('insightai_user_email');
  const savedToken = localStorage.getItem('insightai_token');
  let savedName = localStorage.getItem('insightai_user_name');
  const savedAvatar = localStorage.getItem('insightai_user_avatar') || undefined;

  if (savedEmail && savedToken) {
    if (!savedName) {
      const namePart = savedEmail.split('@')[0].replace(/[._-]/g, ' ');
      if (namePart) {
        savedName = namePart.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return {
      id: savedToken,
      name: savedName || 'Analytics User',
      email: savedEmail,
      avatar: savedAvatar,
      company: 'Acme Corporation',
      role: 'Senior Data Analyst',
      plan: 'pro',
      createdAt: new Date().toISOString(),
    };
  }

  // Fallback default guest user if no session in localStorage
  return {
    id: 'guest',
    name: 'Guest Analyst',
    email: 'guest@insightai.io',
    company: 'Acme Corporation',
    role: 'Senior Data Analyst',
    plan: 'pro',
    createdAt: '2025-03-15T00:00:00.000Z',
  };
}

const defaultUser: User = {
  id: 'guest',
  name: 'Guest Analyst',
  email: 'guest@insightai.io',
  company: 'Acme Corporation',
  role: 'Senior Data Analyst',
  plan: 'pro',
  createdAt: '2025-03-15T00:00:00.000Z',
};

export const currentUser: User = new Proxy(defaultUser, {
  get(target, prop: keyof User) {
    const user = getCurrentUser();
    return user[prop] ?? target[prop];
  },
});

export const teamMembers: User[] = [
  { id: 'u2', name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Data Scientist', plan: 'pro', createdAt: '2025-04-01T00:00:00.000Z' },
  { id: 'u3', name: 'Marcus Williams', email: 'm.williams@company.com', role: 'Business Analyst', plan: 'pro', createdAt: '2025-05-10T00:00:00.000Z' },
  { id: 'u4', name: 'Priya Sharma', email: 'p.sharma@company.com', role: 'Data Engineer', plan: 'pro', createdAt: '2025-06-20T00:00:00.000Z' },
];
