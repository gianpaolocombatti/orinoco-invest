'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn, validateEmail, validatePassword, validateCedula } from '@/lib/utils';
import { recommendPortfolio, PORTFOLIO_ALLOCATIONS } from '@/lib/portfolio';

type TimelineType = 'CORTO_PLAZO' | 'MEDIANO_PLAZO' | 'LARGO_PLAZO';
type VolatilityType = 'CONSERVADOR' | 'MODERADO' | 'AGRESIVO';
type ExperienceType = 'NINGUNA' | 'ALGO' | 'MUCHA';
type PortfolioType = 'CONSERVADOR' | 'BALANCEADO' | 'CRECIMIENTO';

interface FormData {
  firstName: string;
  lastName: string;
  ciPassport: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  timeline: TimelineType | '';
  volatility: VolatilityType | '';
  experience: ExperienceType | '';
  tosAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegistroPage() {
  const router = useRouter();
  const { user, isAuthenticated, register, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    ciPassport: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    timeline: '',
    volatility: '',
    experience: '',
    tosAccepted: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendedPortfolio, setRecommendedPortfolio] = useState<PortfolioType | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }

    // Update portfolio recommendation when assessment fields change
    if (field === 'timeline' || field === 'volatility' || field === 'experience') {
      const timeline = field === 'timeline' ? value : formData.timeline;
      const volatility = field === 'volatility' ? value : formData.volatility;
      const experience = field === 'experience' ? value : formData.experience;

      if (timeline && volatility && experience) {
        const recommended = recommendPortfolio(
          timeline as TimelineType,
          volatility as VolatilityType,
          experience as ExperienceType
        );
        setRecommendedPortfolio(recommended);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'El nombre es requerido';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'El apellido es requerido';
      }
      if (!formData.ciPassport.trim()) {
        newErrors.ciPassport = 'La cédula o pasaporte es requerida';
      } else if (!validateCedula(formData.ciPassport)) {
        newErrors.ciPassport = 'Formato de cédula inválido (ejemplo: 12345678 o V12345678)';
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'La fecha de nacimiento es requerida';
      }
    } else if (step === 2) {
      if (!formData.email.trim()) {
        newErrors.email = 'El correo electrónico es requerido';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Por favor ingresa un correo electrónico válido';
      }

      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.errors[0];
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else if (step === 3) {
      if (!formData.timeline) {
        newErrors.timeline = 'Selecciona un horizonte de inversión';
      }
      if (!formData.volatility) {
        newErrors.volatility = 'Selecciona tu tolerancia al riesgo';
      }
      if (!formData.experience) {
        newErrors.experience = 'Selecciona tu experiencia en inversiones';
      }
    } else if (step === 4) {
      if (!formData.tosAccepted) {
        newErrors.tosAccepted = 'Debes aceptar los términos de servicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3 && !recommendedPortfolio) {
        const recommended = recommendPortfolio(
          formData.timeline as TimelineType,
          formData.volatility as VolatilityType,
          formData.experience as ExperienceType
        );
        setRecommendedPortfolio(recommended);
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Register user
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        ciPassport: formData.ciPassport,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone,
      } as any);

      // TODO: POST risk assessment to backend
      // await fetch('/api/evaluacion', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     timeline: formData.timeline,
      //     volatility: formData.volatility,
      //     experience: formData.experience,
      //   }),
      // });

      router.push('/evaluacion');
    } catch (error: any) {
      setErrors({ submit: error?.message || 'Error al registrarse. Intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-surface-900">
              Crear cuenta
            </h1>
            <span className="text-sm font-semibold text-brand-primary">
              Paso {currentStep}/4
            </span>
          </div>
          <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <Card className="bg-white shadow-lg">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-4">
                  Información Personal
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={errors.firstName}
                  placeholder="Juan"
                  required
                />
                <Input
                  label="Apellido"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={errors.lastName}
                  placeholder="Pérez"
                  required
                />
              </div>

              <Input
                label="Cédula o Pasaporte"
                name="ciPassport"
                value={formData.ciPassport}
                onChange={handleInputChange}
                error={errors.ciPassport}
                placeholder="V12345678 o E12345678"
                required
              />

              <Input
                label="Fecha de Nacimiento"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                error={errors.dateOfBirth}
                required
              />
            </div>
          )}

          {/* Step 2: Contact Info */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-4">
                  Información de Contacto
                </h2>
              </div>

              <Input
                label="Correo Electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                placeholder="tu@correo.com"
                required
              />

              <Input
                label="Teléfono (opcional)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+58 414-1234567"
              />

              <Input
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                placeholder="••••••••"
                hint="Mínimo 8 caracteres, 1 número y 1 mayúscula"
                required
              />

              <Input
                label="Confirmar Contraseña"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {/* Step 3: Risk Assessment */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-4">
                  Evaluación de Riesgo
                </h2>
              </div>

              {/* Question 1: Timeline */}
              <div>
                <label className="block text-sm font-semibold text-surface-900 mb-3">
                  ¿Cuál es tu horizonte de inversión?
                  <span className="text-danger ml-1">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'CORTO_PLAZO', label: 'Corto plazo (menos de 1 año)' },
                    { value: 'MEDIANO_PLAZO', label: 'Mediano plazo (1-5 años)' },
                    { value: 'LARGO_PLAZO', label: 'Largo plazo (más de 5 años)' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectChange('timeline', option.value)}
                      className={cn(
                        'p-4 border-2 rounded-lg text-left font-medium transition-all',
                        formData.timeline === option.value
                          ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                          : 'border-surface-200 bg-white text-surface-900 hover:border-brand-primary/30'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.timeline && (
                  <p className="text-sm text-danger font-medium mt-2">{errors.timeline}</p>
                )}
              </div>

              {/* Question 2: Volatility */}
              <div>
                <label className="block text-sm font-semibold text-surface-900 mb-3">
                  ¿Qué tan cómodo te sientes con la volatilidad?
                  <span className="text-danger ml-1">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'CONSERVADOR', label: 'Conservador - Prefiero estabilidad' },
                    { value: 'MODERADO', label: 'Moderado - Acepto algo de riesgo' },
                    { value: 'AGRESIVO', label: 'Agresivo - Busco máximo rendimiento' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectChange('volatility', option.value)}
                      className={cn(
                        'p-4 border-2 rounded-lg text-left font-medium transition-all',
                        formData.volatility === option.value
                          ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                          : 'border-surface-200 bg-white text-surface-900 hover:border-brand-primary/30'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.volatility && (
                  <p className="text-sm text-danger font-medium mt-2">{errors.volatility}</p>
                )}
              </div>

              {/* Question 3: Experience */}
              <div>
                <label className="block text-sm font-semibold text-surface-900 mb-3">
                  ¿Cuánta experiencia tienes invirtiendo?
                  <span className="text-danger ml-1">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'NINGUNA', label: 'Ninguna - Soy nuevo en esto' },
                    { value: 'ALGO', label: 'Algo - He invertido antes' },
                    { value: 'MUCHA', label: 'Mucha - Invierto regularmente' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectChange('experience', option.value)}
                      className={cn(
                        'p-4 border-2 rounded-lg text-left font-medium transition-all',
                        formData.experience === option.value
                          ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                          : 'border-surface-200 bg-white text-surface-900 hover:border-brand-primary/30'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.experience && (
                  <p className="text-sm text-danger font-medium mt-2">{errors.experience}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review & Accept Terms */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-4">
                  Revisa tu información
                </h2>
              </div>

              {/* Summary */}
              <div className="bg-surface-50 p-4 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-600">Nombre:</span>
                  <span className="font-medium text-surface-900">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600">Cédula/Pasaporte:</span>
                  <span className="font-medium text-surface-900">{formData.ciPassport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600">Correo:</span>
                  <span className="font-medium text-surface-900">{formData.email}</span>
                </div>
              </div>

              {/* Recommended Portfolio */}
              {recommendedPortfolio && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-surface-900 mb-3">
                    Portafolio Recomendado para ti
                  </h3>
                  <div className="text-sm text-surface-700 mb-4">
                    <p className="font-medium text-blue-900 mb-2">
                      {recommendedPortfolio === 'CONSERVADOR' && '💼 Portafolio Conservador'}
                      {recommendedPortfolio === 'BALANCEADO' && '⚖️ Portafolio Balanceado'}
                      {recommendedPortfolio === 'CRECIMIENTO' && '🚀 Portafolio Crecimiento'}
                    </p>
                    <p>
                      {recommendedPortfolio === 'CONSERVADOR' &&
                        'Enfocado en estabilidad: SHV (50%) + BND (35%) + GLD (15%).'}
                      {recommendedPortfolio === 'BALANCEADO' &&
                        'Balance seguridad y crecimiento: VTI (35%) + VXUS (20%) + BND (30%) + GLD (15%).'}
                      {recommendedPortfolio === 'CRECIMIENTO' &&
                        'Orientado al crecimiento: VTI (45%) + VXUS (25%) + BND (20%) + GLD (10%).'}
                    </p>
                  </div>
                </div>
              )}

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="tosAccepted"
                    checked={formData.tosAccepted}
                    onChange={handleInputChange}
                    className="mt-1 w-5 h-5 accent-brand-primary rounded cursor-pointer"
                  />
                  <span className="text-sm text-surface-700">
                    Acepto los{' '}
                    <a href="#" className="text-brand-primary hover:text-brand-700 font-semibold">
                      Términos de Servicio
                    </a>{' '}
                    y la{' '}
                    <a href="#" className="text-brand-primary hover:text-brand-700 font-semibold">
                      Política de Privacidad
                    </a>
                  </span>
                </label>
                {errors.tosAccepted && (
                  <p className="text-sm text-danger font-medium mt-2">{errors.tosAccepted}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-surface-200">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              Atrás
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                fullWidth
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                fullWidth
                loading={isSubmitting}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Crear Cuenta
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
