import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guard';
import { getById } from '@/server/db/store';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const dbUser = await getById('users', user.id);
  if (!dbUser || dbUser.status === 'inactive') {
    return NextResponse.json(
      { success: false, error: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa' },
      { status: 401 }
    );
  }

  const safeUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    department: dbUser.department,
    phone: dbUser.phone
  };

  return NextResponse.json({
    success: true,
    user: safeUser
  });
}
