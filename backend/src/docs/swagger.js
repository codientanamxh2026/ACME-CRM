const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ACME CRM & Inventory Enterprise RESTful API',
    version: '1.0.0',
    description: 'Tài liệu chi tiết các RESTful API của hệ thống ACME CRM (Bán hàng, Khách hàng, Quản lý kho, Phân quyền RBAC, File Upload/Export).'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development API Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Kiểm tra trạng thái máy chủ Backend',
        responses: {
          200: { description: 'Server hoạt động bình thường' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Đăng nhập người dùng',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@crm.local' },
                  password: { type: 'string', example: 'Admin@123456' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Đăng nhập thành công và trả về JWT Token' },
          401: { description: 'Sai thông tin đăng nhập' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Lấy thông tin tài khoản hiện tại từ Token',
        responses: {
          200: { description: 'Hồ sơ người dùng' },
          401: { description: 'Chưa đăng nhập' }
        }
      }
    },
    '/customers': {
      get: {
        summary: 'Lấy danh sách khách hàng & leads',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm kiếm theo tên, mã KH, SĐT' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Lọc trạng thái lead, won, v.v.' }
        ],
        responses: {
          200: { description: 'Danh sách khách hàng' }
        }
      },
      post: {
        summary: 'Tạo mới khách hàng (Quyền: Admin, Manager, Staff)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone'],
                properties: {
                  name: { type: 'string', example: 'Công ty TNHH Cơ Khí An Phát' },
                  phone: { type: 'string', example: '0987654321' },
                  contactPerson: { type: 'string', example: 'Vũ Minh Tuấn' },
                  email: { type: 'string', example: 'tuan@anphat.vn' },
                  address: { type: 'string', example: 'Số 45, Đường 3/2, Quận 10' },
                  status: { type: 'string', example: 'lead' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Tạo khách hàng thành công' }
        }
      }
    },
    '/products': {
      get: {
        summary: 'Danh mục sản phẩm kho hàng',
        parameters: [
          { name: 'low_stock', in: 'query', schema: { type: 'string' }, description: 'Lọc mặt hàng sắp hết' }
        ],
        responses: {
          200: { description: 'Danh sách sản phẩm' }
        }
      },
      post: {
        summary: 'Thêm sản phẩm mới vào kho (Quyền: Admin, Inventory)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'name'],
                properties: {
                  sku: { type: 'string', example: 'SP-PRN-99' },
                  name: { type: 'string', example: 'Máy in tem mã vạch công nghiệp' },
                  unit: { type: 'string', example: 'Bộ' },
                  costPrice: { type: 'number', example: 3500000 },
                  salePrice: { type: 'number', example: 5200000 },
                  stock: { type: 'number', example: 20 },
                  minStock: { type: 'number', example: 5 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Tạo sản phẩm thành công' }
        }
      }
    },
    '/orders': {
      get: {
        summary: 'Lấy danh sách đơn hàng',
        responses: {
          200: { description: 'Danh sách đơn hàng' }
        }
      },
      post: {
        summary: 'Tạo đơn hàng mới (Tự động trừ tồn kho)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerId', 'items'],
                properties: {
                  customerId: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'number', example: 2 },
                        price: { type: 'number', example: 6500000 }
                      }
                    }
                  },
                  discount: { type: 'number', example: 200000 },
                  paymentMethod: { type: 'string', example: 'bank_transfer' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Đơn hàng tạo thành công' }
        }
      }
    },
    '/files/upload': {
      post: {
        summary: 'Upload file Excel / CSV thật lên máy chủ và tự động sinh bảng dữ liệu',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File .xlsx, .xls hoặc .csv'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Phân tích file thành công và trả về danh sách cột & dòng' }
        }
      }
    },
    '/files/export/{entity}': {
      get: {
        summary: 'Xuất dữ liệu hệ thống ra file Excel (.xlsx) tải về trực tiếp',
        parameters: [
          { name: 'entity', in: 'path', required: true, schema: { type: 'string', enum: ['customers', 'products', 'orders'] } }
        ],
        responses: {
          200: { description: 'File Excel dạng binary stream' }
        }
      }
    },
    '/stats/dashboard': {
      get: {
        summary: 'Lấy toàn bộ số liệu thống kê KPI và biểu đồ',
        responses: {
          200: { description: 'KPI cards, biểu đồ 6 tháng, tỷ lệ trạng thái đơn' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
