import { NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guard';
import { getAll, create, addAuditLog } from '@/server/db/store';
import { hashPassword } from '@/server/auth/password';
import { paginate } from '@/server/utils/pagination';

export async function GET(request) {
  const { errorResponse } = await requireRole(request, ['admin', 'manager']);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize');
  const all = url.searchParams.get('all');

  const users = await getAll('users');
  const safeUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    phone: u.phone,
    status: u.status,
    createdAt: u.createdAt
  }));

  const result = paginate(safeUsers, { page, limit, all });

  return NextResponse.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    total: result.total
  });
}

export async function POST(request) {
  const { errorResponse, user } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { success: false, error: 'Họ tên, email, mật khẩu và vai trò là bắt buộc' },
        { status: 400 }
      );
    }

    const users = await getAll('users');
    const existing = users.find((u) => u.email.toLowerCase() === body.email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email này đã được sử dụng' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(body.password);

    const newUser = await create('users', {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      passwordHash,
      role: body.role,
      department: body.department?.trim() || 'Kinh Doanh',
      phone: body.phone?.trim() || '',
      status: 'active'
    });

    await addAuditLog('CREATE_USER', `Tạo tài khoản người dùng: ${newUser.name} (${newUser.email}) - Quyền: ${newUser.role}`, user);

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      phone: newUser.phone,
      status: newUser.status,
      createdAt: newUser.createdAt
    };

    return NextResponse.json({ success: true, data: safeUser });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi tạo người dùng mới' }, { status: 500 });
  }
}
