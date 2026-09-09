function errorHandler(err, req, res, next) {
  console.error('API Server Error:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Lỗi xử lý yêu cầu trên máy chủ',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = {
  errorHandler
};
