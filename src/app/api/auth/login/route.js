import { NextResponse } from 'next/server';
import { getAll, addAuditLog } from '@/server/db/store';
import { comparePassword } from '@/server/auth/password';
import { signToken } from '@/server/auth/jwt';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp email và mật khẩu' },
        { status: 400 }
      );
    }

    const users = await getAll('users');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    if (user.status === 'inactive') {
      return NextResponse.json(
        { success: false, error: 'Tài khoản của bạn đang bị tạm khóa' },
        { status: 403 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    const token = await signToken(tokenPayload);

    // Audit log
    await addAuditLog('USER_LOGIN', `Người dùng ${user.name} (${user.email}) đăng nhập thành công.`, user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone
    };

    const response = NextResponse.json({
      success: true,
      token,
      user: safeUser
    });

    // Set cookie
    response.cookies.set('crm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi xử lý đăng nhập' },
      { status: 500 }
    );
  }
}
