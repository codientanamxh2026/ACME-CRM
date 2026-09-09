const db = require('../config/db');
const { paginate } = require('../utils/pagination');

async function getProducts(query = {}) {
  let list = await db.getAll('products');
  const { search, category, low_stock } = query;

  if (low_stock === 'true') {
    list = list.filter((p) => (p.stock || 0) <= (p.minStock || 5));
  }

  if (category) {
    list = list.filter((p) => p.category === category);
  }

  if (search) {
    const term = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
    );
  }

  return paginate(list, query);
}

async function getProductById(id) {
  const product = await db.getById('products', id);
  if (!product) throw new Error('Không tìm thấy sản phẩm trong kho');
  return product;
}

async function createProduct(data, user) {
  if (!data.name || !data.sku) {
    throw new Error('Tên sản phẩm và mã SKU là bắt buộc');
  }

  const products = await db.getAll('products');
  const existing = products.find((p) => p.sku.toLowerCase() === data.sku.trim().toLowerCase());
  if (existing) {
    throw new Error(`Mã SKU "${data.sku}" đã tồn tại`);
  }

  const stock = Number(data.stock) || 0;
  const minStock = Number(data.minStock) || 5;

  let status = 'in_stock';
  if (stock === 0) status = 'out_of_stock';
  else if (stock <= minStock) status = 'low_stock';

  const newProduct = await db.create('products', {
    sku: data.sku.trim().toUpperCase(),
    name: data.name.trim(),
    category: data.category ? data.category.trim() : 'Hàng hóa thông dụng',
    unit: data.unit ? data.unit.trim() : 'Cái',
    costPrice: Number(data.costPrice) || 0,
    salePrice: Number(data.salePrice) || 0,
    stock,
    minStock,
    status,
    description: data.description ? data.description.trim() : ''
  });

  await db.addAuditLog('CREATE_PRODUCT', `Thêm sản phẩm mới ${newProduct.name} (${newProduct.sku})`, user);
  return newProduct;
}

async function updateProduct(id, data, user) {
  const existing = await db.getById('products', id);
  if (!existing) throw new Error('Không tìm thấy sản phẩm');

  if (data.stockDelta !== undefined) {
    return await adjustStock(id, Number(data.stockDelta), data.note, user);
  }

  const stock = data.stock !== undefined ? Number(data.stock) : existing.stock;
  const minStock = data.minStock !== undefined ? Number(data.minStock) : existing.minStock;

  let status = 'in_stock';
  if (stock === 0) status = 'out_of_stock';
  else if (stock <= minStock) status = 'low_stock';

  const updated = await db.update('products', id, {
    name: data.name !== undefined ? data.name.trim() : existing.name,
    category: data.category !== undefined ? data.category.trim() : existing.category,
    unit: data.unit !== undefined ? data.unit.trim() : existing.unit,
    costPrice: data.costPrice !== undefined ? Number(data.costPrice) : existing.costPrice,
    salePrice: data.salePrice !== undefined ? Number(data.salePrice) : existing.salePrice,
    stock,
    minStock,
    status,
    description: data.description !== undefined ? data.description.trim() : existing.description
  });

  await db.addAuditLog('UPDATE_PRODUCT', `Cập nhật thông tin sản phẩm ${updated.name} (${updated.sku})`, user);
  return updated;
}

async function adjustStock(id, delta, note, user) {
  const existing = await db.getById('products', id);
  if (!existing) throw new Error('Không tìm thấy sản phẩm');

  const updated = await db.adjustProductStock(id, Number(delta));
  const actionText = delta > 0 ? `Nhập kho +${delta}` : `Xuất kho ${delta}`;
  await db.addAuditLog('ADJUST_STOCK', `${actionText} cho sản phẩm ${existing.name} (${existing.sku}). Ghi chú: ${note || 'Điều chỉnh thủ công'}`, user);
  return updated;
}

async function deleteProduct(id, user) {
  const existing = await db.getById('products', id);
  if (!existing) throw new Error('Không tìm thấy sản phẩm');

  await db.remove('products', id);
  await db.addAuditLog('DELETE_PRODUCT', `Xóa sản phẩm ${existing.name} (${existing.sku}) khỏi kho`, user);
  return true;
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct
};
