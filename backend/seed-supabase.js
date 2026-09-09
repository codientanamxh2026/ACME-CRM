require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const initialData = require('./src/config/initialData');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
);

async function seed() {
  console.log('\n=== SEED DU LIEU MAU VAO SUPABASE ===\n');

  // 1. Users
  console.log('[1] Tao users...');
  for (const u of initialData.users) {
    const { error } = await supabase.from('users').upsert({
      id:            u.id,
      email:         u.email,
      password_hash: u.passwordHash,
      name:          u.name,
      role:          u.role,
      department:    u.department || null,
      phone:         u.phone || null,
      status:        u.status || 'active'
    }, { onConflict: 'id' });
    if (error) console.log('  FAIL user ' + u.email + ': ' + error.message);
    else console.log('  OK  ' + u.name + ' (' + u.role + ')');
  }

  // 2. Customers
  console.log('\n[2] Tao customers...');
  for (const c of initialData.customers) {
    const { error } = await supabase.from('customers').upsert({
      id:                c.id,
      code:              c.code,
      name:              c.name,
      contact_person:    c.contactPerson || null,
      phone:             c.phone,
      email:             c.email || null,
      address:           c.address || null,
      status:            c.status || 'lead',
      grp:               c.group || 'Doanh nghiep',
      revenue:           c.revenue || 0,
      notes:             c.notes || null,
      assigned_staff_id: c.assignedStaffId || null
    }, { onConflict: 'id' });
    if (error) console.log('  FAIL customer ' + c.name + ': ' + error.message);
    else console.log('  OK  ' + c.name + ' (' + c.code + ')');
  }

  // 3. Products
  console.log('\n[3] Tao products...');
  for (const p of initialData.products) {
    const { error } = await supabase.from('products').upsert({
      id:          p.id,
      sku:         p.sku,
      name:        p.name,
      category:    p.category || 'Hang hoa thong dung',
      unit:        p.unit || 'Cai',
      cost_price:  p.costPrice || 0,
      sale_price:  p.salePrice || 0,
      stock:       p.stock || 0,
      min_stock:   p.minStock || 5,
      status:      p.status || 'in_stock',
      description: p.description || null
    }, { onConflict: 'id' });
    if (error) console.log('  FAIL product ' + p.name + ': ' + error.message);
    else console.log('  OK  ' + p.name + ' (SKU: ' + p.sku + ')');
  }

  // 4. Orders
  console.log('\n[4] Tao orders...');
  for (const o of initialData.orders) {
    const { error } = await supabase.from('orders').upsert({
      id:              o.id,
      order_number:    o.orderNumber,
      customer_id:     o.customerId,
      customer_name:   o.customerName,
      subtotal:        o.subtotal || 0,
      discount:        o.discount || 0,
      total_amount:    o.totalAmount || 0,
      status:          o.status || 'pending',
      payment_status:  o.paymentStatus || 'unpaid',
      payment_method:  o.paymentMethod || 'bank_transfer',
      created_by:      o.createdBy || null,
      created_by_name: o.createdByName || null,
      notes:           o.notes || null
    }, { onConflict: 'id' });
    if (error) console.log('  FAIL order ' + o.orderNumber + ': ' + error.message);
    else console.log('  OK  ' + o.orderNumber + ' (' + o.status + ')');

    // Order items
    if (o.items && o.items.length > 0) {
      for (let i = 0; i < o.items.length; i++) {
        const item = o.items[i];
        const { error: itemErr } = await supabase.from('order_items').upsert({
          id:         o.id + '-item-' + i,
          order_id:   o.id,
          product_id: item.productId,
          name:       item.name,
          sku:        item.sku || '',
          price:      item.price || 0,
          quantity:   item.quantity || 1,
          total:      item.total || 0
        }, { onConflict: 'id' });
        if (itemErr) console.log('    FAIL item: ' + itemErr.message);
      }
    }
  }

  // 5. Audit logs
  console.log('\n[5] Tao audit logs...');
  const sampleLogs = [
    { id: 'log-1', action: 'LOGIN', description: 'Admin dang nhap he thong', user_id: 'usr-1', user_name: 'Nguyen Hai Dang' },
    { id: 'log-2', action: 'CREATE_CUSTOMER', description: 'Tao khach hang moi: Cong ty TNHH Co Khi An Phat', user_id: 'usr-2', user_name: 'Tran Thi Mai' },
    { id: 'log-3', action: 'CREATE_ORDER', description: 'Tao don hang ORD-2026-001', user_id: 'usr-3', user_name: 'Le Quoc Huy' }
  ];
  for (const log of sampleLogs) {
    const { error } = await supabase.from('audit_logs').upsert(log, { onConflict: 'id' });
    if (error) console.log('  FAIL log: ' + error.message);
    else console.log('  OK  ' + log.action);
  }

  // Final verification
  console.log('\n=== XAC NHAN KET QUA ===');
  const tables = ['users', 'customers', 'products', 'orders', 'order_items', 'audit_logs'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id', { count: 'exact' });
    if (error) console.log('  ' + t + ': LOI - ' + error.message);
    else console.log('  ' + t + ': ' + (data ? data.length : 0) + ' records');
  }
  console.log('\nSeed hoan tat! Supabase san sang phuc vu API.\n');
}

seed().catch(console.error);
