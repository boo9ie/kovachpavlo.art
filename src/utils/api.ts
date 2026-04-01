export const API_DATA_URL = '/api/content.php';
export const API_SAVE_URL = '/api/save.php';
export const API_UPLOAD_URL = '/api/upload.php';
export const API_LOGIN_URL = '/api/login.php';
export const API_LOGOUT_URL = '/api/logout.php';
export const API_AUTH_STATUS_URL = '/api/auth-status.php';

export const apiPost = async (url: string, payload: any) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || (response.status === 401 ? 'Unauthorized' : 'Request failed'));
  }

  return data;
};

export const apiGet = async (url: string) => {
  try {
    const response = await fetch(`${url}?t=${Date.now()}`, {
      credentials: 'include'
    });
    if (!response.ok) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  } catch {
    return null;
  }
};
