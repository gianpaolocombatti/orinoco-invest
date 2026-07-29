'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, calculateFee, calculateNetAmount, cn, generateReference } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type PaymentMethod = 'crypto_btc' | 'crypto_usdt' | 'zelle' | 'paypal' | null;
type DepositStep = 'amount' | 'method' | 'confirm' | 'success';

interface DepositData {
  amount: number;
  fee: number;
  netAmount: number;
  method: PaymentMethod;
  reference: string;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];
const MIN_DEPOSIT = 5;
const FEE_RATE = 0.01;

const PAYMENT_METHODS = [
  {
    id: 'zelle' as PaymentMethod,
    name: 'Zelle',
    description: 'Transferencia bancaria EE.UU.',
    icon: '🏦',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'paypal' as PaymentMethod,
    name: 'PayPal',
    description: 'Pago internacional',
    icon: '🅿️',
    color: 'from-blue-500 to-blue-700',
  },
  {
    id: 'crypto_usdt' as PaymentMethod,
    name: 'USDT (TRC-20)',
    description: 'Stablecoin via blockchain',
    icon: '₮',
    color: 'from-green-400 to-green-600',
  },
];

export default function DepositPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [depositData, setDepositData] = useState<DepositData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

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

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setError(null);
  };

  const handleCustomAmount = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setAmount(numValue);
    setError(null);
  };

  const handleAmountContinue = () => {
    if (amount < MIN_DEPOSIT) {
      setError(`El depósito mínimo es ${formatCurrency(MIN_DEPOSIT)}`);
      return;
    }
    setError(null);
    setStep('method');
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setError(null);
  };

  const handleMethodContinue = () => {
    if (!selectedMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }
    const fee = calculateFee(amount, FEE_RATE);
    const netAmount = calculateNetAmount(amount, FEE_RATE);
    const reference = generateReference();
    setDepositData({
      amount,
      fee,
      netAmount,
      method: selectedMethod,
      reference,
    });
    setError(null);
    setStep('confirm');
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleConfirmDeposit = async () => {
    if (!depositData) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/depositos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: depositData.amount,
          method: depositData.method,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar el depósito');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el depósito');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    if (step === 'method') {
      setStep('amount');
    } else if (step === 'confirm') {
      setStep('method');
    }
  };

  // Step 1: Amount Selection
  if (step === 'amount') {
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
              <h1 className="text-2xl font-bold text-surface-900">Depositar Fondos</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">1</div>
            <div className="w-12 h-1 bg-surface-200" />
            <div className="w-8 h-8 rounded-full bg-surface-200 text-surface-600 flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-12 h-1 bg-surface-200" />
            <div className="w-8 h-8 rounded-full bg-surface-200 text-surface-600 flex items-center justify-center text-sm font-bold">3</div>
          </div>

          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-2">Elige la cantidad que deseas invertir</h2>
                <p className="text-sm text-surface-600">Selecciona un monto predefinido o ingresa una cantidad personalizada</p>
              </div>

              {/* Preset Amount Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAmountSelect(preset)}
                    className={cn(
                      'py-3 rounded-lg font-semibold transition-all duration-200',
                      amount === preset
                        ? 'bg-brand-primary text-white shadow-md'
                        : 'bg-surface-100 text-surface-900 hover:bg-surface-200'
                    )}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="text-sm font-medium text-surface-600 mb-2 block">
                  Cantidad personalizada
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600 font-semibold">
                    $
                  </span>
                  <input
                    ref={amountInputRef}
                    type="number"
                    min={MIN_DEPOSIT}
                    step="0.01"
                    value={amount || ''}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field pl-8"
                  />
                </div>
              </div>

              {/* Fee Summary Card */}
              {amount >= MIN_DEPOSIT && (
                <Card className="bg-blue-50 border-2 border-blue-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-surface-600">Depósito:</span>
                      <span className="font-semibold text-surface-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-surface-600">Comisión (1%):</span>
                      <span className="font-semibold text-surface-900">{formatCurrency(calculateFee(amount, FEE_RATE))}</span>
                    </div>
                    <div className="border-t border-blue-300" />
                    <div className="flex justify-between items-center">
                      <span className="text-surface-600 font-medium">Total a invertir:</span>
                      <span className="text-lg font-bold text-brand-primary">
                        {formatCurrency(calculateNetAmount(amount, FEE_RATE))}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Continue Button */}
              <Button
                onClick={handleAmountContinue}
                fullWidth
                disabled={amount < MIN_DEPOSIT}
              >
                Continuar
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Step 2: Payment Method Selection
  if (step === 'method') {
    return (
      <div className="min-h-screen bg-surface-50 pb-8">
        <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-surface-900">Depositar Fondos</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">✓</div>
            <div className="w-12 h-1 bg-brand-primary" />
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-12 h-1 bg-surface-200" />
            <div className="w-8 h-8 rounded-full bg-surface-200 text-surface-600 flex items-center justify-center text-sm font-bold">3</div>
          </div>

          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-2">¿Cómo deseas depositar?</h2>
                <p className="text-sm text-surface-600">
                  Monto a depositar: <span className="font-semibold text-surface-900">{formatCurrency(amount)}</span>
                </p>
              </div>

              {/* Payment Method Cards */}
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className={cn(
                      'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                      selectedMethod === method.id
                        ? 'border-brand-primary bg-blue-50'
                        : 'border-surface-200 bg-white hover:border-surface-300'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'text-3xl w-14 h-14 rounded-lg flex items-center justify-center text-white bg-gradient-to-br',
                        method.color
                      )}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-surface-900">{method.name}</h3>
                        <p className="text-sm text-surface-600">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && (
                        <svg className="w-6 h-6 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Continue Button */}
              <Button
                onClick={handleMethodContinue}
                fullWidth
                disabled={!selectedMethod}
              >
                Continuar
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Step 3: Payment Instructions & Confirmation
  if (step === 'confirm' && depositData) {
    const methodConfig = PAYMENT_METHODS.find(m => m.id === depositData.method);

    return (
      <div className="min-h-screen bg-surface-50 pb-8">
        <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-surface-900">Instrucciones de Pago</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">✓</div>
            <div className="w-12 h-1 bg-brand-primary" />
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">✓</div>
            <div className="w-12 h-1 bg-brand-primary" />
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">3</div>
          </div>

          {/* Payment Instructions */}
          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-2">Instrucciones de Pago</h2>
                <p className="text-sm text-surface-600">Método: <span className="font-semibold text-surface-900">{methodConfig?.name}</span></p>
              </div>

              {/* Payment Details by Method */}
              {depositData.method === 'crypto_btc' && (
                <div className="space-y-4">
                  <div className="bg-surface-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-surface-600">Dirección de Bitcoin:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-3 rounded border border-surface-200 text-xs font-mono break-all">
                        bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
                      </code>
                      <button
                        onClick={() => handleCopyToClipboard('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')}
                        className="p-2 hover:bg-surface-100 rounded transition-colors"
                        title="Copiar"
                      >
                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-500">
                    [Código QR del depósito]
                  </div>
                  <p className="text-sm text-surface-600">
                    Envía exactamente <span className="font-semibold text-surface-900">{formatCurrency(depositData.amount)}</span> en BTC a esta dirección.
                  </p>
                </div>
              )}

              {depositData.method === 'crypto_usdt' && (
                <div className="space-y-4">
                  <div className="bg-surface-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-surface-600">Dirección USDT (TRC-20):</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-3 rounded border border-surface-200 text-xs font-mono break-all">
                        TXyz9abcdef1234567890abcdef1234567890abcd
                      </code>
                      <button
                        onClick={() => handleCopyToClipboard('TXyz9abcdef1234567890abcdef1234567890abcd')}
                        className="p-2 hover:bg-surface-100 rounded transition-colors"
                        title="Copiar"
                      >
                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-surface-600">
                    Envía exactamente <span className="font-semibold text-surface-900">{(depositData.amount).toFixed(2)} USDT</span> a esta dirección en la red TRC-20.
                  </p>
                </div>
              )}

              {depositData.method === 'zelle' && (
                <div className="space-y-4">
                  <div className="bg-surface-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-surface-600">Correo electrónico Zelle:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-3 rounded border border-surface-200 text-sm font-semibold">
                        pagos@orinoco-invest.com
                      </code>
                      <button
                        onClick={() => handleCopyToClipboard('pagos@orinoco-invest.com')}
                        className="p-2 hover:bg-surface-100 rounded transition-colors"
                        title="Copiar"
                      >
                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-surface-600">
                    Envía una transferencia Zelle de <span className="font-semibold text-surface-900">{formatCurrency(depositData.amount)}</span> e incluye tu referencia en la descripción.
                  </p>
                </div>
              )}

              {depositData.method === 'paypal' && (
                <div className="space-y-4">
                  <div className="bg-surface-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-surface-600">Correo electrónico PayPal:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-3 rounded border border-surface-200 text-sm font-semibold">
                        pagos@orinoco-invest.com
                      </code>
                      <button
                        onClick={() => handleCopyToClipboard('pagos@orinoco-invest.com')}
                        className="p-2 hover:bg-surface-100 rounded transition-colors"
                        title="Copiar"
                      >
                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-surface-600">
                    Envía un pago PayPal de <span className="font-semibold text-surface-900">{formatCurrency(depositData.amount)}</span> e incluye tu referencia en el concepto.
                  </p>
                </div>
              )}

              {/* Reference Number */}
              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                <p className="text-xs text-surface-600 mb-1">Tu referencia de depósito:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-3 rounded border border-blue-300 text-sm font-bold text-blue-600">
                    {depositData.reference}
                  </code>
                  <button
                    onClick={() => handleCopyToClipboard(depositData.reference)}
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                    title="Copiar"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Nota importante:</p>
                <p>Tu depósito será procesado en 1-24 horas después de la verificación. Asegúrate de incluir tu referencia en todas las transferencias.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Confirm Button */}
              <Button
                onClick={handleConfirmDeposit}
                fullWidth
                loading={loading}
              >
                He realizado el pago
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Success Screen
  if (step === 'success') {
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
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Depósito confirmado</h2>
              <p className="text-surface-600">Tu depósito está siendo procesado</p>
            </div>

            {/* Deposit Summary */}
            {depositData && (
              <Card className="bg-surface-100">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-600">Monto depositado:</span>
                    <span className="font-semibold text-surface-900">{formatCurrency(depositData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-600">Comisión:</span>
                    <span className="font-semibold text-surface-900">-{formatCurrency(depositData.fee)}</span>
                  </div>
                  <div className="border-t border-surface-300" />
                  <div className="flex justify-between">
                    <span className="text-surface-600">Total a tu cuenta:</span>
                    <span className="font-bold text-green-600">{formatCurrency(depositData.netAmount)}</span>
                  </div>
                  <div className="border-t border-surface-300" />
                  <div className="text-left">
                    <p className="text-xs text-surface-600 mb-1">Referencia:</p>
                    <code className="text-xs font-mono text-surface-900">{depositData.reference}</code>
                  </div>
                </div>
              </Card>
            )}

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

  return null;
}
