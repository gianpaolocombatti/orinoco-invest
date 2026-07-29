'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { recommendPortfolio } from '@/lib/portfolio';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type TimelineType = 'CORTO_PLAZO' | 'MEDIANO_PLAZO' | 'LARGO_PLAZO';
type VolatilityType = 'CONSERVADOR' | 'MODERADO' | 'AGRESIVO';
type ExperienceType = 'NINGUNA' | 'ALGO' | 'MUCHA';

interface QuestionStep {
  id: string;
  titulo: string;
  descripcion: string;
  opciones: Array<{
    id: string;
    label: string;
    descripcion: string;
  }>;
  valor: string | null;
}

const timelineQuestions: QuestionStep['opciones'] = [
  {
    id: 'CORTO_PLAZO',
    label: 'Corto plazo',
    descripcion: 'Menos de 3 años',
  },
  {
    id: 'MEDIANO_PLAZO',
    label: 'Mediano plazo',
    descripcion: '3-10 años',
  },
  {
    id: 'LARGO_PLAZO',
    label: 'Largo plazo',
    descripcion: 'Más de 10 años',
  },
];

const volatilityQuestions: QuestionStep['opciones'] = [
  {
    id: 'CONSERVADOR',
    label: 'Bajo riesgo',
    descripcion: 'Prefiero cambios mínimos en el valor',
  },
  {
    id: 'MODERADO',
    label: 'Riesgo moderado',
    descripcion: 'Puedo tolerar fluctuaciones moderadas',
  },
  {
    id: 'AGRESIVO',
    label: 'Alto riesgo',
    descripcion: 'Puedo tolerar fluctuaciones significativas',
  },
];

const experienceQuestions: QuestionStep['opciones'] = [
  {
    id: 'NINGUNA',
    label: 'Ninguna',
    descripcion: 'Primera vez invirtiendo',
  },
  {
    id: 'ALGO',
    label: 'Alguna experiencia',
    descripcion: 'He invertido anteriormente',
  },
  {
    id: 'MUCHA',
    label: 'Mucha experiencia',
    descripcion: 'He invertido frecuentemente',
  },
];

const portfolioDescriptions: Record<string, { titulo: string; descripcion: string }> = {
  CONSERVADOR: {
    titulo: 'Portafolio Conservador',
    descripcion:
      'Enfocado en preservar el capital con crecimiento gradual. SHV + BND + GLD. Ideal para inversores cautelosos con horizontes de inversión cortos.',
  },
  BALANCEADO: {
    titulo: 'Portafolio Balanceado',
    descripcion:
      'Balance entre crecimiento y seguridad. VTI + VXUS + BND + GLD. Ideal para inversores que quieren crecimiento con riesgo controlado.',
  },
  CRECIMIENTO: {
    titulo: 'Portafolio Crecimiento',
    descripcion:
      'Enfocado en crecimiento máximo. VTI + VXUS + BND + GLD. Ideal para inversores con alto horizonte temporal y tolerancia al riesgo.',
  },
};

const allocationBreakdown: Record<
  string,
  Array<{ activo: string; porcentaje: number }>
> = {
  CONSERVADOR: [
    { activo: 'SHV (Tesoro a corto plazo)', porcentaje: 50 },
    { activo: 'BND (Bonos)', porcentaje: 35 },
    { activo: 'GLD (Oro)', porcentaje: 15 },
  ],
  BALANCEADO: [
    { activo: 'VTI (Acciones US)', porcentaje: 35 },
    { activo: 'VXUS (Acciones Internacionales)', porcentaje: 20 },
    { activo: 'BND (Bonos)', porcentaje: 30 },
    { activo: 'GLD (Oro)', porcentaje: 15 },
  ],
  CRECIMIENTO: [
    { activo: 'VTI (Acciones US)', porcentaje: 45 },
    { activo: 'VXUS (Acciones Internacionales)', porcentaje: 25 },
    { activo: 'BND (Bonos)', porcentaje: 20 },
    { activo: 'GLD (Oro)', porcentaje: 10 },
  ],
};

