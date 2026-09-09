// Smart AI Agent & Heuristic Schema Analyzer for CRM Acme

/**
 * Common synonyms dictionary for automatic column mapping
 */
export const TARGET_COLLECTIONS = {
  customers: {
    id: 'customers',
    name: 'Khách hàng (CRM Leads & Khách quen)',
    endpoint: '/api/customers',
    fields: [
      { key: 'name', label: 'Tên khách hàng / Doanh nghiệp', required: true, synonyms: ['ten', 'ho va ten', 'ten khach hang', 'khach hang', 'doanh nghiep', 'ten cong ty', 'company', 'client', 'customer'] },
      { key: 'phone', label: 'Số điện thoại', required: true, synonyms: ['sdt', 'so dien thoai', 'dien thoai', 'phone', 'telephone', 'mobile', 'hotline', 'contact number'] },
      { key: 'email', label: 'Email liên hệ', required: false, synonyms: ['email', 'thu dien tu', 'e-mail', 'mail'] },
      { key: 'contactPerson', label: 'Người đại diện / Liên hệ', required: false, synonyms: ['nguoi dai dien', 'nguoi lien he', 'dai dien', 'contact', 'contact person'] },
      { key: 'address', label: 'Địa chỉ', required: false, synonyms: ['dia chi', 'noi o', 'dia diem', 'address', 'location', 'tinh thanh', 'quan huyen'] },
      { key: 'group', label: 'Nhóm khách hàng', required: false, synonyms: ['nhom', 'nhom khach hang', 'phan loai', 'group', 'tier', 'phan khuc'] },
      { key: 'revenue', label: 'Doanh thu tích lũy (VNĐ)', required: false, synonyms: ['doanh thu', 'tong chi tieu', 'doanh so', 'revenue', 'spending', 'tien hang'] },
      { key: 'notes', label: 'Ghi chú & Nhu cầu', required: false, synonyms: ['ghi chu', 'notes', 'nhu cau', 'mo ta', 'description', 'remark'] }
    ]
  },
  products: {
    id: 'products',
    name: 'Kho hàng (Sản phẩm & Tồn kho)',
    endpoint: '/api/products',
    fields: [
      { key: 'sku', label: 'Mã SKU / Mã sản phẩm', required: true, synonyms: ['sku', 'ma sku', 'ma san pham', 'ma hang', 'product code', 'item code', 'code'] },
      { key: 'name', label: 'Tên sản phẩm', required: true, synonyms: ['ten', 'ten san pham', 'ten hang hoa', 'san pham', 'product name', 'item name', 'name'] },
      { key: 'category', label: 'Danh mục sản phẩm', required: false, synonyms: ['danh muc', 'loai san pham', 'loai hang', 'category', 'group'] },
      { key: 'unit', label: 'Đơn vị tính', required: false, synonyms: ['don vi tinh', 'dvt', 'don vi', 'unit'] },
      { key: 'costPrice', label: 'Giá vốn nhập hàng', required: false, synonyms: ['gia von', 'gia nhap', 'cost', 'cost price', 'import price'] },
      { key: 'salePrice', label: 'Giá bán niêm yết', required: false, synonyms: ['gia ban', 'don gia', 'price', 'sale price', 'retail price'] },
      { key: 'stock', label: 'Số lượng tồn kho', required: false, synonyms: ['ton kho', 'so luong ton', 'ton', 'so luong', 'stock', 'quantity', 'qty'] },
      { key: 'minStock', label: 'Ngưỡng cảnh báo tối thiểu', required: false, synonyms: ['dinh muc', 'ton toi thieu', 'canh bao ton', 'min stock', 'threshold'] },
      { key: 'description', label: 'Mô tả thông số kỹ thuật', required: false, synonyms: ['mo ta', 'thong so', 'ghi chu', 'description', 'specs'] }
    ]
  }
};

/**
 * Remove Vietnamese accents and lower-case string for matching
 */
