import fs from 'fs';
import path from 'path';
import { INITIAL_DATA } from './initialData.js';
import {
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
} from './supabase.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');

// Ensure data folder and file exist
function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing store:', err);
  }
}

// Read database
export function readDb() {
  initStore();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, falling back to memory seed:', err);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

// Write database
export function writeDb(data) {
  initStore();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// General CRUD helpers connected to Supabase
export async function getAll(collection) {
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

  const db = readDb();
  return db[collection] || [];
}

export async function getById(collection, id) {
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

        // Fallback: check if id is a custom slug
        const all = await getAll('dynamicTables');
        const match = all.find((t) => t.id === id || t.slug === id);
        if (match) return match;
      }
    } catch (err) {
      console.warn(`Supabase getById(${collection}, ${id}) fallback to local store:`, err.message);
    }
  }

  const list = await getAll(collection);
  return list.find((item) => item.id === id) || null;
}

export async function create(collection, item) {
  const newItem = {
    id: item.id || `${collection.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...item,
    createdAt: item.createdAt || new Date().toISOString()
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      if (collection === 'users') {
        await supabase.from('users').insert(mapUserToDb(newItem));
      } else if (collection === 'customers') {
        await supabase.from('customers').insert(mapCustomerToDb(newItem));
      } else if (collection === 'products') {
        await supabase.from('products').insert(mapProductToDb(newItem));
      } else if (collection === 'orders') {
        await supabase.from('orders').insert(mapOrderToDb(newItem));
        if (Array.isArray(newItem.items) && newItem.items.length > 0) {
          const rows = newItem.items.map((i) => ({
            id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            order_id: newItem.id,
            product_id: i.productId || null,
            sku: i.sku || '',
            name: i.name || '',
            price: Number(i.price) || 0,
            quantity: Number(i.quantity) || 1,
            total: Number(i.total) || 0
          }));
          await supabase.from('order_items').insert(rows);
        }
      } else if (collection === 'dynamicTables') {
        await supabase.from('dynamic_tables').insert(mapDynamicTableToDb(newItem));
      } else if (collection === 'auditLogs') {
        await supabase.from('audit_logs').insert(mapAuditLogToDb(newItem));
      }
    } catch (err) {
      console.warn(`Supabase create(${collection}) fallback to local sync:`, err.message);
    }
  }

  const db = readDb();
  if (!db[collection]) db[collection] = [];
  db[collection].unshift(newItem);
  writeDb(db);
  return newItem;
}

export async function update(collection, id, partialData) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      if (collection === 'users') {
        await supabase.from('users').update(mapUserToDb(partialData)).eq('id', id);
      } else if (collection === 'customers') {
        await supabase.from('customers').update(mapCustomerToDb(partialData)).eq('id', id);
      } else if (collection === 'products') {
        await supabase.from('products').update(mapProductToDb(partialData)).eq('id', id);
      } else if (collection === 'orders') {
        await supabase.from('orders').update(mapOrderToDb(partialData)).eq('id', id);
        if (Array.isArray(partialData.items)) {
          await supabase.from('order_items').delete().eq('order_id', id);
          if (partialData.items.length > 0) {
            const rows = partialData.items.map((i) => ({
              id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              order_id: id,
              product_id: i.productId || null,
              sku: i.sku || '',
              name: i.name || '',
              price: Number(i.price) || 0,
              quantity: Number(i.quantity) || 1,
              total: Number(i.total) || 0
            }));
            await supabase.from('order_items').insert(rows);
          }
        }
      } else if (collection === 'dynamicTables') {
        const payload = mapDynamicTableToDb(partialData);
        const { error } = await supabase.from('dynamic_tables').update(payload).eq('id', id);
        if (error) {
          console.error('Error updating dynamic_tables in Supabase:', error);
        }
      }
    } catch (err) {
      console.warn(`Supabase update(${collection}, ${id}) fallback to local store:`, err.message);
    }
  }

  const db = readDb();
  const list = db[collection] || [];
  const index = list.findIndex((item) => item.id === id);

  if (index === -1) {
    // If found via Supabase, fetch fresh and cache locally
    if (supabase) {
      const fresh = await getById(collection, id);
      if (fresh) {
        if (!db[collection]) db[collection] = [];
        db[collection].push(fresh);
        writeDb(db);
        return fresh;
      }
    }
    return null;
  }

  const updatedItem = {
    ...list[index],
    ...partialData,
    updatedAt: new Date().toISOString()
  };

  list[index] = updatedItem;
  db[collection] = list;
  writeDb(db);
  return updatedItem;
}

export async function remove(collection, id) {
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
      console.warn(`Supabase remove(${collection}, ${id}) fallback:`, err.message);
    }
  }

  const db = readDb();
  const list = db[collection] || [];
  const index = list.findIndex((item) => item.id === id);

  if (index !== -1) {
    list.splice(index, 1);
    db[collection] = list;
    writeDb(db);
  }
  return true;
}

// Stock Adjustment helper
export async function adjustProductStock(productId, delta) {
  const product = await getById('products', productId);
  if (!product) return null;

  const newStock = Math.max(0, (product.stock || 0) + delta);
  let newStatus = 'in_stock';
  if (newStock === 0) {
    newStatus = 'out_of_stock';
  } else if (newStock <= (product.minStock || 5)) {
    newStatus = 'low_stock';
  }

  return await update('products', productId, {
    stock: newStock,
    status: newStatus
  });
}

// Audit log helper
export async function addAuditLog(action, description, user) {
  const log = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    description,
    userId: user?.id || 'system',
    userName: user?.name || 'Hệ thống',
    timestamp: new Date().toISOString()
  };

  await create('auditLogs', log);
  return log;
}
