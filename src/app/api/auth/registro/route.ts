import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';

/**
 * Zod validation schema for user registration
 */
const registroSchema = z.object({
  email: z.string().email('El correo electrónico debe ser válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula'),
  firstName: z.string().min(1, 'El nombre es requerido').trim(),
  lastName: z.string().min(1, 'El apellido es requerido').trim(),
  ciPassport: z.string().min(1, 'El CI o pasaporte es requerido').trim(),
  dateOfBirth: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'La fecha de nacimiento debe ser válida'
  ),
  phone: z.string().optional().nullable(),
});

type RegistroRequest = z.infer<typeof registroSchema>;

interface RegistroResponse {
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
      createdAt: string;
    };
    token: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<RegistroResponse>> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData: RegistroRequest = registroSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json<RegistroResponse>(
        {
          success: false,
          error: 'El correo electrónico ya está registrado',
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        passwordHash,
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        ciPassport: validatedData.ciPassport.trim(),
        dateOfBirth: new Date(validatedData.dateOfBirth),
        phone: validatedData.phone?.trim() || null,
        country: 'VE',
        tosAccepted: false,
        onboardingComplete: false,
      },
    });

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json<RegistroResponse>(
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
            createdAt: user.createdAt.toISOString(),
          },
          token,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Error de validación';
      return NextResponse.json<RegistroResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<RegistroResponse>(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido',
        },
        { status: 400 }
      );
    }

    console.error('Error en registro:', error);

    return NextResponse.json<RegistroResponse>(
      {
        success: false,
        error: 'Error interno del servidor al procesar el registro',
      },
      { status: 500 }
    );
  }
}
