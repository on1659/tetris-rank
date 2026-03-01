// API 호출 모듈

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

export async function getRankings() {
  try {
    const res = await fetch(`${API_BASE}/api/rankings`);
    if (!res.ok) throw new Error('Failed to fetch rankings');
    return await res.json();
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
}

export async function saveRanking(data) {
  try {
    const res = await fetch(`${API_BASE}/api/rankings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save ranking');
    return await res.json();
  } catch (error) {
    console.error('Error saving ranking:', error);
    throw error;
  }
}
