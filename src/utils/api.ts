export const API_DATA_URL = '/api/data.json';
export const API_SAVE_URL = '/api/save.php';
export const API_UPLOAD_URL = '/api/upload.php';

export const apiPost = async (url: string, payload: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const apiGet = async (url: string) => {
  try {
    const response = await fetch(`${url}?t=${Date.now()}`); // Cache busting
    if (!response.ok) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  } catch (error) {
    console.warn('API Load Error:', error);
    return null;
  }
};
