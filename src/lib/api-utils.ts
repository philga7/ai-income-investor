export async function fetchJson(url: string, token: string | null) {
  if (!token) {
    throw new Error('Authentication token is not available.');
  }
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch ${url}: ${response.statusText} - ${errorBody}`);
  }
  return response.json();
} 