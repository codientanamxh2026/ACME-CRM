const excelService = require('../services/excelService');

async function uploadSpreadsheet(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy file tải lên' });
    }

    const parsed = excelService.parseUploadedFile(req.file.path, req.file.originalname);
    res.json({
      success: true,
      message: 'Phân tích file thành công',
      data: parsed
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function exportEntity(req, res, next) {
  try {
    const { entity } = req.params;
    if (!['customers', 'products', 'orders'].includes(entity)) {
      return res.status(400).json({ success: false, error: 'Đối tượng xuất file không hợp lệ' });
    }

    const buffer = excelService.exportCollectionToBuffer(entity);
    const fileName = `xuat-${entity}-${Date.now()}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadSpreadsheet,
  exportEntity
};