export default function EvaluacionPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [step, setStep] = useState<'timeline' | 'volatility' | 'experience' | 'result'>(
    'timeline'
  );
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Answers
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [volatility, setVolatility] = useState<VolatilityType | null>(null);
  const [experience, setExperience] = useState<ExperienceType | null>(null);
  const [recommendedPortfolio, setRecommendedPortfolio] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  const handleNext = () => {
    if (step === 'timeline' && timeline) {
      setStep('volatility');
    } else if (step === 'volatility' && volatility) {
      setStep('experience');
    } else if (step === 'experience' && experience) {
      // Calculate recommendation
      if (timeline && volatility && experience) {
        const recommendation = recommendPortfolio(timeline, volatility, experience);
        setRecommendedPortfolio(recommendation);
        setStep('result');
      }
    }
  };

  const handleUpdatePortfolio = async () => {
    try {
      if (!recommendedPortfolio) return;

      setUpdateLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/portafolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          portfolioType: recommendedPortfolio,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar portafolio');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar portafolio');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-20 pt-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900">
            Evaluación de Riesgo
          </h1>
          <p className="text-base text-surface-600 mt-2">
            Responde 3 preguntas para encontrar tu portafolio ideal
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-danger rounded-lg p-4 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            {(['timeline', 'volatility', 'experience', 'result'] as const).map(
              (s, idx) => (
                <div
                  key={s}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-all duration-300',
                    idx <=
                    (['timeline', 'volatility', 'experience', 'result'].indexOf(
                      step
                    ) || 0)
                      ? 'bg-brand-primary'
                      : 'bg-surface-200'
                  )}
                />
              )
            )}
          </div>
          <p className="text-xs text-surface-600 mt-2">
            Pregunta{' '}
            {['timeline', 'volatility', 'experience'].includes(step) &&
              ['timeline', 'volatility', 'experience'].indexOf(step) + 1}
            {step === 'result' && '3'} de 3
          </p>
        </div>

        {/* Timeline Question */}
        {step === 'timeline' && (
          <Card className="mb-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-surface-900 mb-2">
                ¿Cuál es tu horizonte de inversión?
              </h2>
              <p className="text-surface-600">
                Cuánto tiempo planeas mantener tu dinero invertido
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {timelineQuestions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTimeline(option.id as TimelineType)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                    timeline === option.id
                      ? 'border-brand-primary bg-blue-50'
                      : 'border-surface-200 bg-white hover:border-surface-300'
                  )}
                >
                  <p className="font-semibold text-surface-900">
                    {option.label}
                  </p>
                  <p className="text-sm text-surface-600">
                    {option.descripcion}
                  </p>
                </button>
              ))}
            </div>

            <Button
              fullWidth
              onClick={handleNext}
              disabled={!timeline}
            >
              Siguiente
            </Button>
          </Card>
        )}

        {/* Volatility Question */}
        {step === 'volatility' && (
          <Card className="mb-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-surface-900 mb-2">
                ¿Cómo te sientes con la volatilidad?
              </h2>
              <p className="text-surface-600">
                Cambios de valor en tu portafolio a corto plazo
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {volatilityQuestions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setVolatility(option.id as VolatilityType)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                    volatility === option.id
                      ? 'border-brand-primary bg-blue-50'
                      : 'border-surface-200 bg-white hover:border-surface-300'
                  )}
                >
                  <p className="font-semibold text-surface-900">
                    {option.label}
                  </p>
                  <p className="text-sm text-surface-600">
                    {option.descripcion}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setStep('timeline');
                  setVolatility(null);
                }}
              >
                Atrás
              </Button>
              <Button
                fullWidth
                onClick={handleNext}
                disabled={!volatility}
              >
                Siguiente
              </Button>
            </div>
          </Card>
        )}

        {/* Experience Question */}
        {step === 'experience' && (
          <Card className="mb-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-surface-900 mb-2">
                ¿Cuál es tu experiencia invirtiendo?
              </h2>
              <p className="text-surface-600">
                Tu nivel de conocimiento en inversiones
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {experienceQuestions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setExperience(option.id as ExperienceType)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                    experience === option.id
                      ? 'border-brand-primary bg-blue-50'
                      : 'border-surface-200 bg-white hover:border-surface-300'
                  )}
                >
                  <p className="font-semibold text-surface-900">
                    {option.label}
                  </p>
                  <p className="text-sm text-surface-600">
                    {option.descripcion}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setStep('volatility');
                  setExperience(null);
                }}
              >
                Atrás
              </Button>
              <Button
                fullWidth
                onClick={handleNext}
                disabled={!experience}
              >
                Ver Resultado
              </Button>
            </div>
          </Card>
        )}

        {/* Result */}
        {step === 'result' && recommendedPortfolio && (
          <div className="animate-fade-in">
            {/* Portfolio Recommendation */}
            <Card className="mb-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-surface-900 mb-2">
                  Tu perfil: {recommendedPortfolio}
                </h2>
                <p className="text-lg text-surface-600 mb-4">
                  {
                    portfolioDescriptions[recommendedPortfolio]
                      .descripcion
                  }
                </p>
              </div>

              {/* Allocation Breakdown */}
              <div className="bg-surface-100 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-surface-900 mb-4">
                  Portafolio recomendado
                </h3>
                <div className="space-y-3">
                  {allocationBreakdown[recommendedPortfolio].map(
                    (allocation) => (
                      <div key={allocation.activo}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-surface-900">
                            {allocation.activo}
                          </span>
                          <span className="text-sm font-semibold text-brand-primary">
                            {allocation.porcentaje}%
                          </span>
                        </div>
                        <div className="w-full bg-surface-200 rounded-full h-2">
                          <div
                            className="bg-brand-primary h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${allocation.porcentaje}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-brand-primary rounded-lg p-4 mb-6">
                <p className="text-sm text-surface-700">
                  Esta asignación está diseñada basándose en tu horizonte de inversión,
                  tolerancia al riesgo y experiencia. Diversifica tu dinero en múltiples
                  activos para reducir el riesgo mientras buscas crecimiento.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  fullWidth
                  loading={updateLoading}
                  onClick={handleUpdatePortfolio}
                >
                  Actualizar mi portafolio
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setStep('timeline');
                    setTimeline(null);
                    setVolatility(null);
                    setExperience(null);
                    setRecommendedPortfolio(null);
                  }}
                >
                  Retomar la evaluación
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => router.push('/dashboard')}
                >
                  Mantener mi portafolio actual
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
