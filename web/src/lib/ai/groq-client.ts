interface CacheEntry {
  response: string;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 2000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function getGroqExplanation(prompt: string): Promise<string> {
  const enableGroq = process.env.ENABLE_GROQ === 'true';
  const apiKey = process.env.GROQ_API_KEY;

  if (!enableGroq || !apiKey || apiKey === 'gsk_placeholder_api_key') {
    return ''; // Disabled or unconfigured fallback
  }

  // Check cache
  const cached = cache.get(prompt);
  if (cached && Date.now() < cached.expiry) {
    return cached.response;
  }

  try {
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    }, 2000); // 2-second timeout

    if (!response.ok) {
      console.warn(`Groq API returned status ${response.status}`);
      return '';
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content?.trim() || '';
    
    if (result) {
      cache.set(prompt, {
        response: result,
        expiry: Date.now() + CACHE_TTL_MS
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to get explanation from Groq:', error);
    return ''; // Graceful fallback
  }
}
