import { FindAndCountOptions } from 'sequelize';

export interface PaginationResult<T> {
  rows: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export const paginate = (page = 1, limit = 10): Pick<FindAndCountOptions, 'limit' | 'offset'> => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

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
