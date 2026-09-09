const db = require('../config/db');

async function getDynamicTables() {
  return await db.getAll('dynamicTables');
}

async function getDynamicTableById(id) {
  const table = await db.getById('dynamicTables', id);
  if (!table) throw new Error('Không tìm thấy bảng dữ liệu');
  return table;
}

async function saveDynamicTable(data, user) {
  if (!data.title || !data.rows || !data.columns) {
    throw new Error('Thiếu tiêu đề, danh sách cột hoặc dòng dữ liệu');
  }

  const newTable = await db.create('dynamicTables', {
    title: data.title.trim(),
    sourceFileName: data.sourceFileName || 'import.xlsx',
    storedFilePath: data.storedFilePath || null,
    importedAt: new Date().toISOString(),
    importedBy: user?.name || 'Hệ thống',
    rowCount: data.rows.length,
    columns: data.columns,
    rows: data.rows
  });

  await db.addAuditLog('IMPORT_DYNAMIC_TABLE', `Lưu bảng dữ liệu động "${newTable.title}" (${data.rows.length} dòng)`, user);
  return newTable;
}

async function deleteDynamicTable(id, user) {
  const existing = await db.getById('dynamicTables', id);
  if (!existing) throw new Error('Không tìm thấy bảng dữ liệu');

  await db.remove('dynamicTables', id);
  await db.addAuditLog('DELETE_DYNAMIC_TABLE', `Xóa bảng dữ liệu động "${existing.title}"`, user);
  return true;
}

module.exports = {
  getDynamicTables,
  getDynamicTableById,
  saveDynamicTable,
  deleteDynamicTable
};
