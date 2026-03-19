import { API_URL, getHeaders } from './base-client';

export const createCheckoutSession = async (userId: string, priceId: string) => {
  try {
    const res = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId, priceId }),
    });
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};
