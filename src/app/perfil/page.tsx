'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn, formatCurrency, formatDate, validatePassword } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  cédula?: string;
  fechaNacimiento?: string;
  correo: string;
  teléfono?: string;
  toleranciaRiesgo?: string;
  horizonteInversion?: string;
  experiencia?: string;
  tipoPortafolio?: string;
}

interface AccountSummary {
  totalInvertido: number;
  valorActual: number;
  gananciaPerdida: number;
  depositosTotales: number;
  retirosTotales: number;
}

const getPortfolioTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    CONSERVADOR: 'Conservador',
    BALANCEADO: 'Balanceado',
    CRECIMIENTO: 'Crecimiento',
  };
  return labels[type] || type;
};

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const labels = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const colors = [
    'bg-danger',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full',
              i < strength ? colors[strength - 1] : 'bg-surface-200'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-surface-600">
        Fortaleza: {labels[Math.min(strength, 4)]}
      </p>
    </div>
  );
};

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modes
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // Form state
  const [personalData, setPersonalData] = useState<Partial<UserProfile>>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch user data
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        setPageLoading(true);
        const token = localStorage.getItem('authToken');

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener datos del usuario');
        }

        const data = await response.json();
        const apiUser = data.data.user;
        const apiPortfolio = data.data.portfolio;
        const profile: UserProfile = {
          id: apiUser.id,
          nombre: apiUser.firstName,
          apellido: apiUser.lastName,
          cédula: apiUser.ciPassport,
          fechaNacimiento: apiUser.dateOfBirth,
          correo: apiUser.email,
          teléfono: apiUser.phone || undefined,
          toleranciaRiesgo: apiUser.riskTolerance || undefined,
          horizonteInversion: apiUser.investTimeline || undefined,
          experiencia: apiUser.investExperience || undefined,
          tipoPortafolio: apiPortfolio?.portfolioType,
        };

        setUserProfile(profile);
        setPersonalData(profile);

        // Fetch account summary
        const [portfolioResponse, depositosResponse, retirosResponse] = await Promise.all([
          fetch('/api/portafolio', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/depositos?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/retiros?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          const totalInvertido = portfolioData.data?.totalCostBasis || 0;
          const valorActual = portfolioData.data?.totalValueUsd || 0;

          let depositosTotales = 0;
          if (depositosResponse.ok) {
            const depositosData = await depositosResponse.json();
            depositosTotales = (depositosData.data?.deposits || [])
              .filter((d: { status: string }) => d.status === 'CONFIRMED')
              .reduce((sum: number, d: { amountUsd: number }) => sum + d.amountUsd, 0);
          }

          let retirosTotales = 0;
          if (retirosResponse.ok) {
            const retirosData = await retirosResponse.json();
            retirosTotales = (retirosData.data?.withdrawals || [])
              .filter((w: { status: string }) => w.status === 'COMPLETED')
              .reduce((sum: number, w: { amountUsd: number }) => sum + w.amountUsd, 0);
          }

          setAccountSummary({
            totalInvertido,
            valorActual,
            gananciaPerdida: valorActual - totalInvertido,
            depositosTotales,
            retirosTotales,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar perfil');
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading) {
      fetchUserData();
    }
  }, [loading, isAuthenticated, router]);

  const handleSavePersonal = async () => {
    try {
      setSaveLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: personalData.nombre,
          lastName: personalData.apellido,
          phone: personalData.teléfono,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar perfil');
      }

      const data = await response.json();
      const apiUser = data.data.user;
      const updatedProfile: UserProfile = {
        ...(userProfile as UserProfile),
        nombre: apiUser.firstName,
        apellido: apiUser.lastName,
        teléfono: apiUser.phone || undefined,
      };

      setUserProfile(updatedProfile);
      setPersonalData(updatedProfile);
      setEditingPersonal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const validation = validatePassword(passwordData.newPassword);
      if (!validation.valid) {
        setPasswordErrors(validation.errors);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordErrors(['Las contraseñas no coinciden']);
        return;
      }

      setSaveLoading(true);
      setError(null);
      setPasswordErrors([]);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar contraseña');
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setEditingPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (!isAuthenticated || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-20 pt-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900">
            Mi Perfil
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-danger rounded-lg p-4 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Section 1: Personal Info */}
        <Card title="Información Personal" className="mb-6">
          {!editingPersonal ? (
            <>
              <div className="space-y-4 mb-4">
                <div>
                  <p className="text-sm text-surface-600">Nombre completo</p>
                  <p className="text-base font-medium text-surface-900">
                    {userProfile.nombre} {userProfile.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-surface-600">Cédula/Pasaporte</p>
                  <p className="text-base font-medium text-surface-900">
                    {userProfile.cédula || 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-surface-600">Fecha de nacimiento</p>
                  <p className="text-base font-medium text-surface-900">
                    {userProfile.fechaNacimiento
                      ? formatDate(userProfile.fechaNacimiento)
                      : 'No especificada'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-surface-600">Correo electrónico</p>
                  <p className="text-base font-medium text-surface-900">
                    {userProfile.correo}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-surface-600">Teléfono</p>
                  <p className="text-base font-medium text-surface-900">
                    {userProfile.teléfono || 'No especificado'}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingPersonal(true)}
              >
                Editar
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                <Input
                  label="Nombre"
                  value={personalData.nombre || ''}
                  onChange={(e) =>
                    setPersonalData({ ...personalData, nombre: e.target.value })
                  }
                />
                <Input
                  label="Apellido"
                  value={personalData.apellido || ''}
                  onChange={(e) =>
                    setPersonalData({ ...personalData, apellido: e.target.value })
                  }
                />
                <Input
                  label="Cédula/Pasaporte"
                  value={personalData.cédula || ''}
                  onChange={(e) =>
                    setPersonalData({ ...personalData, cédula: e.target.value })
                  }
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  value={personalData.teléfono || ''}
                  onChange={(e) =>
                    setPersonalData({ ...personalData, teléfono: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={saveLoading}
                  onClick={handleSavePersonal}
                >
                  Guardar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingPersonal(false);
                    setPersonalData(userProfile);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Section 2: Investment Profile */}
        <Card title="Perfil de Inversión" className="mb-6">
          <div className="space-y-4 mb-4">
            <div>
              <p className="text-sm text-surface-600">Tolerancia al riesgo</p>
              <p className="text-base font-medium text-surface-900">
                {userProfile.toleranciaRiesgo
                  ? getPortfolioTypeLabel(userProfile.toleranciaRiesgo)
                  : 'No evaluado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600">Horizonte de inversión</p>
              <p className="text-base font-medium text-surface-900">
                {userProfile.horizonteInversion || 'No especificado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600">Experiencia</p>
              <p className="text-base font-medium text-surface-900">
                {userProfile.experiencia || 'No especificada'}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-600">Tipo de portafolio</p>
              <p className="text-base font-medium text-surface-900">
                {userProfile.tipoPortafolio
                  ? getPortfolioTypeLabel(userProfile.tipoPortafolio)
                  : 'No asignado'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/evaluacion')}
          >
            Cambiar portafolio
          </Button>
        </Card>

        {/* Section 3: Account Summary */}
        {accountSummary && (
          <Card title="Resumen de Cuenta" className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-100 rounded-lg p-4">
                <p className="text-xs text-surface-600 uppercase tracking-wide mb-1">
                  Total invertido
                </p>
                <p className="text-xl font-bold text-surface-900">
                  {formatCurrency(accountSummary.totalInvertido)}
                </p>
              </div>
              <div className="bg-surface-100 rounded-lg p-4">
                <p className="text-xs text-surface-600 uppercase tracking-wide mb-1">
                  Valor actual
                </p>
                <p className="text-xl font-bold text-surface-900">
                  {formatCurrency(accountSummary.valorActual)}
                </p>
              </div>
              <div
                className={cn(
                  'rounded-lg p-4',
                  accountSummary.gananciaPerdida >= 0
                    ? 'bg-green-50'
                    : 'bg-red-50'
                )}
              >
                <p className="text-xs text-surface-600 uppercase tracking-wide mb-1">
                  Ganancia/Pérdida
                </p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    accountSummary.gananciaPerdida >= 0
                      ? 'text-green-600'
                      : 'text-danger'
                  )}
                >
                  {accountSummary.gananciaPerdida >= 0 ? '+' : ''}
                  {formatCurrency(accountSummary.gananciaPerdida)}
                </p>
              </div>
              <div className="bg-surface-100 rounded-lg p-4">
                <p className="text-xs text-surface-600 uppercase tracking-wide mb-1">
                  Depósitos totales
                </p>
                <p className="text-xl font-bold text-surface-900">
                  {formatCurrency(accountSummary.depositosTotales)}
                </p>
              </div>
              <div className="bg-surface-100 rounded-lg p-4">
                <p className="text-xs text-surface-600 uppercase tracking-wide mb-1">
                  Retiros totales
                </p>
                <p className="text-xl font-bold text-surface-900">
                  {formatCurrency(accountSummary.retirosTotales)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Section 4: Security */}
        <Card title="Seguridad" className="mb-6">
          {!editingPassword ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingPassword(true)}
            >
              Cambiar Contraseña
            </Button>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                <Input
                  label="Contraseña actual"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <Input
                  label="Nueva contraseña"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    });
                    setPasswordErrors([]);
                  }}
                />
                {passwordData.newPassword && (
                  <PasswordStrengthIndicator password={passwordData.newPassword} />
                )}
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={
                    passwordData.confirmPassword &&
                    passwordData.newPassword !== passwordData.confirmPassword
                      ? 'Las contraseñas no coinciden'
                      : undefined
                  }
                />
                {passwordErrors.length > 0 && (
                  <div className="bg-red-50 border border-danger rounded p-3">
                    <ul className="text-sm text-danger space-y-1">
                      {passwordErrors.map((err, i) => (
                        <li key={i}>- {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={saveLoading}
                  onClick={handleChangePassword}
                >
                  Guardar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingPassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setPasswordErrors([]);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Section 5: Preferences */}
        <Card title="Preferencias" className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-surface-900">
                  Notificaciones por correo
                </p>
                <p className="text-sm text-surface-600">
                  Recibe actualizaciones sobre tu portafolio
                </p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
                  notificationsEnabled ? 'bg-brand-primary' : 'bg-surface-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                    notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="pt-4 border-t border-surface-200">
              <p className="font-medium text-surface-900 mb-2">Idioma</p>
              <p className="text-surface-700 mb-1">Español</p>
              <p className="text-sm text-surface-500">
                Más idiomas próximamente
              </p>
            </div>
          </div>
        </Card>

        {/* Section 6: Danger Zone */}
        <Card className="mb-6 border border-danger">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                Cerrar sesión
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </div>

            <div className="pt-4 border-t border-surface-200">
              <h3 className="text-lg font-semibold text-danger mb-2">
                Zona de riesgo
              </h3>
              <p className="text-sm text-surface-600 mb-4">
                Eliminar tu cuenta es una acción permanente
              </p>
              <Button
                variant="danger"
                size="sm"
                disabled
                onClick={() => setShowDeleteWarning(true)}
              >
                Eliminar Cuenta
              </Button>
              <p className="text-xs text-surface-500 mt-2">
                (Esta funcionalidad será habilitada en futuras actualizaciones)
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
