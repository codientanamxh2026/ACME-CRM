const fs = require('fs');
const path = require('path');
const initialData = require('./initialData');
const {
  getSupabase,
  mapUserFromDb,
  mapUserToDb,
  mapCustomerFromDb,
  mapCustomerToDb,
  mapProductFromDb,
  mapProductToDb,
  mapOrderFromDb,
  mapOrderToDb,
  mapDynamicTableFromDb,
  mapDynamicTableToDb,
  mapAuditLogFromDb,
  mapAuditLogToDb
} = require('./supabase');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');

function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing backend database store:', err);
  }
}

function readDb() {
  initStore();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading backend DB:', err);
    return JSON.parse(JSON.stringify(initialData));
  }
}

function writeDb(data) {
  initStore();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing backend DB:', err);
    return false;
  }
}

const db = {
  getAll: async (collection) => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        if (collection === 'users') {
          const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
          if (!error && data) return data.map(mapUserFromDb);
        } else if (collection === 'customers') {
          const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
          if (!error && data) return data.map(mapCustomerFromDb);
        } else if (collection === 'products') {
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (!error && data) return data.map(mapProductFromDb);
        } else if (collection === 'orders') {
          const { data: ordersData, error: ordersErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          const { data: itemsData } = await supabase.from('order_items').select('*');
          if (!ordersErr && ordersData) {
            return ordersData.map((o) => {
              const items = (itemsData || []).filter((i) => i.order_id === o.id);
              return mapOrderFromDb(o, items);
            });
          }
        } else if (collection === 'dynamicTables') {
          const { data, error } = await supabase.from('dynamic_tables').select('*').order('imported_at', { ascending: false });
          if (!error && data) return data.map(mapDynamicTableFromDb);
        } else if (collection === 'auditLogs') {
          const { data, error } = await supabase.from('audit_logs').select('*').order('ts', { ascending: false }).limit(200);
          if (!error && data) return data.map(mapAuditLogFromDb);
        }
      } catch (err) {
        console.warn(`Supabase getAll(${collection}) fallback to local store:`, err.message);
      }
    }

    const localData = readDb();
    return localData[collection] || [];
  },

  getById: async (collection, id) => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        if (collection === 'users') {
          const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
          if (!error && data) return mapUserFromDb(data);
        } else if (collection === 'customers') {
          const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
          if (!error && data) return mapCustomerFromDb(data);
        } else if (collection === 'products') {
          const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
          if (!error && data) return mapProductFromDb(data);
        } else if (collection === 'orders') {
          const { data: orderData, error: orderErr } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
          if (!orderErr && orderData) {
            const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', id);
            return mapOrderFromDb(orderData, itemsData || []);
          }
        } else if (collection === 'dynamicTables') {
          const { data, error } = await supabase.from('dynamic_tables').select('*').eq('id', id).maybeSingle();
          if (!error && data) return mapDynamicTableFromDb(data);
        }
      } catch (err) {
        console.warn(`Supabase getById(${collection}, ${id}) fallback to local store:`, err.message);
      }
    }

    const list = readDb()[collection] || [];
    return list.find((item) => item.id === id) || null;
  },

  create: async (collection, item) => {
    const newItem = {
      id: item.id || `${collection.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        if (collection === 'users') {
          await supabase.from('users').upsert(mapUserToDb(newItem));
        } else if (collection === 'customers') {
          await supabase.from('customers').upsert(mapCustomerToDb(newItem));
        } else if (collection === 'products') {
          await supabase.from('products').upsert(mapProductToDb(newItem));
        } else if (collection === 'orders') {
          await supabase.from('orders').upsert(mapOrderToDb(newItem));
          if (Array.isArray(newItem.items)) {
            for (let i = 0; i < newItem.items.length; i++) {
              const it = newItem.items[i];
              await supabase.from('order_items').upsert({
                id: `${newItem.id}-item-${i}`,
                order_id: newItem.id,
                product_id: it.productId,
                name: it.name,
                sku: it.sku || '',
                price: Number(it.price) || 0,
                quantity: Number(it.quantity) || 1,
                total: Number(it.total) || 0
              });
            }
          }
        } else if (collection === 'dynamicTables') {
          await supabase.from('dynamic_tables').upsert(mapDynamicTableToDb(newItem));
        }
      } catch (err) {
        console.error(`Supabase create error for ${collection}:`, err.message);
      }
    }

    // Also update local cache
    const data = readDb();
    if (!data[collection]) data[collection] = [];
    data[collection].unshift(newItem);
    writeDb(data);

    return newItem;
  },

  update: async (collection, id, partialData) => {
    const existing = await db.getById(collection, id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...partialData,
      updatedAt: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        if (collection === 'users') {
          await supabase.from('users').update(mapUserToDb(updated)).eq('id', id);
        } else if (collection === 'customers') {
          await supabase.from('customers').update(mapCustomerToDb(updated)).eq('id', id);
        } else if (collection === 'products') {
          await supabase.from('products').update(mapProductToDb(updated)).eq('id', id);
        } else if (collection === 'orders') {
          await supabase.from('orders').update(mapOrderToDb(updated)).eq('id', id);
        } else if (collection === 'dynamicTables') {
          await supabase.from('dynamic_tables').update(mapDynamicTableToDb(updated)).eq('id', id);
        }
      } catch (err) {
        console.error(`Supabase update error for ${collection}:`, err.message);
      }
    }

    // Also update local cache
    const data = readDb();
    const list = data[collection] || [];
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      list[index] = updated;
      data[collection] = list;
      writeDb(data);
    }

    return updated;
  },

  remove: async (collection, id) => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        if (collection === 'users') {
          await supabase.from('users').delete().eq('id', id);
        } else if (collection === 'customers') {
          await supabase.from('customers').delete().eq('id', id);
        } else if (collection === 'products') {
          await supabase.from('products').delete().eq('id', id);
        } else if (collection === 'orders') {
          await supabase.from('order_items').delete().eq('order_id', id);
          await supabase.from('orders').delete().eq('id', id);
        } else if (collection === 'dynamicTables') {
          await supabase.from('dynamic_tables').delete().eq('id', id);
        }
      } catch (err) {
        console.error(`Supabase remove error for ${collection}:`, err.message);
      }
    }

    // Also remove from local cache
    const data = readDb();
    const list = data[collection] || [];
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      data[collection] = list;
      writeDb(data);
    }

    return true;
  },

  adjustProductStock: async (productId, delta) => {
    const product = await db.getById('products', productId);
    if (!product) return null;

    const newStock = Math.max(0, (product.stock || 0) + delta);
    let newStatus = 'in_stock';
    if (newStock === 0) newStatus = 'out_of_stock';
    else if (newStock <= (product.minStock || 5)) newStatus = 'low_stock';

    const updated = await db.update('products', productId, {
      stock: newStock,
      status: newStatus
    });

    return updated;
  },

  addAuditLog: async (action, description, user) => {
    const log = {
      id: `log-${Date.now()}`,
      action,
      description,
      userId: user?.id || 'system',
      userName: user?.name || 'Hệ thống',
      timestamp: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert(mapAuditLogToDb(log));
      } catch (err) {
        console.error('Supabase addAuditLog error:', err.message);
      }
    }

    const data = readDb();
    if (!data.auditLogs) data.auditLogs = [];
    data.auditLogs.unshift(log);
    if (data.auditLogs.length > 300) {
      data.auditLogs = data.auditLogs.slice(0, 300);
    }
    writeDb(data);

    return log;
  }
};

module.exports = db;
