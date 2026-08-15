export interface StoreLoginParams {
  email: string;
  fullName?: string;
  userId?: string;
  avatarUrl?: string;
  provider?: string;
}

export interface StoreSignupParams {
  email: string;
  fullName: string;
  userId?: string;
  avatarUrl?: string;
}

export async function storeLoginData(params: StoreLoginParams) {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        full_name: params.fullName,
        user_id: params.userId,
        avatar_url: params.avatarUrl,
        provider: params.provider || 'email',
      }),
    });
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('Backend store login failed, local fallback active:', err);
    return null;
  }
}

export async function storeSignupData(params: StoreSignupParams) {
  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        full_name: params.fullName,
        user_id: params.userId,
        avatar_url: params.avatarUrl,
      }),
    });
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('Backend store signup failed, local fallback active:', err);
    return null;
  }
}
