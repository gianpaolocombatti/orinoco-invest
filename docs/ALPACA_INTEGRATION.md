# Alpaca Markets API Integration

Complete Alpaca Markets integration for Orinoco Invest micro-investing platform (Next.js 14).

## Overview

This integration provides a full-featured Alpaca API client and RESTful endpoints for executing investments, retrieving market data, and managing orders through the Orinoco Invest platform.

## Files Created

### 1. `/src/lib/alpaca.ts`
**Complete Alpaca API Client Class**

Core client library for all Alpaca API interactions. Exports a singleton `AlpacaClient` instance.

#### Key Classes and Types

**AlpacaClient**
- Private: `apiKey`, `secretKey`, `baseUrl`, `dataUrl`
- Constructor reads from environment variables:
  - `ALPACA_API_KEY`
  - `ALPACA_SECRET_KEY`
  - `ALPACA_BASE_URL` (default: https://api.alpaca.markets)
  - `ALPACA_DATA_URL` (default: https://data.alpaca.markets)

#### Account Methods
```typescript
getAccount(): Promise<AlpacaAccount>
```
Retrieves current Alpaca account information (balance, buying power, equity).

#### Market Data Methods
```typescript
getLatestPrice(symbol: string): Promise<number>
getMultiplePrices(symbols: string[]): Promise<Record<string, number>>
getBars(
  symbol: string,
  timeframe: '1Day' | '1Week' | '1Month',
  start: string,
  end: string
): Promise<AlpacaBar[]>
```
- `getLatestPrice()`: Returns current ask price for single symbol
- `getMultiplePrices()`: Batch fetch prices for up to 50 symbols
- `getBars()`: Retrieve OHLCV historical data for charting

#### Order Methods
```typescript
createOrder(params: {
  symbol: string;
  qty?: number;
  notional?: number; // dollar amount for fractional shares
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  time_in_force: 'day' | 'gtc';
  limit_price?: number;
}): Promise<AlpacaOrder>

getOrder(orderId: string): Promise<AlpacaOrder>
getOrders(status?: 'open' | 'closed' | 'all'): Promise<AlpacaOrder[]>
cancelOrder(orderId: string): Promise<void>
```

#### Position Methods
```typescript
getPositions(): Promise<AlpacaPosition[]>
getPosition(symbol: string): Promise<AlpacaPosition>
```

#### Portfolio Operations (Orinoco Invest Specific)
```typescript
executeInvestment(
  amount: number,
  portfolioType: 'CONSERVADOR' | 'MODERADO' | 'AGRESIVO'
): Promise<{
  orders: AlpacaOrder[];
  allocations: Array<{ symbol: string; amount: number; percentage: number }>;
}>
```

**Key Features:**
- Automatically calculates asset allocation based on portfolio type
- Fetches current prices for all assets
- Creates market orders with fractional share support (notional amount)
- Returns detailed order information and allocation breakdown
- Throws `AlpacaError` with descriptive Spanish error messages

#### Type Definitions

**AlpacaAccount**
```typescript
{
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  equity: number;
  multiplier: number;
}
```

**AlpacaOrder**
```typescript
{
  id: string;
  symbol: string;
  qty?: number;
  filled_qty: number;
  filled_avg_price?: number;
  side: 'buy' | 'sell';
  status: string;
  created_at: string;
  filled_at?: string;
  // ... additional fields
}
```

**AlpacaBar**
```typescript
{
  t: string; // ISO timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  n?: number; // trade count
  vw?: number; // volume weighted average price
}
```

**AlpacaPosition**
```typescript
{
  symbol: string;
  qty: number;
  avg_entry_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_gain: string;
  unrealized_gain_pct: string;
  current_price: string;
}
```

**AlpacaError**
- Custom error class extending Error
- Includes `statusCode` and `response` properties
- All error messages in Spanish

#### Singleton Export
```typescript
export const alpaca = getAlpacaClient();
```
A singleton instance is exported for use throughout the application.

---

### 2. `/src/app/api/alpaca/market-data/route.ts`
**Public Market Data Endpoint**

GET endpoint for market data (no authentication required).

#### Endpoint
```
GET /api/alpaca/market-data
```

#### Query Parameters
- `symbols` (optional): Comma-separated symbol list (default: "BND,VTI,GLD")
- `history` (optional): Boolean to include historical bars (default: false)
- `timeframe` (optional): '1Day', '1Week', '1Month' (default: '1Day')
- `period` (optional): '1M', '3M', '6M', '1Y' (default: '1M')

#### Example Requests
```bash
# Get latest prices for default assets
curl https://acorns-ve.com/api/alpaca/market-data

# Get prices with custom symbols
curl https://acorns-ve.com/api/alpaca/market-data?symbols=BND,VTI,GLD,SPY

# Get prices with historical data
curl https://acorns-ve.com/api/alpaca/market-data?history=true&period=3M
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "prices": [
      {
        "symbol": "BND",
        "price": 81.45,
        "timestamp": "2026-02-11T04:30:00.000Z"
      },
      // ... more prices
    ],
    "timestamp": "2026-02-11T04:30:00.000Z",
    "historical": {
      "BND": [
        {
          "t": "2025-11-11T00:00:00.000Z",
          "o": 80.5,
          "h": 81.2,
          "l": 80.3,
          "c": 81.0,
          "v": 1250000,
          "vw": 80.8
        }
        // ... more bars
      ]
    },
    "period": "3M",
    "timeframe": "1Day"
  }
}
```

#### Features
- Fetches latest prices for specified symbols
- Optionally includes historical OHLCV data for charting
- Graceful handling of individual symbol fetch failures
- Max 50 symbols per request (API limits)
- Descriptive error messages in Spanish

---

### 3. `/src/app/api/alpaca/orders/route.ts`
**Investment Order Execution Endpoint**

POST endpoint for executing investment orders (authentication required).

#### Endpoint
```
POST /api/alpaca/orders
```

#### Authentication
Requires valid JWT token in:
- `Authorization: Bearer <token>` header, OR
- `acorns_token` cookie

#### Request Body
```json
{
  "amount": 100.50
}
```

#### Validation
- Amount must be a positive number
- Minimum: $5 USD
- Maximum: $10,000 USD
- User must have portfolio created

#### Workflow
1. Verifies user authentication
2. Retrieves user's portfolio and profile
3. Validates investment amount
4. Calls `alpaca.executeInvestment()` with user's portfolio type
5. Creates orders for each asset class based on allocation
6. Logs transactions in database
7. Updates portfolio holdings

#### Example Response
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "20260211-abc123",
        "symbol": "BND",
        "side": "buy",
        "status": "filled",
        "filled_qty": 1.5,
        "filled_avg_price": "81.45",
        "created_at": "2026-02-11T04:30:00Z"
      },
      // ... more orders (one per asset class)
    ],
    "allocations": [
      {
        "symbol": "BND",
        "amount": 60.30,
        "percentage": 60
      },
      {
        "symbol": "VTI",
        "amount": 30.15,
        "percentage": 30
      },
      {
        "symbol": "GLD",
        "amount": 10.05,
        "percentage": 10
      }
    ],
    "transactions": [
      {
        "id": "txn_123",
        "symbol": "BND",
        "shares": 1.5,
        "amountUsd": 60.30,
        "status": "COMPLETED",
        "alpacaOrderId": "20260211-abc123",
        "createdAt": "2026-02-11T04:30:00Z"
      }
      // ... more transactions
    ],
    "totalInvested": 100.50,
    "portfolioType": "MODERADO"
  }
}
```

#### Database Logging
- Creates `Transaction` records for each order
- Updates `Holding` records with new shares and prices
- Stores Alpaca order ID for order tracking
- Captures fill price and quantity

#### Portfolio Allocations
Allocations are calculated based on portfolio type:

**CONSERVADOR** (Conservative)
- Bonds (BND): 60%
- Stocks (VTI): 30%
- Gold (GLD): 10%

**MODERADO** (Moderate)
- Bonds (BND): 40%
- Stocks (VTI): 50%
- Gold (GLD): 10%

**AGRESIVO** (Aggressive)
- Bonds (BND): 20%
- Stocks (VTI): 70%
- Gold (GLD): 10%

#### Error Handling
Returns 400/401/404/500 with descriptive Spanish error messages:
- "Autenticación requerida" (401)
- "No se encontró portafolio del usuario" (404)
- "El monto mínimo de inversión es $X USD" (400)
- "El monto máximo de inversión es $X USD" (400)
- Error messages from Alpaca API (500)

---

### 4. `/src/app/api/alpaca/account/route.ts`
**Account Information Endpoint**

GET endpoint for retrieving Alpaca account details (authentication required).

#### Endpoint
```
GET /api/alpaca/account
```

#### Authentication
Requires valid JWT token (same as orders endpoint).

#### Response Format
```json
{
  "success": true,
  "data": {
    "id": "PA...",
    "accountNumber": "123456789",
    "status": "ACTIVE",
    "currency": "USD",
    "cash": {
      "amount": 5000.00,
      "currency": "USD"
    },
    "buyingPower": {
      "amount": 10000.00,
      "currency": "USD"
    },
    "portfolio": {
      "equity": 15000.00,
      "value": 15000.00,
      "currency": "USD"
    },
    "leverage": 2.0,
    "lastUpdated": "2026-02-11T04:30:00.000Z"
  }
}
```

#### Use Cases
- Display account summary in dashboard
- Check available buying power before placing orders
- Monitor account equity and portfolio value
- Admin/verification endpoints

#### Error Handling
- Returns 401 if not authenticated
- Returns 500 with descriptive error if Alpaca API call fails

---

## Environment Variables

Add to `.env.local`:

```env
# Alpaca Markets API
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://api.alpaca.markets
ALPACA_DATA_URL=https://data.alpaca.markets
```

For paper trading:
```env
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

