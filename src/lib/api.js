// Universal Client-side API fetch wrapper pointing to independent Backend API server

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;

  // Resolve target URL
  let targetUrl = endpoint;
  let cleanPath = endpoint;
  const isHttp = endpoint.startsWith('http');

  if (!isHttp) {
    cleanPath = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    targetUrl = `${API_BASE}${cleanPath}`;
  }

  const headers = { ...(options.headers || {}) };

  // If body is NOT FormData, set application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const handleUnauthorized = () => {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.dispatchEvent(new CustomEvent('crm:unauthorized'));
    }
  };

  const safeParseResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return { success: false, error: 'Dữ liệu trả về không đúng định dạng JSON' };
      }
    }

    try {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return {
          success: response.ok,
          error: response.ok ? null : text || `Lỗi máy chủ (${response.status})`,
          message: response.ok ? text : null
        };
      }
    } catch (readErr) {
      return { success: false, error: readErr.message || 'Không thể đọc phản hồi từ máy chủ' };
    }
  };

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers
    });

    if (res.status === 401) {
      handleUnauthorized();
    }

    const data = await safeParseResponse(res);
    return data;
  } catch (err) {
    // If targetUrl was external (e.g. port 5000) and failed due to network error,
    // fallback automatically to internal Next.js /api route!
    if (!isHttp && targetUrl.startsWith('http://localhost:5000')) {
      try {
        const localUrl = `/api${cleanPath}`;
        const localRes = await fetch(localUrl, {
          ...options,
          headers
        });

        if (localRes.status === 401) {
          handleUnauthorized();
        }

        const localData = await safeParseResponse(localRes);
        return localData;
      } catch (localErr) {
        console.error(`Fallback error on /api${cleanPath}:`, localErr);
      }
    }

    console.error(`API Error on ${targetUrl}:`, err);
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến máy chủ API'
    };
  }
}

export { API_BASE };
