import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getAll, create, addAuditLog } from '@/server/db/store';
import { paginate } from '@/server/utils/pagination';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').toLowerCase().trim();
  const status = url.searchParams.get('status') || '';
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize');
  const all = url.searchParams.get('all');

  let list = await getAll('customers');

  // Filter by role if staff: show assigned or all
  if (user.role === 'staff' && url.searchParams.get('my_only') === 'true') {
    list = list.filter((c) => c.assignedStaffId === user.id);
  }

  // Filter by status
  if (status) {
    list = list.filter((c) => c.status === status);
  }

  // Search by code, name, phone, email
  if (search) {
    list = list.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.code && c.code.toLowerCase().includes(search)) ||
        (c.phone && c.phone.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(search))
    );
  }

  const result = paginate(list, { page, limit, all });

  return NextResponse.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    total: result.total
  });
}

export async function POST(request) {
  const { errorResponse, user } = await requireRole(request, ['admin', 'manager', 'staff']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Tên khách hàng và số điện thoại là bắt buộc' },
        { status: 400 }
      );
    }

    const customers = await getAll('customers');
    const autoCode = `KH-${String(customers.length + 1).padStart(3, '0')}`;

    const newCustomer = await create('customers', {
      code: body.code || autoCode,
      name: body.name.trim(),
      contactPerson: body.contactPerson?.trim() || '',
      phone: body.phone.trim(),
      email: body.email?.trim() || '',
      address: body.address?.trim() || '',
      status: body.status || 'lead',
      group: body.group || 'Doanh nghiệp',
      revenue: Number(body.revenue) || 0,
      assignedStaffId: body.assignedStaffId || user.id,
      assignedStaffName: body.assignedStaffName || user.name,
      notes: body.notes?.trim() || ''
    });

    await addAuditLog('CREATE_CUSTOMER', `Tạo mới khách hàng ${newCustomer.name} (${newCustomer.code})`, user);

    return NextResponse.json({
      success: true,
      data: newCustomer
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lưu khách hàng mới' },
      { status: 500 }
    );
  }
}
