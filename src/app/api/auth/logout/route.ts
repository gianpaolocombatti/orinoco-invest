import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
  try {
    // Clear authentication cookie
    await clearAuthCookie();

    return NextResponse.json<LogoutResponse>(
      {
        success: true,
        message: 'Sesión cerrada exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en logout:', error);

    return NextResponse.json<LogoutResponse>(
      {
        success: false,
        error: 'Error interno del servidor al cerrar la sesión',
      },
      { status: 500 }
    );
  }
}
