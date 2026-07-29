import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').trim().optional(),
  lastName: z.string().min(1, 'El apellido es requerido').trim().optional(),
  phone: z.string().trim().optional().nullable(),
});

type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  ciPassport: string;
  dateOfBirth: string;
  country: string;
  riskTolerance: string | null;
  investTimeline: string | null;
  volatilityComfort: string | null;
  investExperience: string | null;
  onboardingComplete: boolean;
  tosAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioData {
  id: string;
  userId: string;
  portfolioType: string;
  totalValueUsd: number;
  totalCostBasis: number;
  lastRebalanced: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MeResponse {
  success: boolean;
  data?: {
    user: UserData;
    portfolio?: PortfolioData;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<MeResponse>> {
  try {
    // Verify authentication
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          error: 'No autorizado. Token inválido o no proporcionado',
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      include: {
        portfolio: true,
      },
    });

    if (!user) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    // Build response data
    const userData: UserData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      ciPassport: user.ciPassport,
      dateOfBirth: user.dateOfBirth.toISOString(),
      country: user.country,
      riskTolerance: user.riskTolerance,
      investTimeline: user.investTimeline,
      volatilityComfort: user.volatilityComfort,
      investExperience: user.investExperience,
      onboardingComplete: user.onboardingComplete,
      tosAccepted: user.tosAccepted,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const responseData: MeResponse['data'] = {
      user: userData,
    };

    // Include portfolio if it exists
    if (user.portfolio) {
      responseData.portfolio = {
        id: user.portfolio.id,
        userId: user.portfolio.userId,
        portfolioType: user.portfolio.portfolioType,
        totalValueUsd: user.portfolio.totalValueUsd,
        totalCostBasis: user.portfolio.totalCostBasis,
        lastRebalanced: user.portfolio.lastRebalanced?.toISOString() || null,
        createdAt: user.portfolio.createdAt.toISOString(),
        updatedAt: user.portfolio.updatedAt.toISOString(),
      };
    }

    return NextResponse.json<MeResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/auth/me:', error);

    return NextResponse.json<MeResponse>(
      {
        success: false,
        error: 'Error interno del servidor al obtener los datos del usuario',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/me
 * Update the authenticated user's personal info (name, phone)
 */
export async function PUT(request: NextRequest): Promise<NextResponse<MeResponse>> {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          error: 'No autorizado. Token inválido o no proporcionado',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData: UpdateProfileRequest = updateProfileSchema.parse(body);

    const user = await db.user.update({
      where: { id: authUser.userId },
      data: {
        ...(validatedData.firstName !== undefined && { firstName: validatedData.firstName }),
        ...(validatedData.lastName !== undefined && { lastName: validatedData.lastName }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
      },
      include: { portfolio: true },
    });

    const userData: UserData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      ciPassport: user.ciPassport,
      dateOfBirth: user.dateOfBirth.toISOString(),
      country: user.country,
      riskTolerance: user.riskTolerance,
      investTimeline: user.investTimeline,
      volatilityComfort: user.volatilityComfort,
      investExperience: user.investExperience,
      onboardingComplete: user.onboardingComplete,
      tosAccepted: user.tosAccepted,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const responseData: MeResponse['data'] = { user: userData };

    if (user.portfolio) {
      responseData.portfolio = {
        id: user.portfolio.id,
        userId: user.portfolio.userId,
        portfolioType: user.portfolio.portfolioType,
        totalValueUsd: user.portfolio.totalValueUsd,
        totalCostBasis: user.portfolio.totalCostBasis,
        lastRebalanced: user.portfolio.lastRebalanced?.toISOString() || null,
        createdAt: user.portfolio.createdAt.toISOString(),
        updatedAt: user.portfolio.updatedAt.toISOString(),
      };
    }

    return NextResponse.json<MeResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Error de validación';
      return NextResponse.json<MeResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json<MeResponse>(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido',
        },
        { status: 400 }
      );
    }

    console.error('Error en PUT /api/auth/me:', error);

    return NextResponse.json<MeResponse>(
      {
        success: false,
        error: 'Error interno del servidor al actualizar los datos del usuario',
      },
      { status: 500 }
    );
  }
}
