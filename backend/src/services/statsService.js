const db = require('../config/db');

async function getDashboardStats() {
  const orders = await db.getAll('orders');
  const customers = await db.getAll('customers');
  const products = await db.getAll('products');

  let totalRevenue = 0;
  orders.forEach((o) => {
    if (o.status !== 'cancelled') {
      totalRevenue += Number(o.totalAmount || 0);
    }
  });

  const lowStockProducts = products.filter(
    (p) => (p.stock || 0) <= (p.minStock || 5)
  );

  const ordersByStatus = {
    pending: 0,
    confirmed: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0
  };

  orders.forEach((o) => {
    if (ordersByStatus[o.status] !== undefined) {
      ordersByStatus[o.status]++;
    }
  });

  const monthlyRevenue = [
    { month: 'T10/25', revenue: 45000000 },
    { month: 'T11/25', revenue: 58000000 },
    { month: 'T12/25', revenue: 72000000 },
    { month: 'T1/26', revenue: 64000000 },
    { month: 'T2/26', revenue: 89000000 },
    { month: 'T3/26', revenue: totalRevenue > 0 ? totalRevenue : 68000000 }
  ];

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalCustomers: customers.length,
    lowStockCount: lowStockProducts.length,
    monthlyRevenue,
    ordersByStatus,
    recentOrders,
    lowStockProducts
  };
}

module.exports = {
  getDashboardStats
};