---

## Integration with Existing Systems

### Database
- Logs transactions in `Transaction` model
- Updates `Holding` records for portfolio tracking
- Stores `alpacaOrderId` for cross-referencing
- Updates `Portfolio.updatedAt` on successful investment

### Authentication
- Uses existing `getAuthUser()` function from `@/lib/auth`
- Validates JWT tokens from headers or cookies
- Returns 401 for unauthenticated requests

### Portfolio System
- Integrates with `@/lib/portfolio` for allocations
- Uses `calculateOrderAllocations()` to determine splits
- Supports all three portfolio types (CONSERVADOR, MODERADO, AGRESIVO)
- Works with ETF symbols: BND (Bonds), VTI (Stocks), GLD (Gold)

### Asset Classes
Mapped in portfolio.ts:
- `BONDS` -> BND (Vanguard Total Bond Market ETF)
- `STOCKS` -> VTI (Vanguard Total Stock Market ETF)
- `GOLD` -> GLD (SPDR Gold Shares ETF)

---

## Usage Examples

### Client-Side (Frontend)

```typescript
// Get latest prices
const response = await fetch('/api/alpaca/market-data?symbols=BND,VTI,GLD');
const { data } = await response.json();

// Get prices with 3-month history for charts
const response = await fetch(
  '/api/alpaca/market-data?history=true&period=3M&timeframe=1Day'
);
const { data } = await response.json();

// Execute investment
const response = await fetch('/api/alpaca/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ amount: 100 }),
});
const { data } = await response.json();

// Get account info
const response = await fetch('/api/alpaca/account', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const { data } = await response.json();
```