function normalizeStr(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

/**
 * Automatically map source columns to target collection fields
 */
export function autoSuggestFieldMapping(sourceColumns = [], targetCollectionKey = 'customers') {
  const collection = TARGET_COLLECTIONS[targetCollectionKey];
  if (!collection) return {};

  const mapping = {};

  collection.fields.forEach((field) => {
    let bestMatch = '';
    let highestScore = 0;

    sourceColumns.forEach((sourceCol) => {
      const normSource = normalizeStr(sourceCol.label || sourceCol.key);

      // Exact match
      if (normSource === normalizeStr(field.key) || normSource === normalizeStr(field.label)) {
        bestMatch = sourceCol.key;
        highestScore = 100;
        return;
      }

      // Synonym match
      field.synonyms.forEach((syn) => {
        const normSyn = normalizeStr(syn);
        if (normSource === normSyn && highestScore < 90) {
          bestMatch = sourceCol.key;
          highestScore = 90;
        } else if ((normSource.includes(normSyn) || normSyn.includes(normSource)) && highestScore < 60) {
          bestMatch = sourceCol.key;
          highestScore = 60;
        }
      });
    });

    if (bestMatch) {
      mapping[field.key] = bestMatch;
    }
  });

  return mapping;
}

/**
 * Smart heuristic schema inferrer
 */
export function inferSmartColumnTypes(columns = [], sampleRows = []) {
  return columns.map((col) => {
    let detectedType = 'text';
    const values = sampleRows.map((r) => r[col.key]).filter((v) => v !== undefined && v !== null && v !== '');

    if (values.length > 0) {
      let isAllNumbers = true;
      let isCurrency = false;
      let isPhone = false;
      let isEmail = false;
      let isDate = false;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(0|\+84)[0-9]{8,11}$/;
      const currencyKeywords = ['vnd', 'đ', 'dong', 'tien', 'gia', 'doanh thu', 'chi phi', 'price', 'amount', 'cost', 'revenue', 'total'];
      const normColLabel = normalizeStr(col.label || col.key);

      if (currencyKeywords.some((k) => normColLabel.includes(k))) {
        isCurrency = true;
      }

      values.slice(0, 10).forEach((val) => {
        const str = String(val).trim();
        const cleanNumber = str.replace(/[.,\sđVN]/g, '');

        if (isNaN(Number(cleanNumber))) {
          isAllNumbers = false;
        }

        if (emailRegex.test(str)) {
          isEmail = true;
        }

        const cleanPhone = str.replace(/[\s.-]/g, '');
        if (phoneRegex.test(cleanPhone)) {
          isPhone = true;
        }

        if (!isNaN(Date.parse(str)) && str.length >= 8 && (str.includes('/') || str.includes('-'))) {
          isDate = true;
        }
      });

      if (isEmail) detectedType = 'email';
      else if (isPhone) detectedType = 'phone';
      else if (isCurrency && isAllNumbers) detectedType = 'currency';
      else if (isDate) detectedType = 'date';
      else if (isAllNumbers) detectedType = 'number';
    }

    return {
      ...col,
      type: detectedType
    };
  });
}

/**
 * AI Insight Generator
 * Uses Gemini API if provided, or built-in intelligent statistical summary
 */
export async function generateAIInsights(tableTitle, columns = [], rows = [], apiKey = null) {
  // Built-in intelligent analytics
  const summary = {
    title: tableTitle,
    totalRows: rows.length,
    totalColumns: columns.length,
    numericColumns: columns.filter((c) => c.type === 'number' || c.type === 'currency').map((c) => c.label),
    highlightStats: []
  };

  columns.forEach((col) => {
    if (col.type === 'currency' || col.type === 'number') {
      const sum = rows.reduce((acc, r) => acc + (Number(r[col.key]) || 0), 0);
      const avg = rows.length ? Math.round(sum / rows.length) : 0;
      summary.highlightStats.push({
        column: col.label,
        type: col.type,
        sum,
        avg
      });
    }
  });

  // If user provided a Gemini API Key, enhance with deep LLM analysis
  const effectiveKey = apiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null);

  if (effectiveKey) {
    try {
      const sample = rows.slice(0, 8);
      const prompt = `Phân tích tập dữ liệu "${tableTitle}". Các cột: ${columns.map((c) => c.label).join(', ')}. Dữ liệu mẫu: ${JSON.stringify(sample)}. Hãy tóm tắt ý nghĩa của tập dữ liệu này trong 2 câu ngắn gọn và gợi ý 2 hành động quản trị CRM phù hợp. Trả lời bằng tiếng Việt.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          summary.aiInsight = aiText.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini API analysis skipped:', err.message);
    }
  }

  return summary;
}
