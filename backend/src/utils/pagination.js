/**
 * Helper to paginate array data in Express controllers/services
 * @param {Array} list - The filtered array of items
 * @param {Object} query - The query params { page, limit, pageSize, all }
 * @returns {Object} Object with paginated data and pagination metadata
 */
function paginate(list = [], query = {}) {
  const total = list.length;
  const isAll = query.all === 'true' || query.all === true;

  if (isAll || (!query.page && !query.limit && !query.pageSize)) {
    return {
      data: list,
      total,
      pagination: {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(200, parseInt(query.limit || query.pageSize, 10) || 10));
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginatedData = list.slice(offset, offset + limit);

  return {
    data: paginatedData,
    total,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

module.exports = { paginate };
