import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser, verifyPassword, hashPassword } from '@/lib/auth';

interface ApiResponse {
  success: boolean;
  error?: string;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula'),
});

type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

/**
 * PUT /api/auth/me/password
 * Change the authenticated user's password
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No autorizado. Token inválido o no proporcionado',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData: ChangePasswordRequest = changePasswordSchema.parse(body);

    const user = await db.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    const currentPasswordValid = await verifyPassword(
      validatedData.currentPassword,
      user.passwordHash
    );

    if (!currentPasswordValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'La contraseña actual es incorrecta',
        },
        { status: 401 }
      );
    }

    const newPasswordHash = await hashPassword(validatedData.newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json<ApiResponse>({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Error de validación';
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido',
        },
        { status: 400 }
      );
    }

    console.error('Error en PUT /api/auth/me/password:', error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor al cambiar la contraseña',
      },
      { status: 500 }
    );
  }
}
