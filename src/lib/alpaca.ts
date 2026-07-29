const ALPACA_API_KEY = process.env.ALPACA_API_KEY || '';
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY || '';
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';
const ALPACA_DATA_URL = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';

function getHeaders() {
  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    throw new Error('Las credenciales de Alpaca no están configuradas. Verifique ALPACA_API_KEY y ALPACA_SECRET_KEY.');
  }
  return {
    'APCA-API-KEY-ID': ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
    'Content-Type': 'application/json',
  };
}

export async function alpacaRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${ALPACA_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Alpaca API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function alpacaDataRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${ALPACA_DATA_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Alpaca Data API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export { ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL, ALPACA_DATA_URL };
