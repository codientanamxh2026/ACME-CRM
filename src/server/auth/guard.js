import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export async function getSessionUser(request) {
  try {
    let token = null;

    // 1. Try Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. Try cookie
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/crm_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) return null;

    const payload = await verifyToken(token);
    return payload;
  } catch (err) {
    console.error('Session verification error:', err);
    return null;
  }
}

export async function requireAuth(request) {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' },
        { status: 401 }
      ),
      user: null
    };
  }
  return { errorResponse: null, user };
}

export async function requireRole(request, allowedRoles = []) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return { errorResponse, user: null };

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện thao tác này' },
        { status: 403 }
      ),
      user: null
    };
  }

  return { errorResponse: null, user };
}
