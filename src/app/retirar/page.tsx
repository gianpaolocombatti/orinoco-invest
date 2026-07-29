'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, calculateFee, calculateNetAmount, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type WithdrawalMethod = 'crypto_btc' | 'crypto_usdt' | 'zelle' | 'paypal' | null;

interface WithdrawalFormData {
  amount: number;
  method: WithdrawalMethod;
  destination: string;
}

const FEE_RATE = 0.01;

const WITHDRAWAL_METHODS = [
  {
    id: 'crypto_btc' as WithdrawalMethod,
    name: 'Bitcoin (BTC)',
    description: 'Retiro a wallet Bitcoin',
    icon: '₿',
    color: 'from-orange-400 to-orange-600',
    destinationLabel: 'Dirección de wallet Bitcoin',
    destinationPlaceholder: 'bc1q...',
  },
  {
    id: 'crypto_usdt' as WithdrawalMethod,
    name: 'USDT (TRC-20)',
    description: 'Retiro a wallet USDT',
    icon: '₮',
    color: 'from-green-400 to-green-600',
    destinationLabel: 'Dirección USDT (TRC-20)',
    destinationPlaceholder: 'T...',
  },
  {
    id: 'zelle' as WithdrawalMethod,
    name: 'Zelle',
    description: 'Transferencia bancaria EE.UU.',
    icon: '🏦',
    color: 'from-blue-400 to-blue-600',
    destinationLabel: 'Correo electrónico Zelle',
    destinationPlaceholder: 'ejemplo@email.com',
  },
  {
    id: 'paypal' as WithdrawalMethod,
    name: 'PayPal',
    description: 'Pago vía PayPal',
    icon: '🅿️',
    color: 'from-blue-500 to-blue-700',
    destinationLabel: 'Correo electrónico PayPal',
    destinationPlaceholder: 'ejemplo@email.com',
  },
];

