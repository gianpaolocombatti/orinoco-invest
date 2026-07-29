# Alpaca Integration - Quick Start Guide

## Setup

1. **Set Environment Variables** (`.env.local`):
```env
ALPACA_API_KEY=your_key_here
ALPACA_SECRET_KEY=your_secret_here
ALPACA_BASE_URL=https://api.alpaca.markets
ALPACA_DATA_URL=https://data.alpaca.markets
```

For paper trading:
```env
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

## Files Created

### 1. Core Library: `/src/lib/alpaca.ts`
Complete API client with methods for:
- Account info (`getAccount()`)
- Market data (`getLatestPrice()`, `getMultiplePrices()`, `getBars()`)
- Orders (`createOrder()`, `getOrder()`, `getOrders()`, `cancelOrder()`)
- Positions (`getPositions()`, `getPosition()`)
- Portfolio operations (`executeInvestment()`)

**Export:** `export const alpaca = getAlpacaClient()`

### 2. Utilities: `/src/lib/alpaca-utils.ts`
Helper functions for:
- Price formatting and display
- Portfolio calculations
- Asset class labels (Spanish)
- Order status formatting
- Mock data generation for testing

### 3. API Endpoints

#### Market Data (Public)
```
GET /api/alpaca/market-data
```
Query params: `?symbols=BND,VTI,GLD&history=true&period=1M&timeframe=1Day`

#### Orders (Authenticated)
```
POST /api/alpaca/orders
Body: { amount: 100 }
```
Automatically calculates allocation and executes investment.

#### Account (Authenticated)
```
GET /api/alpaca/account
```
Returns balance, buying power, equity, and portfolio value.

## Quick Examples

### Get Market Prices (Frontend)
```typescript
const prices = await fetch('/api/alpaca/market-data?symbols=BND,VTI,GLD')
  .then(r => r.json())
  .then(r => r.data.prices);
```

### Execute Investment (Frontend)
```typescript
const response = await fetch('/api/alpaca/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ amount: 100 }),
});
const { data } = await response.json();
console.log(data.orders); // Array of executed orders
```

### Fetch Prices (Backend)
```typescript
import { alpaca } from '@/lib/alpaca';

const prices = await alpaca.getMultiplePrices(['BND', 'VTI', 'GLD']);
// Returns: { BND: 81.45, VTI: 245.32, GLD: 182.15 }
```

### Execute Investment (Backend)
```typescript
import { alpaca } from '@/lib/alpaca';

const result = await alpaca.executeInvestment(500, 'MODERADO');
console.log(result.orders);      // Alpaca orders
console.log(result.allocations); // Asset allocations
```

### Use Utility Functions
```typescript
import {
  formatPrice,
  calculatePortfolioValue,
  getAssetInfo,
  formatOrderStatus,
} from '@/lib/alpaca-utils';

formatPrice(81.45);                           // "$81.45"
getAssetInfo('BND').spanishName;              // "Fondo de Bonos"
formatOrderStatus('filled');                  // "Completada"
calculatePortfolioValue([...holdings]).totalValue; // Portfolio value
```

## API Response Format

All endpoints return:
```json
{
  "success": true/false,
  "data": { /* response data */ },
  "error": "Spanish error message (if success=false)"
}
```

## Portfolio Allocations

### CONSERVADOR
- BND (Bonds): 60%
- VTI (Stocks): 30%
- GLD (Gold): 10%

### MODERADO
- BND (Bonds): 40%
- VTI (Stocks): 50%
- GLD (Gold): 10%

### AGRESIVO
- BND (Bonds): 20%
- VTI (Stocks): 70%
- GLD (Gold): 10%

## Database Integration

Orders and transactions are automatically logged:
- `Transaction` records created for each buy order
- `Holding` records updated with new shares
- `alpacaOrderId` stored for tracking
- `Portfolio.updatedAt` updated on success

## Error Messages (Spanish)

Common errors returned:
- `"Autenticación requerida"` - Missing JWT token
- `"El monto mínimo de inversión es $5 USD"` - Too small
- `"El monto máximo de inversión es $10,000 USD"` - Too large
- `"No se encontró portafolio del usuario"` - Portfolio not created
- `"Error al obtener precios del mercado"` - Alpaca API error

## Testing

### Test with cURL
```bash
# Get market prices
curl "http://localhost:3000/api/alpaca/market-data"

# Get market prices with history
curl "http://localhost:3000/api/alpaca/market-data?history=true&period=3M"

# Get account (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/alpaca/account

# Execute investment (with token)
curl -X POST http://localhost:3000/api/alpaca/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":100}'
```

## Development Tips

1. **Paper Trading**: Change `ALPACA_BASE_URL` to paper trading endpoint
2. **Retry Logic**: Use `fetchMarketDataWithRetry()` for better reliability
3. **Mock Data**: Use `generateMockPrices()` and `generateMockBars()` for UI testing
4. **Rate Limits**: Alpaca has rate limits - implement caching for prices
5. **Order Status**: Check order status with `getOrder()` before assuming filled

## Common Issues

**"Cannot find module '@/lib/portfolio'"**
- This is expected - import paths are correct for the project

**"TypeError: fetch is not defined"**
- Only in Node.js < 18; Next.js 14 provides global fetch

**"Alpaca API 401"**
- Verify `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` are correct
- Check if credentials match the environment (paper vs. live)

**"No positions found"**
- Normal if no orders have been executed yet
- Check order status with `/api/alpaca/account`

## Next Steps

1. Create dashboard components to display prices
2. Build investment form for users
3. Add portfolio performance charts
4. Implement order history view
5. Create account balance widget
6. Add rebalancing logic
7. Set up webhooks for order updates

## Full Documentation

See `/docs/ALPACA_INTEGRATION.md` for complete API reference.
