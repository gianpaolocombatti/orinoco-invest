'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency, formatPercent, getRelativeTime } from '@/lib/utils';
import { Portfolio, Holding, Transaction, TransactionType } from '@/types/index';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

interface TransactionWithDetails extends Transaction {
  icon: string;
}

const MOCK_CHART_DATA: ChartDataPoint[] = [
  { date: '1 Ene', value: 1100 },
  { date: '5 Ene', value: 1115 },
  { date: '10 Ene', value: 1125 },
  { date: '15 Ene', value: 1118 },
  { date: '20 Ene', value: 1140 },
  { date: '25 Ene', value: 1165 },
  { date: '30 Ene', value: 1180 },
  { date: '3 Feb', value: 1200 },
  { date: '7 Feb', value: 1220 },
  { date: '11 Feb', value: 1250.75 },
];

const MOCK_HOLDINGS: Holding[] = [
  {
    id: '1',
    portfolioId: 'port-1',
    assetSymbol: 'BND',
    assetName: 'Bonos (BND)',
    assetClass: 'BONDS',
    shares: 45.5,
    costBasis: 80.15,
    currentPrice: 82.30,
    currentValue: 3744.65,
    gainLoss: 97.48,
    gainLossPercentage: 2.67,
  },
  {
    id: '2',
    portfolioId: 'port-1',
    assetSymbol: 'VTI',
    assetName: 'Acciones (VTI)',
    assetClass: 'STOCKS',
    shares: 25.2,
    costBasis: 220.40,
    currentPrice: 245.80,
    currentValue: 6194.16,
    gainLoss: 644.08,
    gainLossPercentage: 11.61,
  },
  {
    id: '3',
    portfolioId: 'port-1',
    assetSymbol: 'GLD',
    assetName: 'Oro (GLD)',
    assetClass: 'GOLD',
    shares: 8.33,
    costBasis: 190.25,
    currentPrice: 198.50,
    currentValue: 1653.41,
    gainLoss: 68.50,
    gainLossPercentage: 4.33,
  },
];

const MOCK_TRANSACTIONS: TransactionWithDetails[] = [
  {
    id: '1',
    userId: 'user-1',
    type: 'BUY' as TransactionType,
    amountUsd: 250,
    asset: 'Acciones (VTI)',
    assetSymbol: 'VTI',
    shares: 1.02,
    pricePerShare: 245.80,
    description: 'Compra - VTI',
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'buy',
  },
  {
    id: '2',
    userId: 'user-1',
    type: 'BUY' as TransactionType,
    amountUsd: 300,
    asset: 'Bonos (BND)',
    assetSymbol: 'BND',
    shares: 3.65,
    pricePerShare: 82.30,
    description: 'Compra - BND',
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'buy',
  },
  {
    id: '3',
    userId: 'user-1',
    type: 'BUY' as TransactionType,
    amountUsd: 500,
    asset: 'Oro (GLD)',
    assetSymbol: 'GLD',
    shares: 2.52,
    pricePerShare: 198.50,
    description: 'Compra - GLD',
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'buy',
  },
  {
    id: '4',
    userId: 'user-1',
    type: 'BUY' as TransactionType,
    amountUsd: 150,
    asset: 'Depósito vía Zelle',
    assetSymbol: 'DEPOSIT',
    shares: 0,
    pricePerShare: 0,
    description: 'Depósito vía Zelle',
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'deposit',
  },
  {
    id: '5',
    userId: 'user-1',
    type: 'SELL' as TransactionType,
    amountUsd: 50,
    asset: 'Retiro a Banco',
    assetSymbol: 'WITHDRAWAL',
    shares: 0,
    pricePerShare: 0,
    description: 'Retiro a Banco',
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'withdrawal',
  },
];

