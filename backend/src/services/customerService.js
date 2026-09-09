const db = require('../config/db');
const { paginate } = require('../utils/pagination');

async function getCustomers(query = {}, user) {
  let list = await db.getAll('customers');

  const { search, status, my_only } = query;

  if (user && user.role === 'staff' && my_only === 'true') {
    list = list.filter((c) => c.assignedStaffId === user.id);
  }

  if (status) {
    list = list.filter((c) => c.status === status);
  }

  if (search) {
    const term = search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.code && c.code.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(term))
    );
  }

  return paginate(list, query);
}

async function getCustomerById(id) {
  const customer = await db.getById('customers', id);
  if (!customer) throw new Error('Không tìm thấy khách hàng');
  return customer;
}

async function createCustomer(data, user) {
  if (!data.name || !data.phone) {
    throw new Error('Tên khách hàng và số điện thoại là bắt buộc');
  }

  const customers = await db.getAll('customers');
  const autoCode = `KH-${String(customers.length + 1).padStart(3, '0')}`;

  const newCustomer = await db.create('customers', {
    code: data.code || autoCode,
    name: data.name.trim(),
    contactPerson: data.contactPerson ? data.contactPerson.trim() : '',
    phone: data.phone.trim(),
    email: data.email ? data.email.trim() : '',
    address: data.address ? data.address.trim() : '',
    status: data.status || 'lead',
    group: data.group || 'Doanh nghiệp',
    revenue: Number(data.revenue) || 0,
    assignedStaffId: data.assignedStaffId || user?.id,
    assignedStaffName: data.assignedStaffName || user?.name,
    notes: data.notes ? data.notes.trim() : ''
  });

  await db.addAuditLog('CREATE_CUSTOMER', `Tạo mới khách hàng ${newCustomer.name} (${newCustomer.code})`, user);
  return newCustomer;
}

async function updateCustomer(id, data, user) {
  const existing = await db.getById('customers', id);
  if (!existing) throw new Error('Không tìm thấy khách hàng để cập nhật');

  const updated = await db.update('customers', id, {
    name: data.name !== undefined ? data.name.trim() : existing.name,
    contactPerson: data.contactPerson !== undefined ? data.contactPerson.trim() : existing.contactPerson,
    phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
    email: data.email !== undefined ? data.email.trim() : existing.email,
    address: data.address !== undefined ? data.address.trim() : existing.address,
    status: data.status !== undefined ? data.status : existing.status,
    group: data.group !== undefined ? data.group : existing.group,
    revenue: data.revenue !== undefined ? Number(data.revenue) : existing.revenue,
    assignedStaffId: data.assignedStaffId !== undefined ? data.assignedStaffId : existing.assignedStaffId,
    assignedStaffName: data.assignedStaffName !== undefined ? data.assignedStaffName : existing.assignedStaffName,
    notes: data.notes !== undefined ? data.notes.trim() : existing.notes
  });

  await db.addAuditLog('UPDATE_CUSTOMER', `Cập nhật thông tin khách hàng ${updated.name}`, user);
  return updated;
}

async function deleteCustomer(id, user) {
  const existing = await db.getById('customers', id);
  if (!existing) throw new Error('Không tìm thấy khách hàng');

  await db.remove('customers', id);
  await db.addAuditLog('DELETE_CUSTOMER', `Xóa khách hàng ${existing.name} (${existing.code})`, user);
  return true;
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
