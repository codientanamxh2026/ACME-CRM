const productService = require('../services/productService');

async function getProducts(req, res, next) {
  try {
    const result = await productService.getProducts(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      total: result.total
    });
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
}

async function createProduct(req, res, next) {
  try {
    const newProduct = await productService.createProduct(req.body, req.user);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function updateProduct(req, res, next) {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function adjustStock(req, res, next) {
  try {
    const { delta, note } = req.body;
    if (delta === undefined || isNaN(Number(delta))) {
      return res.status(400).json({ success: false, error: 'Số lượng điều chỉnh delta là bắt buộc' });
    }
    const updated = await productService.adjustStock(req.params.id, Number(delta), note, req.user);
    res.json({ success: true, data: updated, message: 'Đã điều chỉnh số lượng kho thành công' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function deleteProduct(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id, req.user);
    res.json({ success: true, message: 'Đã xóa sản phẩm khỏi kho' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct
};
