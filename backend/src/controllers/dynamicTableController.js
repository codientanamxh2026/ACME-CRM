const dynamicTableService = require('../services/dynamicTableService');

async function getDynamicTables(req, res, next) {
  try {
    const list = await dynamicTableService.getDynamicTables();
    res.json({ success: true, data: list, total: list.length });
  } catch (err) {
    next(err);
  }
}

async function getDynamicTableById(req, res, next) {
  try {
    const table = await dynamicTableService.getDynamicTableById(req.params.id);
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
}

async function saveDynamicTable(req, res, next) {
  try {
    const table = await dynamicTableService.saveDynamicTable(req.body, req.user);
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function deleteDynamicTable(req, res, next) {
  try {
    await dynamicTableService.deleteDynamicTable(req.params.id, req.user);
    res.json({ success: true, message: 'Đã xóa bảng dữ liệu động thành công' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDynamicTables,
  getDynamicTableById,
  saveDynamicTable,
  deleteDynamicTable
};
