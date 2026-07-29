import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de prueba...');

  // Limpiar datos existentes
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.fundingMethod.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuario de prueba
  const passwordHash = await bcrypt.hash('Test1234!', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@orinoco-invest.com',
      phone: '+584121234567',
      passwordHash,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      ciPassport: 'V-12345678',
      dateOfBirth: new Date('1990-05-15'),
      country: 'VE',
      riskTolerance: 'MODERADO',
      investTimeline: 'MEDIANO_PLAZO',
      volatilityComfort: 'MODERADO',
      investExperience: 'ALGO',
      onboardingComplete: true,
      tosAccepted: true,
      tosAcceptedAt: new Date(),
    },
  });

  console.log(`✅ Usuario creado: ${user.email}`);

  // Crear métodos de financiamiento
  await prisma.fundingMethod.createMany({
    data: [
      {
        userId: user.id,
        type: 'ZELLE',
        label: 'Zelle - Bank of America',
        details: 'carlos.rodriguez@email.com',
        isDefault: true,
      },
      {
        userId: user.id,
        type: 'CRYPTO',
        label: 'Binance - USDT',
        details: 'TXyz1234567890abcdef',
        isDefault: false,
      },
    ],
  });

  console.log('✅ Métodos de financiamiento creados');

  // Crear portafolio
  const portfolio = await prisma.portfolio.create({
    data: {
      userId: user.id,
      portfolioType: 'BALANCEADO',
      totalValueUsd: 1250.75,
      totalCostBasis: 1100.0,
      lastRebalanced: new Date('2025-01-15'),
    },
  });

  console.log('✅ Portafolio creado');

  // Crear holdings
  await prisma.holding.createMany({
    data: [
      {
        portfolioId: portfolio.id,
        assetSymbol: 'BND',
        assetName: 'Vanguard Total Bond ETF',
        assetClass: 'BONDS',
        shares: 6.5,
        costBasis: 440.0,
        currentPrice: 72.5,
        currentValue: 471.25,
      },
      {
        portfolioId: portfolio.id,
        assetSymbol: 'VTI',
        assetName: 'Vanguard Total Stock Market ETF',
        assetClass: 'STOCKS',
        shares: 2.8,
        costBasis: 550.0,
        currentPrice: 235.2,
        currentValue: 658.56,
      },
      {
        portfolioId: portfolio.id,
        assetSymbol: 'GLD',
        assetName: 'SPDR Gold Shares ETF',
        assetClass: 'GOLD',
        shares: 0.6,
        costBasis: 110.0,
        currentPrice: 201.57,
        currentValue: 120.94,
      },
    ],
  });

  console.log('✅ Holdings creados');

  // Crear depósitos
  await prisma.deposit.createMany({
    data: [
      {
        userId: user.id,
        amountUsd: 500.0,
        fee: 5.0,
        netAmount: 495.0,
        status: 'CONFIRMED',
        method: 'zelle',
        reference: 'ACORNS-20250101-ABC123',
        confirmedAt: new Date('2025-01-02'),
        createdAt: new Date('2025-01-01'),
      },
      {
        userId: user.id,
        amountUsd: 600.0,
        fee: 6.0,
        netAmount: 594.0,
        status: 'CONFIRMED',
        method: 'crypto_usdt',
        reference: 'ACORNS-20250115-DEF456',
        confirmedAt: new Date('2025-01-15'),
        createdAt: new Date('2025-01-15'),
      },
      {
        userId: user.id,
        amountUsd: 100.0,
        fee: 1.0,
        netAmount: 99.0,
        status: 'PENDING',
        method: 'paypal',
        reference: 'ACORNS-20250210-GHI789',
        createdAt: new Date('2025-02-10'),
      },
    ],
  });

  console.log('✅ Depósitos creados');

  // Crear retiro
  await prisma.withdrawal.create({
    data: {
      userId: user.id,
      amountUsd: 50.0,
      fee: 0.5,
      netAmount: 49.5,
      status: 'COMPLETED',
      destination: 'carlos.rodriguez@email.com',
      method: 'zelle',
      processedAt: new Date('2025-02-01'),
      createdAt: new Date('2025-01-28'),
    },
  });

  console.log('✅ Retiros creados');

  // Crear transacciones
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        type: 'DEPOSIT',
        amountUsd: 500.0,
        description: 'Depósito inicial vía Zelle',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-01'),
      },
      {
        userId: user.id,
        type: 'BUY',
        amountUsd: 200.0,
        asset: 'BND',
        shares: 2.8,
        pricePerShare: 71.43,
        description: 'Compra automática - Bonos',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-02'),
      },
      {
        userId: user.id,
        type: 'BUY',
        amountUsd: 250.0,
        asset: 'VTI',
        shares: 1.1,
        pricePerShare: 227.27,
        description: 'Compra automática - Acciones EE.UU.',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-02'),
      },
      {
        userId: user.id,
        type: 'BUY',
        amountUsd: 50.0,
        asset: 'GLD',
        shares: 0.26,
        pricePerShare: 192.31,
        description: 'Compra automática - Oro',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-02'),
      },
      {
        userId: user.id,
        type: 'DEPOSIT',
        amountUsd: 600.0,
        description: 'Depósito vía USDT (TRC-20)',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-15'),
      },
      {
        userId: user.id,
        type: 'BUY',
        amountUsd: 240.0,
        asset: 'BND',
        shares: 3.7,
        pricePerShare: 64.86,
        description: 'Compra automática - Bonos',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-16'),
      },
      {
        userId: user.id,
        type: 'BUY',
        amountUsd: 300.0,
        asset: 'VTI',
        shares: 1.7,
        pricePerShare: 176.47,
        description: 'Compra automática - Acciones EE.UU.',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-16'),
      },
      {
        userId: user.id,
        type: 'BUY',
        amountUsd: 60.0,
        asset: 'GLD',
        shares: 0.34,
        pricePerShare: 176.47,
        description: 'Compra automática - Oro',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-16'),
      },
      {
        userId: user.id,
        type: 'WITHDRAWAL',
        amountUsd: 50.0,
        description: 'Retiro a Zelle',
        status: 'COMPLETED',
        createdAt: new Date('2025-01-28'),
      },
      {
        userId: user.id,
        type: 'DEPOSIT',
        amountUsd: 100.0,
        description: 'Depósito vía PayPal',
        status: 'PENDING',
        createdAt: new Date('2025-02-10'),
      },
    ],
  });

  console.log('✅ Transacciones creadas');

  // Crear segundo usuario (sin onboarding completo)
  const user2Hash = await bcrypt.hash('Test1234!', 10);
  await prisma.user.create({
    data: {
      email: 'maria@acorns.ve',
      passwordHash: user2Hash,
      firstName: 'María',
      lastName: 'González',
      ciPassport: 'V-87654321',
      dateOfBirth: new Date('1995-08-22'),
      country: 'VE',
      onboardingComplete: false,
      tosAccepted: false,
    },
  });

  console.log('✅ Segundo usuario creado (sin onboarding)');
  console.log('');
  console.log('🎉 Datos de prueba sembrados exitosamente!');
  console.log('');
  console.log('Credenciales de prueba:');
  console.log('  Email: demo@acorns.ve');
  console.log('  Contraseña: Test1234!');
  console.log('');
  console.log('  Email: maria@acorns.ve (sin onboarding)');
  console.log('  Contraseña: Test1234!');
}

main()
  .catch((e) => {
    console.error('❌ Error al sembrar datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
