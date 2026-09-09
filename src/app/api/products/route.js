import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getAll, create, addAuditLog } from '@/server/db/store';
import { paginate } from '@/server/utils/pagination';

export async function GET(request) {
  const { errorResponse } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').toLowerCase().trim();
  const category = url.searchParams.get('category') || '';
  const lowStockOnly = url.searchParams.get('low_stock') === 'true';
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize');
  const all = url.searchParams.get('all');

  let list = await getAll('products');

  if (lowStockOnly) {
    list = list.filter((p) => (p.stock || 0) <= (p.minStock || 5));
  }

  if (category) {
    list = list.filter((p) => p.category === category);
  }

  if (search) {
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.sku && p.sku.toLowerCase().includes(search)) ||
        (p.category && p.category.toLowerCase().includes(search))
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
  const { errorResponse, user } = await requireRole(request, ['admin', 'inventory']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    if (!body.name || !body.sku) {
      return NextResponse.json(
        { success: false, error: 'Tên sản phẩm và mã SKU là bắt buộc' },
        { status: 400 }
      );
    }

    const products = await getAll('products');
    const existingSku = products.find((p) => p.sku.toLowerCase() === body.sku.trim().toLowerCase());
    if (existingSku) {
      return NextResponse.json(
        { success: false, error: `Mã SKU "${body.sku}" đã tồn tại trong kho` },
        { status: 400 }
      );
    }

    const stock = Number(body.stock) || 0;
    const minStock = Number(body.minStock) || 5;

    let status = 'in_stock';
    if (stock === 0) status = 'out_of_stock';
    else if (stock <= minStock) status = 'low_stock';

    const newProduct = await create('products', {
      sku: body.sku.trim().toUpperCase(),
      name: body.name.trim(),
      category: body.category?.trim() || 'Hàng hóa thông dụng',
      unit: body.unit?.trim() || 'Cái',
      costPrice: Number(body.costPrice) || 0,
      salePrice: Number(body.salePrice) || 0,
      stock,
      minStock,
      status,
      description: body.description?.trim() || ''
    });

    await addAuditLog('CREATE_PRODUCT', `Thêm sản phẩm mới vào kho: ${newProduct.name} (${newProduct.sku})`, user);

    return NextResponse.json({
      success: true,
      data: newProduct
    });
  } catch (err) {
    console.error('Error creating product:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo sản phẩm mới' },
      { status: 500 }
    );
  }
}