export default function WithdrawalPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number>(1250.75);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: 0,
    method: null,
    destination: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

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

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setBalanceLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/portafolio', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBalance(data.data?.totalValueUsd || 1250.75);
        }
      } catch (err) {
        console.error('Error fetching balance:', err);
        // Use default balance
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
  }, []);

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData({ ...formData, amount: numValue });
    setError(null);
  };

  const handlePercentageClick = (percentage: number) => {
    const amount = (balance * percentage) / 100;
    setFormData({ ...formData, amount });
    setError(null);
  };

  const handleMethodSelect = (method: WithdrawalMethod) => {
    setFormData({ ...formData, method });
    setError(null);
  };

  const handleDestinationChange = (value: string) => {
    setFormData({ ...formData, destination: value });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (formData.amount <= 0) {
      setError('Por favor ingresa un monto válido');
      return false;
    }

    if (formData.amount > balance) {
      setError('No tienes suficiente saldo para este retiro');
      return false;
    }

    if (!formData.method) {
      setError('Por favor selecciona un método de retiro');
      return false;
    }

    if (!formData.destination.trim()) {
      setError('Por favor ingresa el destino del retiro');
      return false;
    }

    return true;
  };

  const handleSubmitWithdrawal = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/retiros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: formData.amount,
          method: formData.method,
          destination: formData.destination,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar el retiro');
      }

      const data = await response.json();
      setSuccessData({
        ...data,
        amount: formData.amount,
        fee: calculateFee(formData.amount, FEE_RATE),
        netAmount: calculateNetAmount(formData.amount, FEE_RATE),
        method: formData.method,
        destination: formData.destination,
      });
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el retiro');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Success Modal
  if (showSuccess && successData) {
    const methodConfig = WITHDRAWAL_METHODS.find(m => m.id === successData.method);
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 py-8">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Solicitud de retiro recibida</h2>
              <p className="text-surface-600">Tu retiro será procesado en 3-5 días hábiles</p>
            </div>

            {/* Withdrawal Summary */}
            <Card className="bg-surface-100">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-600">Monto a retirar:</span>
                  <span className="font-semibold text-surface-900">{formatCurrency(successData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600">Comisión:</span>
                  <span className="font-semibold text-surface-900">-{formatCurrency(successData.fee)}</span>
                </div>
                <div className="border-t border-surface-300" />
                <div className="flex justify-between">
                  <span className="text-surface-600">Recibirás:</span>
                  <span className="font-bold text-green-600">{formatCurrency(successData.netAmount)}</span>
                </div>
                <div className="border-t border-surface-300" />
                <div className="text-left">
                  <p className="text-xs text-surface-600 mb-1">Método:</p>
                  <p className="text-xs font-semibold text-surface-900">{methodConfig?.name}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-surface-600 mb-1">Destino:</p>
                  <p className="text-xs font-mono text-surface-900 break-all">{successData.destination}</p>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleBackToDashboard}
              fullWidth
            >
              Volver al Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main Withdrawal Form
  return (
    <div className="min-h-screen bg-surface-50 pb-8">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-surface-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-surface-900">Retirar Fondos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <div className="space-y-6">
            {/* Balance Display */}
            <div className="bg-gradient-to-br from-brand-primary to-brand-800 text-white p-6 rounded-lg">
              <p className="text-sm text-blue-100 mb-1">Saldo disponible:</p>
              {balanceLoading ? (
                <LoadingSpinner size="sm" text="Cargando..." />
              ) : (
                <h2 className="text-3xl font-bold">{formatCurrency(balance)}</h2>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-sm font-medium text-surface-600 mb-2 block">
                Monto a retirar
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-8"
                />
              </div>
            </div>

            {/* Quick Percentage Buttons */}
            <div>
              <label className="text-sm font-medium text-surface-600 mb-2 block">
                Porcentaje rápido
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => handlePercentageClick(percentage)}
                    className={cn(
                      'py-2 rounded-lg font-semibold text-sm transition-all duration-200',
                      formData.amount === (balance * percentage) / 100
                        ? 'bg-brand-primary text-white shadow-md'
                        : 'bg-surface-100 text-surface-900 hover:bg-surface-200'
                    )}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>

            {/* Fee Calculation */}
            {formData.amount > 0 && (
              <Card className="bg-blue-50 border-2 border-blue-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-surface-600">Retiro:</span>
                    <span className="font-semibold text-surface-900">{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-surface-600">Comisión (1%):</span>
                    <span className="font-semibold text-surface-900">{formatCurrency(calculateFee(formData.amount, FEE_RATE))}</span>
                  </div>
                  <div className="border-t border-blue-300" />
                  <div className="flex justify-between items-center">
                    <span className="text-surface-600 font-medium">Recibirás:</span>
                    <span className="text-lg font-bold text-brand-primary">
                      {formatCurrency(calculateNetAmount(formData.amount, FEE_RATE))}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Withdrawal Method Selection */}
            <div>
              <label className="text-sm font-medium text-surface-600 mb-3 block">
                Método de retiro
              </label>
              <div className="space-y-2">
                {WITHDRAWAL_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 transition-all duration-200 text-left flex items-center gap-3',
                      formData.method === method.id
                        ? 'border-brand-primary bg-blue-50'
                        : 'border-surface-200 bg-white hover:border-surface-300'
                    )}
                  >
                    <div className={cn(
                      'text-2xl w-10 h-10 rounded flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0',
                      method.color
                    )}>
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-surface-900 text-sm">{method.name}</h3>
                      <p className="text-xs text-surface-600">{method.description}</p>
                    </div>
                    {formData.method === method.id && (
                      <svg className="w-5 h-5 text-brand-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Field */}
            {formData.method && (
              <div>
                <label className="text-sm font-medium text-surface-600 mb-2 block">
                  {WITHDRAWAL_METHODS.find(m => m.id === formData.method)?.destinationLabel}
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  placeholder={WITHDRAWAL_METHODS.find(m => m.id === formData.method)?.destinationPlaceholder}
                  className="input-field"
                />
              </div>
            )}

            {/* Warning Box */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Los retiros se procesan en 3-5 días hábiles</p>
              <p>Verifica cuidadosamente tu dirección de destino antes de solicitar el retiro.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmitWithdrawal}
              fullWidth
              loading={loading}
              disabled={!formData.amount || !formData.method || !formData.destination}
            >
              Solicitar Retiro
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