### Server-Side (Backend)

```typescript
import { alpaca } from '@/lib/alpaca';

// Get single price
const price = await alpaca.getLatestPrice('BND');

// Get multiple prices
const prices = await alpaca.getMultiplePrices(['BND', 'VTI', 'GLD']);

// Get historical data
const bars = await alpaca.getBars('VTI', '1Day', '2026-02-01', '2026-02-11');

// Execute investment with automatic allocation
const result = await alpaca.executeInvestment(250, 'MODERADO');

// Get account info
const account = await alpaca.getAccount();

// Create custom order
const order = await alpaca.createOrder({
  symbol: 'AAPL',
  notional: 100,
  side: 'buy',
  type: 'market',
  time_in_force: 'day',
});
```

---

## Error Handling

All endpoints return standard JSON response format:

```json
{
  "success": false,
  "error": "Descripción del error en español"
}
```

Common error messages:
- `"Autenticación requerida"` - Missing or invalid JWT token
- `"El cuerpo de la solicitud no es un JSON válido"` - Invalid JSON body
- `"Error de validación"` - Failed schema validation
- `"Portafolio no encontrado"` - User portfolio not created
- Alpaca API errors passed through with Spanish context

---

## Security Considerations

1. **API Keys**: Never commit credentials to version control
2. **Authentication**: All trading endpoints require JWT authentication
3. **Market Data**: Public endpoint (no auth), suitable for frontend caching
4. **SQL Injection**: Database operations use Prisma ORM with parameterized queries
5. **Rate Limiting**: Consider implementing rate limiting on order endpoint
6. **Fractional Shares**: Supported via `notional` parameter, not all stocks eligible
7. **Market Hours**: Orders execute during market hours; consider order queue behavior

---

## Testing

### Test Market Data Endpoint
```bash
curl https://your-domain.com/api/alpaca/market-data

# With parameters
curl "https://your-domain.com/api/alpaca/market-data?symbols=BND,VTI&history=true&period=1M"
```

### Test with Paper Trading
Ensure environment variables use paper trading endpoints:
```env
ALPACA_BASE_URL=https://paper-api.alpaca.markets
ALPACA_DATA_URL=https://data.alpaca.markets  # Data API is same for paper/live
```

---

## Future Enhancements

1. Order status polling and webhooks
2. Dividend tracking and reinvestment
3. Tax lot tracking for capital gains calculation
4. Portfolio rebalancing automation
5. Advanced order types (stop-loss, trailing stops)
6. Real-time price updates via WebSocket
7. Performance analytics and attribution
8. Risk metrics calculation (Sharpe ratio, max drawdown)

---

## Support

For Alpaca API documentation, visit: https://docs.alpaca.markets
