'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

type PortfolioType = 'CONSERVADOR' | 'BALANCEADO' | 'CRECIMIENTO';

interface Portfolio {
  id: PortfolioType;
  name: string;
  description: string;
  allocation: {
    name: string;
    percentage: number;
    color: string;
  }[];
  riskLevel: 'Bajo' | 'Medio' | 'Alto';
  expectedReturn: string;
}

const PORTFOLIOS: Portfolio[] = [
  {
    id: 'CONSERVADOR',
    name: 'Conservador',
    description: 'Enfocado en preservar capital con ingresos estables. SHV (50%) + BND (35%) + GLD (15%).',
    allocation: [
      { name: 'Bonos (SHV, BND)', percentage: 85, color: 'bg-blue-500' },
      { name: 'Oro (GLD)', percentage: 15, color: 'bg-amber-500' },
    ],
    riskLevel: 'Bajo',
    expectedReturn: '3-5% anual',
  },
  {
    id: 'BALANCEADO',
    name: 'Balanceado',
    description: 'Balance entre seguridad y crecimiento. VTI (35%) + VXUS (20%) + BND (30%) + GLD (15%).',
    allocation: [
      { name: 'Acciones (VTI, VXUS)', percentage: 55, color: 'bg-green-500' },
      { name: 'Bonos (BND)', percentage: 30, color: 'bg-blue-500' },
      { name: 'Oro (GLD)', percentage: 15, color: 'bg-amber-500' },
    ],
    riskLevel: 'Medio',
    expectedReturn: '6-8% anual',
  },
  {
    id: 'CRECIMIENTO',
    name: 'Crecimiento',
    description: 'Maximiza crecimiento a largo plazo. VTI (45%) + VXUS (25%) + BND (20%) + GLD (10%).',
    allocation: [
      { name: 'Acciones (VTI, VXUS)', percentage: 70, color: 'bg-green-500' },
      { name: 'Bonos (BND)', percentage: 20, color: 'bg-blue-500' },
      { name: 'Oro (GLD)', percentage: 10, color: 'bg-amber-500' },
    ],
    riskLevel: 'Alto',
    expectedReturn: '9-12% anual',
  },
];

export default function PortafoliosPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedPortfolio] = useState<PortfolioType>('BALANCEADO'); // TODO: Get from user assessment

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  const handleSelectPortfolio = async (portfolioId: PortfolioType) => {
    try {
      setIsLoading(true);
      setSelectedPortfolio(portfolioId);

      // POST to /api/portafolio
      const response = await fetch('/api/portafolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          portfolioType: portfolioId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al seleccionar portafolio');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error selecting portfolio:', error);
      setSelectedPortfolio(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 mb-3">
            Elige tu Portafolio
          </h1>
          <p className="text-lg text-surface-600 max-w-2xl mx-auto">
            Basado en tu evaluación, te recomendamos:{' '}
            <span className="font-semibold text-brand-primary">
              {recommendedPortfolio === 'CONSERVADOR' && 'Conservador'}
              {recommendedPortfolio === 'BALANCEADO' && 'Balanceado'}
              {recommendedPortfolio === 'CRECIMIENTO' && 'Crecimiento'}
            </span>
          </p>
        </div>

        {/* Portfolio Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PORTFOLIOS.map((portfolio) => {
            const isRecommended = portfolio.id === recommendedPortfolio;
            const isSelected = selectedPortfolio === portfolio.id;

            return (
              <div key={portfolio.id} className="relative">
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 z-10">
                    <div className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                      ⭐ Recomendado
                    </div>
                  </div>
                )}

                <Card
                  className={cn(
                    'h-full transition-all duration-300 cursor-pointer',
                    isSelected
                      ? 'ring-2 ring-brand-primary shadow-lg'
                      : 'hover:shadow-lg',
                    isRecommended ? 'border-2 border-brand-primary/30' : ''
                  )}
                  onClick={() => handleSelectPortfolio(portfolio.id)}
                  hoverable
                >
                  <div className="space-y-5">
                    {/* Portfolio Name & Description */}
                    <div>
                      <h3 className="text-2xl font-bold text-surface-900 mb-2">
                        {portfolio.name}
                      </h3>
                      <p className="text-sm text-surface-600">
                        {portfolio.description}
                      </p>
                    </div>

                    {/* Risk Level Indicator */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-surface-600">
                          Nivel de Riesgo
                        </span>
                        <span className={cn(
                          'text-xs font-bold px-2 py-1 rounded-full',
                          portfolio.riskLevel === 'Bajo'
                            ? 'bg-green-100 text-green-700'
                            : portfolio.riskLevel === 'Medio'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        )}>
                          {portfolio.riskLevel}
                        </span>
                      </div>
                      <div className="flex gap-1 h-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              'flex-1 rounded-full',
                              portfolio.riskLevel === 'Bajo'
                                ? i <= 1
                                  ? 'bg-green-500'
                                  : 'bg-surface-200'
                                : portfolio.riskLevel === 'Medio'
                                ? i <= 2
                                  ? 'bg-amber-500'
                                  : 'bg-surface-200'
                                : 'bg-red-500'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Asset Allocation */}
                    <div>
                      <h4 className="text-xs font-semibold text-surface-600 uppercase mb-3">
                        Asignación de Activos
                      </h4>

                      {/* Allocation Bar */}
                      <div className="flex gap-1 h-6 rounded-lg overflow-hidden mb-4 bg-surface-100">
                        {portfolio.allocation.map((asset) => (
                          <div
                            key={asset.name}
                            className={cn(asset.color)}
                            style={{ width: `${asset.percentage}%` }}
                            title={`${asset.name}: ${asset.percentage}%`}
                          />
                        ))}
                      </div>

                      {/* Allocation Legend */}
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {portfolio.allocation.map((asset) => (
                          <div
                            key={asset.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn('w-3 h-3 rounded-full', asset.color)} />
                              <span className="text-surface-600">{asset.name}</span>
                            </div>
                            <span className="font-semibold text-surface-900">
                              {asset.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expected Return */}
                    <div className="bg-surface-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-surface-600">
                          Retorno Esperado
                        </span>
                        <span className="text-sm font-bold text-brand-primary">
                          {portfolio.expectedReturn}
                        </span>
                      </div>
                    </div>

                    {/* Select Button */}
                    <Button
                      fullWidth
                      variant={isSelected ? 'primary' : 'secondary'}
                      size="md"
                      loading={isSelected && isLoading}
                      disabled={isLoading}
                      onClick={() => handleSelectPortfolio(portfolio.id)}
                    >
                      {isSelected ? 'Seleccionando...' : 'Seleccionar'}
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ¿Necesitas ayuda para elegir?
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            Tu portafolio recomendado se basa en tu evaluación de riesgo durante el registro.
            Puedes cambiar tu portafolio en cualquier momento desde tu panel de control.
            Recomendamos revisarlo anualmente o cuando tus circunstancias cambien.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-blue-900 mb-1">🔒 Conservador</p>
              <p className="text-blue-800">Para inversores que priorizan la seguridad</p>
            </div>
            <div>
              <p className="font-semibold text-blue-900 mb-1">⚖️ Moderado</p>
              <p className="text-blue-800">Para inversores que buscan equilibrio</p>
            </div>
            <div>
              <p className="font-semibold text-blue-900 mb-1">🚀 Agresivo</p>
              <p className="text-blue-800">Para inversores con alto horizonte temporal</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
