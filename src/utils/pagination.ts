export interface PaginationResult<T> {
  rows: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export const paginate = (page = 1, limit = 10): { skip: number; take: number } => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const buildPaginationResult = <T>(
  rows: T[],
  count: number,
  page: number,
  limit: number
): PaginationResult<T> => ({
  rows,
  count,
  totalPages: Math.ceil(count / limit),
  currentPage: page,
  limit,
});
