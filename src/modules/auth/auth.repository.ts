import { User, RefreshToken } from '../../models';
import { UserAttributes } from '../../models/User.model';

export const findUserByEmail = (email: string) =>
  User.findOne({ where: { email, isActive: true } });

export const findUserById = (id: string) =>
  User.findByPk(id);

export const findUserByResetToken = (token: string) =>
  User.findOne({ where: { passwordResetToken: token } });

export const createUser = (data: Partial<UserAttributes>) =>
  User.create(data as UserAttributes);

export const updateUserById = (id: string, data: Partial<UserAttributes>) =>
  User.update(data, { where: { id } });

export const saveRefreshToken = (userId: string, token: string, expiresAt: Date) =>
  RefreshToken.create({ userId, token, expiresAt });

export const findRefreshTokenByValue = (token: string) =>
  RefreshToken.findOne({ where: { token, isRevoked: false } });

export const revokeRefreshTokenByValue = (token: string) =>
  RefreshToken.update({ isRevoked: true }, { where: { token } });

export const revokeAllTokensByUserId = (userId: string) =>
  RefreshToken.update({ isRevoked: true }, { where: { userId } });
