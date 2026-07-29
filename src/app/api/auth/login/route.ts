import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';

/**
 * Zod validation schema for login
 */
const loginSchema = z.object({
  email: z.string().email('El correo electrónico debe ser válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginRequest = z.infer<typeof loginSchema>;

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      ciPassport: string;
      dateOfBirth: string;
      country: string;
      onboardingComplete: boolean;
      tosAccepted: boolean;
      createdAt: string;
    };
    token: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData: LoginRequest = loginSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: 'Correo o contraseña incorrectos',
        },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: 'Correo o contraseña incorrectos',
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json<LoginResponse>(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            ciPassport: user.ciPassport,
            dateOfBirth: user.dateOfBirth.toISOString(),
            country: user.country,
            onboardingComplete: user.onboardingComplete,
            tosAccepted: user.tosAccepted,
            createdAt: user.createdAt.toISOString(),
          },
          token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Error de validación';
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido',
        },
        { status: 400 }
      );
    }

    console.error('Error en login:', error);

    return NextResponse.json<LoginResponse>(
      {
        success: false,
        error: 'Error interno del servidor al procesar el login',
      },
      { status: 500 }
    );
  }
}