const ALLOCATION_COLORS = {
  BONDS: '#3b82f6',    // blue
  STOCKS: '#10b981',   // green
  GOLD: '#f59e0b',     // amber
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'1S' | '1M' | '3M' | 'Todo'>('1M');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
        });

        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            router.push('/');
            return;
          }
          throw new Error('Error al cargar datos del usuario');
        }

        const userData = await userResponse.json();
        setUser(userData.data.user);

        // Fetch portfolio data
        const portfolioResponse = await fetch('/api/portafolio', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
        });

        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          setPortfolio(portfolioData.data);
        } else if (portfolioResponse.status === 404) {
          // No portfolio yet — send the user through risk assessment so one
          // gets auto-selected for them instead of rendering a blank/mismatched state.
          router.push('/evaluacion');
          return;
        }

        // Fetch recent transactions
        const transactionsResponse = await fetch('/api/transacciones?limit=5', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
        });

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData.data?.transactions || MOCK_TRANSACTIONS);
        } else {
          setTransactions(MOCK_TRANSACTIONS);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        // Set mock data for MVP
        setUser({
          id: 'user-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        });
        setPortfolio({
          id: 'port-1',
          userId: 'user-1',
          portfolioType: 'BALANCEADO',
          totalValueUsd: 11592.22,
          totalCostBasis: 11441.47,
          lastRebalanced: new Date().toISOString(),
          holdings: MOCK_HOLDINGS,
          gainLoss: 150.75,
          gainLossPercentage: 1.318,
        });
        setTransactions(MOCK_TRANSACTIONS);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <LoadingSpinner size="lg" text="Cargando tu dashboard..." />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-surface-900 mb-2">Error</h2>
            <p className="text-surface-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} fullWidth>
              Volver al login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-surface-900 mb-2">Sesión expirada</h2>
            <p className="text-surface-600 mb-4">Por favor inicia sesión nuevamente</p>
            <Button onClick={() => router.push('/')} fullWidth>
              Ir a Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalValue = portfolio?.totalValueUsd || 0;
  const gainLoss = portfolio?.gainLoss || 0;
  const gainLossPercentage = portfolio?.gainLossPercentage || 0;
  const isPositive = gainLoss >= 0;
  const holdings = portfolio?.holdings || MOCK_HOLDINGS;

  // Calculate allocation percentages
  const allocationByClass = holdings.reduce((acc, holding) => {
    const current = acc[holding.assetClass] || 0;
    return {
      ...acc,
      [holding.assetClass]: current + holding.currentValue,
    };
  }, {} as Record<string, number>);

  const allocationPercentages = Object.entries(allocationByClass).map(([key, value]) => ({
    name: key,
    value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
    amount: value,
    color: ALLOCATION_COLORS[key as keyof typeof ALLOCATION_COLORS] || '#6b7280',
  }));

  const chartData = MOCK_CHART_DATA;

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(today);

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
              Hola, {user.firstName}
            </h1>
            <p className="text-sm text-surface-500 capitalize mt-1">{formattedDate}</p>
          </div>
          <button
            className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            aria-label="Notificaciones"
          >
            <svg
              className="w-6 h-6 text-surface-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Portfolio Value Card */}
        <Card className="bg-gradient-to-br from-brand-primary to-brand-800 text-white">
          <div className="space-y-6">
            {/* Value Display */}
            <div>
              <p className="text-sm text-blue-100 mb-2">Valor Total del Portafolio</p>
              <h2 className="text-4xl sm:text-5xl font-bold">{formatCurrency(totalValue)}</h2>
              <div className={cn(
                'flex items-center gap-2 mt-3 text-lg font-semibold',
                isPositive ? 'text-green-200' : 'text-red-200'
              )}>
                <span>{isPositive ? '+' : ''}{formatCurrency(gainLoss)}</span>
                <span>({isPositive ? '+' : ''}{gainLossPercentage.toFixed(2)}%)</span>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 bg-white/10 p-1 rounded-lg w-fit">
              {(['1S', '1M', '3M', 'Todo'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={cn(
                    'px-4 py-2 rounded-md font-medium transition-colors text-sm',
                    chartPeriod === period
                      ? 'bg-white text-brand-primary'
                      : 'text-white/70 hover:text-white'
                  )}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="h-64 w-full -mx-4 -mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.6)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.6)"
                    style={{ fontSize: '12px' }}
                    domain={['dataMin - 50', 'dataMax + 50']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value) => formatCurrency(value as number)}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={3}
                    dot={false}
                    fill="url(#colorValue)"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Portfolio Breakdown Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-surface-900 px-4 sm:px-0">Tu Portafolio</h3>

          {/* Allocation Bar */}
          <Card>
            <div className="space-y-4">
              {/* Stacked Bar Chart */}
              <div className="h-12 rounded-lg overflow-hidden flex">
                {allocationPercentages.map((allocation) => (
                  <div
                    key={allocation.name}
                    style={{
                      flex: allocation.value,
                      backgroundColor: allocation.color,
                    }}
                    className="transition-opacity hover:opacity-80"
                    title={`${allocation.name}: ${allocation.value}%`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                {allocationPercentages.map((allocation) => (
                  <div key={allocation.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: allocation.color }}
                    />
                    <span className="text-surface-600">{allocation.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Holdings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {holdings.map((holding) => (
              <Card key={holding.id} hoverable className="cursor-default">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-surface-900">{holding.assetName}</h4>
                    <p className="text-sm text-surface-500">{holding.shares.toFixed(2)} acciones</p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-surface-900">
                      {formatCurrency(holding.currentValue)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-200">
                    <span className="text-sm text-surface-600">Ganancia/Pérdida</span>
                    <span className={cn(
                      'font-semibold',
                      (holding.gainLossPercentage || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}>
                      {(holding.gainLossPercentage || 0) >= 0 ? '+' : ''}
                      {holding.gainLossPercentage?.toFixed(2)}%
                    </span>
                  </div>

                  <div className="text-xs text-surface-500">
                    {totalValue > 0 ? ((holding.currentValue / totalValue) * 100).toFixed(1) : '0.0'}% de portafolio
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/depositar">
            <Button variant="primary" fullWidth className="h-14 text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Depositar
            </Button>
          </Link>
          <Link href="/retirar">
            <Button variant="secondary" fullWidth className="h-14 text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4h6a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h6" />
              </svg>
              Retirar
            </Button>
          </Link>
        </div>

        {/* Recent Transactions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 sm:px-0">
            <h3 className="text-xl font-semibold text-surface-900">Actividad Reciente</h3>
            <Link href="/historial" className="text-sm text-brand-primary hover:text-brand-700 font-medium">
              Ver todo
            </Link>
          </div>

          <Card>
            <div className="space-y-3 divide-y divide-surface-200 -mx-4 sm:-mx-4">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="px-4 sm:px-4 py-3 flex items-center gap-4 hover:bg-surface-50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {transaction.type === 'BUY' ? (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V9.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 8H12z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : transaction.type === 'SELL' ? (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V15a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900">{transaction.description}</p>
                      <p className="text-xs text-surface-500">{getRelativeTime(transaction.createdAt)}</p>
                    </div>

                    {/* Amount */}
                    <div className="flex-shrink-0 text-right">
                      <p className={cn(
                        'text-sm font-semibold',
                        transaction.type === 'SELL' || transaction.type === 'BUY'
                          ? 'text-surface-900'
                          : 'text-green-600'
                      )}>
                        {transaction.type === 'SELL' ? '-' : '+'}
                        {formatCurrency(transaction.amountUsd)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 sm:px-4 py-8 text-center">
                  <p className="text-surface-500">No hay transacciones recientes</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Empty State */}
        {!portfolio && (
          <Card className="bg-blue-50 border-2 border-blue-200">
            <div className="text-center space-y-4">
              <div className="text-5xl">🎯</div>
              <h3 className="text-lg font-semibold text-surface-900">Aún no has creado tu portafolio</h3>
              <p className="text-surface-600">
                Comienza a invertir hoy mismo seleccionando una estrategia de inversión que se adapte a ti.
              </p>
              <Link href="/portafolios">
                <Button variant="primary">
                  Crear Portafolio
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
