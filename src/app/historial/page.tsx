'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL' | 'REBALANCE';
type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';
type FilterTab = 'all' | 'deposits' | 'withdrawals' | 'buys' | 'sells';

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amountUsd: number;
  status: TransactionStatus;
  createdAt: string;
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'deposits', label: 'Depósitos' },
  { id: 'withdrawals', label: 'Retiros' },
  { id: 'buys', label: 'Compras' },
  { id: 'sells', label: 'Ventas' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'BUY',
    description: 'Compra - VTI (25 acciones)',
    amountUsd: 250,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'BUY',
    description: 'Compra - BND (3.65 acciones)',
    amountUsd: 300,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'DEPOSIT',
    description: 'Depósito vía Bitcoin',
    amountUsd: 500,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'BUY',
    description: 'Compra - GLD (2.52 acciones)',
    amountUsd: 500,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'WITHDRAWAL',
    description: 'Retiro a Zelle',
    amountUsd: 150,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'DEPOSIT',
    description: 'Depósito vía Zelle',
    amountUsd: 250,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    type: 'REBALANCE',
    description: 'Rebalanceo automático del portafolio',
    amountUsd: 0,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    type: 'BUY',
    description: 'Compra - SPY (5 acciones)',
    amountUsd: 200,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '9',
    type: 'WITHDRAWAL',
    description: 'Retiro a PayPal',
    amountUsd: 100,
    status: 'FAILED',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const getTransactionIcon = (type: TransactionType): React.ReactNode => {
  switch (type) {
    case 'DEPOSIT':
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V15a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'WITHDRAWAL':
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V4a1 1 0 012 0v10.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'BUY':
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V9.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 8H12z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'SELL':
      return (
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 13a1 1 0 110 2h-5a1 1 0 01-1-1V9a1 1 0 112 0v3.586l4.293-4.293a1 1 0 011.414 1.414L4.414 12H8z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'REBALANCE':
      return (
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a1 1 0 102 0V6h10a1 1 0 100-2H4zm12 4a2 2 0 012 2v4a1 1 0 11-2 0v-4a1 1 0 01-1-1 1 1 0 011-1zm-2 6a1 1 0 100 2H4a1 1 0 100-2h10z" clipRule="evenodd" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

const getTransactionTypeLabel = (type: TransactionType): string => {
  switch (type) {
    case 'DEPOSIT':
      return 'Depósito';
    case 'WITHDRAWAL':
      return 'Retiro';
    case 'BUY':
      return 'Compra';
    case 'SELL':
      return 'Venta';
    case 'REBALANCE':
      return 'Rebalanceo';
    default:
      return '';
  }
};

const getStatusBadge = (status: TransactionStatus): { bgColor: string; textColor: string; label: string } => {
  switch (status) {
    case 'COMPLETED':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        label: 'Completado',
      };
    case 'PENDING':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        label: 'Pendiente',
      };
    case 'FAILED':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        label: 'Fallido',
      };
    default:
      return {
        bgColor: 'bg-surface-100',
        textColor: 'text-surface-600',
        label: 'Desconocido',
      };
  }
};

const filterTransactions = (transactions: Transaction[], filter: FilterTab): Transaction[] => {
  if (filter === 'all') return transactions;
  if (filter === 'deposits') return transactions.filter(t => t.type === 'DEPOSIT');
  if (filter === 'withdrawals') return transactions.filter(t => t.type === 'WITHDRAWAL');
  if (filter === 'buys') return transactions.filter(t => t.type === 'BUY');
  if (filter === 'sells') return transactions.filter(t => t.type === 'SELL');
  return transactions;
};

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/transacciones', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data.data?.transactions || MOCK_TRANSACTIONS);
        } else {
          setTransactions(MOCK_TRANSACTIONS);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setTransactions(MOCK_TRANSACTIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = filterTransactions(transactions, filter);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (newFilter: FilterTab) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-surface-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-surface-900">Historial de Transacciones</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Filter Tabs */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 mb-4 border-b border-surface-200">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={cn(
                  'px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap',
                  filter === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-surface-600 hover:text-surface-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" text="Cargando transacciones..." />
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && paginatedTransactions.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">No tienes transacciones aún</h3>
              <p className="text-surface-600 mb-6">
                Comienza a invertir para ver tu historial de transacciones aquí.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push('/depositar')} variant="primary">
                  Hacer un depósito
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions List */}
        {!loading && paginatedTransactions.length > 0 && (
          <Card>
            <div className="space-y-1 divide-y divide-surface-200 -mx-4 sm:-mx-4">
              {paginatedTransactions.map((transaction) => {
                const statusConfig = getStatusBadge(transaction.status);
                const isNegative = transaction.type === 'WITHDRAWAL' || transaction.type === 'SELL';

                return (
                  <div
                    key={transaction.id}
                    className="px-4 sm:px-4 py-4 flex items-center gap-4 hover:bg-surface-50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getTransactionIcon(transaction.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-surface-900">
                          {transaction.description}
                        </p>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          statusConfig.bgColor,
                          statusConfig.textColor
                        )}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>

                    {/* Amount */}
                    {transaction.amountUsd > 0 && (
                      <div className="flex-shrink-0 text-right">
                        <p className={cn(
                          'text-sm font-semibold',
                          isNegative ? 'text-red-600' : 'text-green-600'
                        )}>
                          {isNegative ? '-' : '+'}
                          {formatCurrency(transaction.amountUsd)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {!loading && filteredTransactions.length > itemsPerPage && (
          <Card>
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Anterior
              </Button>

              <div className="text-center">
                <p className="text-sm text-surface-600">
                  Página <span className="font-semibold text-surface-900">{currentPage}</span> de{' '}
                  <span className="font-semibold text-surface-900">{totalPages}</span>
                </p>
              </div>

              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Siguiente
              </Button>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-2 border-red-200">
            <div className="text-red-700">
              <p className="font-semibold mb-1">Error al cargar transacciones</p>
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
