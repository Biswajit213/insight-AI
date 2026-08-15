export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const extractPaginationParams = (query: Record<string, unknown>): PaginationParams => {
  let page = parseInt(String(query.page || '1'), 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = parseInt(String(query.limit || '20'), 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;
  const sort = typeof query.sort === 'string' ? query.sort : 'created_at';
  const order = String(query.order).toLowerCase() === 'asc' ? 'asc' : 'desc';
  const search = typeof query.search === 'string' && query.search.trim().length > 0 ? query.search.trim() : undefined;

  return { page, limit, offset, sort, order, search };
};

export const buildPaginatedMeta = (page: number, limit: number, total: number): PaginatedMeta => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
  };
};
