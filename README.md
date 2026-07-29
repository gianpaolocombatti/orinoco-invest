# Orinoco Invest 🌱

Ahorra en USD. Invierte automático. Retira cuando quieras. Plataforma de inversión que permite a venezolanos acceder a portafolios diversificados internacionales.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de datos**: PostgreSQL + Prisma ORM
- **Autenticación**: JWT (jose) + bcryptjs
- **Gráficos**: Recharts
- **Brokerage**: Alpaca Markets API
- **Deployment**: Vercel (frontend) + Railway/Supabase (database)

## Inicio Rápido

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- Cuenta de Alpaca Markets (paper trading)

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Configurar base de datos
npx prisma generate
npx prisma db push

# 4. Sembrar datos de prueba
npm run db:seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Credenciales de Prueba

| Email | Contraseña | Estado |
|-------|------------|--------|
| demo@acorns.ve | Test1234! | Onboarding completo |
| maria@acorns.ve | Test1234! | Sin onboarding |

## Estructura del Proyecto

```
acorns-ve/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos de prueba
├── sql/
│   └── schema.sql             # DDL PostgreSQL directo
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout raíz
│   │   ├── page.tsx           # Landing / Login
│   │   ├── globals.css        # Estilos globales
│   │   ├── registro/          # Registro (4 pasos)
│   │   ├── evaluacion/        # Evaluación de riesgo
│   │   ├── portafolios/       # Selección de portafolio
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── depositar/         # Flujo de depósito (3 pasos)
│   │   ├── retirar/           # Flujo de retiro
│   │   ├── historial/         # Historial de transacciones
│   │   ├── perfil/            # Perfil y configuración
│   │   ├── ayuda/             # FAQ y centro de ayuda
│   │   └── api/
│   │       ├── auth/          # Autenticación (registro, login, me, logout)
│   │       ├── portafolio/    # CRUD de portafolio
│   │       ├── depositos/     # Gestión de depósitos
│   │       ├── retiros/       # Gestión de retiros
│   │       ├── transacciones/ # Historial de transacciones
│   │       └── alpaca/        # Integración con Alpaca Markets
│   ├── components/
│   │   ├── ui/                # Button, Input, Card, LoadingSpinner
│   │   └── layout/            # Navbar, BottomNav
│   ├── context/
│   │   └── AuthContext.tsx     # Contexto de autenticación
│   ├── lib/
│   │   ├── db.ts              # Cliente Prisma (singleton)
│   │   ├── auth.ts            # JWT, hash, verificación
│   │   ├── utils.ts           # Utilidades (formato, validación)
│   │   ├── portfolio.ts       # Lógica de portafolios
│   │   └── alpaca.ts          # Cliente API de Alpaca
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   └── middleware.ts           # Protección de rutas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## API Endpoints

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/registro | Registrar nuevo usuario |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/me | Obtener usuario actual |
| POST | /api/auth/logout | Cerrar sesión |

### Portafolio

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/portafolio | Obtener portafolio con holdings |
| POST | /api/portafolio | Crear/seleccionar portafolio |
| PUT | /api/portafolio | Actualizar portafolio |

### Depósitos y Retiros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/depositos | Listar depósitos (paginado) |
| POST | /api/depositos | Crear solicitud de depósito |
| GET | /api/retiros | Listar retiros (paginado) |
| POST | /api/retiros | Crear solicitud de retiro |
| GET | /api/transacciones | Historial de transacciones |

### Alpaca Markets

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/alpaca/market-data | Precios actuales (BND, VTI, GLD) |
| POST | /api/alpaca/orders | Ejecutar inversión |
| GET | /api/alpaca/account | Info de cuenta Alpaca |

## Portafolios

| Tipo | Bonos (BND) | Acciones (VTI) | Oro (GLD) |
|------|-------------|----------------|-----------|
| Conservador | 60% | 30% | 10% |
| Moderado | 40% | 50% | 10% |
| Agresivo | 20% | 70% | 10% |

## Comisiones

- Depósitos: 1% del monto
- Retiros: 1% del monto
- Sin comisiones mensuales

## Métodos de Pago

- Bitcoin (BTC)
- USDT (TRC-20)
- Zelle
- PayPal

## Seguridad

- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- Autenticación JWT con expiración de 7 días
- Cookies HTTP-only en producción
- Middleware de protección de rutas
- Headers de seguridad (X-Frame-Options, X-XSS-Protection, etc.)
- Validación de inputs con Zod
- CORS configurado

## Deployment

### Vercel (Frontend + API)

```bash
npm install -g vercel
vercel
```

### Base de Datos (Supabase)

1. Crear proyecto en supabase.com
2. Copiar DATABASE_URL al .env
3. Ejecutar `npx prisma db push`
4. Ejecutar `npm run db:seed`

### Variables de Entorno en Producción

Configurar en el dashboard de Vercel:
- `DATABASE_URL`
- `JWT_SECRET`
- `ALPACA_API_KEY`
- `ALPACA_SECRET_KEY`
- `ALPACA_BASE_URL` (cambiar a producción cuando esté listo)

## Próximos Pasos (Post-MVP)

- [ ] Inversiones recurrentes automáticas
- [ ] Round-ups (redondeo de compras)
- [ ] Programa de referidos
- [ ] Chat de soporte in-app
- [ ] App nativa (React Native)
- [ ] Verificación KYC con documentos
- [ ] Vinculación automática de cuentas bancarias
- [ ] Reportes fiscales
- [ ] Múltiples idiomas (inglés, portugués)
- [ ] Notificaciones push
- [ ] 2FA con SMS (Twilio)

## Licencia

Privado - Todos los derechos reservados.


