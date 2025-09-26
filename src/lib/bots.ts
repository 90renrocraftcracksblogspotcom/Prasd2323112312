export interface Bot {
  id: string;
  name: string;
  avatar: string;
  greeting: string;
  description: string;
  persona: string;
  userId: string;
}
export async function listBots(): Promise<Bot[]> {
  try {
    const response = await fetch('/api/v1/bots');
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error('Failed to fetch bots or invalid data format');
  } catch (error) {
    console.error('Error listing bots:', error);
    return []; // Return empty array on error to prevent UI crashes
  }
}
export async function getBot(id: string): Promise<Bot | null> {
  try {
    const response = await fetch(`/api/v1/bots/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching bot ${id}:`, error);
    return null; // Return null on error
  }
}
export async function createBot(botData: Omit<Bot, 'id' | 'userId'>): Promise<Bot | null> {
  try {
    const response = await fetch('/api/v1/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botData),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    console.error('Failed to create bot:', result.error);
    return null;
  } catch (error) {
    console.error('Error creating bot:', error);
    return null;
  }
}
export async function getMyBots(): Promise<Bot[]> {
  try {
    const response = await fetch('/api/v1/user/bots');
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error('Failed to fetch user bots or invalid data format');
  } catch (error) {
    console.error('Error listing user bots:', error);
    return [];
  }
}