import { NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guard';
import { getAll } from '@/server/db/store';
import { paginate } from '@/server/utils/pagination';

export async function GET(request) {
  const { errorResponse } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize');
  const all = url.searchParams.get('all');

  const logs = await getAll('auditLogs');
  const result = paginate(logs, { page, limit, all });

  return NextResponse.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    total: result.total
  });
}
