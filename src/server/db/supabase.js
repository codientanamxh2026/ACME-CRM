import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false }
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client on server:', err);
    }
  }

  return supabaseClient;
}

// ─── Data Mappers ──────────────────────────────────────────────────────────

export function mapUserFromDb(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.password_hash,
    name: u.name,
    role: u.role,
    department: u.department,
    phone: u.phone,
    status: u.status,
    createdAt: u.created_at,
    updatedAt: u.updated_at
  };
}

export function mapUserToDb(u) {
  const row = {};
  if (u.id) row.id = u.id;
  if (u.email) row.email = u.email;
  if (u.passwordHash) row.password_hash = u.passwordHash;
  if (u.name) row.name = u.name;
  if (u.role) row.role = u.role;
  if (u.department !== undefined) row.department = u.department;
  if (u.phone !== undefined) row.phone = u.phone;
  if (u.status) row.status = u.status;
  return row;
}

export function mapCustomerFromDb(c) {
  if (!c) return null;
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    contactPerson: c.contact_person,
    phone: c.phone,
    email: c.email,
    address: c.address,
    status: c.status,
    group: c.grp,
    revenue: Number(c.revenue) || 0,
    notes: c.notes,
    assignedStaffId: c.assigned_staff_id,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

export function mapCustomerToDb(c) {
  const row = {};
  if (c.id) row.id = c.id;
  if (c.code) row.code = c.code;
  if (c.name) row.name = c.name;
  if (c.contactPerson !== undefined) row.contact_person = c.contactPerson;
  if (c.phone) row.phone = c.phone;
  if (c.email !== undefined) row.email = c.email;
  if (c.address !== undefined) row.address = c.address;
  if (c.status) row.status = c.status;
  if (c.group !== undefined) row.grp = c.group;
  if (c.revenue !== undefined) row.revenue = Number(c.revenue) || 0;
  if (c.notes !== undefined) row.notes = c.notes;
  if (c.assignedStaffId !== undefined) row.assigned_staff_id = c.assignedStaffId;
  return row;
}

export function mapProductFromDb(p) {
  if (!p) return null;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    costPrice: Number(p.cost_price) || 0,
    salePrice: Number(p.sale_price) || 0,
    stock: Number(p.stock) || 0,
    minStock: Number(p.min_stock) || 5,
    status: p.status,
    description: p.description,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

export function mapProductToDb(p) {
  const row = {};
  if (p.id) row.id = p.id;
  if (p.sku) row.sku = p.sku;
  if (p.name) row.name = p.name;
  if (p.category !== undefined) row.category = p.category;
  if (p.unit !== undefined) row.unit = p.unit;
  if (p.costPrice !== undefined) row.cost_price = Number(p.costPrice) || 0;
  if (p.salePrice !== undefined) row.sale_price = Number(p.salePrice) || 0;
  if (p.stock !== undefined) row.stock = Number(p.stock) || 0;
  if (p.minStock !== undefined) row.min_stock = Number(p.minStock) || 5;
  if (p.status) row.status = p.status;
  if (p.description !== undefined) row.description = p.description;
  return row;
}

export function mapOrderFromDb(o, items = []) {
  if (!o) return null;
  return {
    id: o.id,
    orderNumber: o.order_number,
    customerId: o.customer_id,
    customerName: o.customer_name,
    subtotal: Number(o.subtotal) || 0,
    discount: Number(o.discount) || 0,
    tax: 0,
    totalAmount: Number(o.total_amount) || 0,
    status: o.status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method,
    createdBy: o.created_by,
    createdByName: o.created_by_name,
    notes: o.notes,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.name,
      sku: i.sku,
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
      total: Number(i.total) || 0
    })),
    createdAt: o.created_at,
    updatedAt: o.updated_at
  };
}

export function mapOrderToDb(o) {
  const row = {};
  if (o.id) row.id = o.id;
  if (o.orderNumber) row.order_number = o.orderNumber;
  if (o.customerId) row.customer_id = o.customerId;
  if (o.customerName) row.customer_name = o.customerName;
  if (o.subtotal !== undefined) row.subtotal = Number(o.subtotal) || 0;
  if (o.discount !== undefined) row.discount = Number(o.discount) || 0;
  if (o.totalAmount !== undefined) row.total_amount = Number(o.totalAmount) || 0;
  if (o.status) row.status = o.status;
  if (o.paymentStatus) row.payment_status = o.paymentStatus;
  if (o.paymentMethod) row.payment_method = o.paymentMethod;
  if (o.createdBy !== undefined) row.created_by = o.createdBy;
  if (o.createdByName !== undefined) row.created_by_name = o.createdByName;
  if (o.notes !== undefined) row.notes = o.notes;
  return row;
}

export function mapDynamicTableFromDb(dt) {
  if (!dt) return null;

  let sharedWith = ['all'];
  let slug = dt.id;

  // Extract metadata from stored_file_path if present
  if (dt.stored_file_path && typeof dt.stored_file_path === 'string' && dt.stored_file_path.startsWith('meta:')) {
    try {
      const meta = JSON.parse(dt.stored_file_path.slice(5));
      if (Array.isArray(meta.sharedWith)) sharedWith = meta.sharedWith;
      if (meta.slug) slug = meta.slug;
    } catch {
      // ignore parse error
    }
  } else if (dt.shared_with) {
    sharedWith = typeof dt.shared_with === 'string' ? JSON.parse(dt.shared_with) : (dt.shared_with || ['all']);
  }

  return {
    id: dt.id,
    slug: slug || dt.id,
    title: dt.title,
    sourceFileName: dt.source_file_name,
    storedFilePath: dt.stored_file_path,
    rowCount: Number(dt.row_count) || 0,
    columns: typeof dt.columns === 'string' ? JSON.parse(dt.columns) : dt.columns || [],
    rows: typeof dt.rows === 'string' ? JSON.parse(dt.rows) : dt.rows || [],
    importedBy: dt.imported_by,
    importedAt: dt.imported_at,
    sharedWith
  };
}

export function mapDynamicTableToDb(dt) {
  const row = {};
  if (dt.id) row.id = dt.id;
  if (dt.title) row.title = dt.title;
  if (dt.sourceFileName) row.source_file_name = dt.sourceFileName;
  if (dt.rowCount !== undefined) row.row_count = Number(dt.rowCount) || 0;
  if (dt.columns !== undefined) row.columns = dt.columns;
  if (dt.rows !== undefined) row.rows = dt.rows;
  if (dt.importedBy !== undefined) row.imported_by = dt.importedBy;

  // Store metadata (sharedWith and slug) inside stored_file_path to avoid PGRST204 schema mismatch
  if (dt.sharedWith !== undefined || dt.slug !== undefined) {
    const meta = {
      sharedWith: Array.isArray(dt.sharedWith) ? dt.sharedWith : ['all'],
      slug: dt.slug || dt.id || ''
    };
    row.stored_file_path = `meta:${JSON.stringify(meta)}`;
  } else if (dt.storedFilePath !== undefined) {
    row.stored_file_path = dt.storedFilePath;
  }

  return row;
}

export function mapAuditLogFromDb(al) {
  if (!al) return null;
  return {
    id: al.id,
    action: al.action,
    description: al.description,
    userId: al.user_id,
    userName: al.user_name,
    timestamp: al.ts
  };
}

export function mapAuditLogToDb(al) {
  const row = {};
  if (al.id) row.id = al.id;
  if (al.action) row.action = al.action;
  if (al.description) row.description = al.description;
  if (al.userId !== undefined) row.user_id = al.userId;
  if (al.userName !== undefined) row.user_name = al.userName;
  return row;
}
