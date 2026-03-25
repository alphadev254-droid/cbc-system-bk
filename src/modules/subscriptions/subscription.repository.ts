import {prisma} from '../../config/prisma';
import { Prisma, SubscriptionStatus } from '@prisma/client';

export const createSubscriptionTier = (data: Prisma.SubscriptionTierCreateInput) =>
  prisma.subscriptionTier.create({ data });

export const findAllSubscriptionTiers = () =>
  prisma.subscriptionTier.findMany({ orderBy: { monthlyPrice: 'asc' } });

export const findSubscriptionTierById = (id: string) =>
  prisma.subscriptionTier.findUnique({ where: { id } });

export const updateSubscriptionTier = (id: string, data: Prisma.SubscriptionTierUpdateInput) =>
  prisma.subscriptionTier.update({ where: { id }, data });

export const createSchoolSubscription = (data: Prisma.SubscriptionCreateInput) =>
  prisma.subscription.create({ data });

export const findActiveSubscriptionBySchool = (schoolId: string) =>
  prisma.subscription.findFirst({
    where:   { schoolId, status: 'active' },
    include: { tier: true },
  });

export const findSubscriptionsExpiringSoon = (targetDate: Date) =>
  prisma.subscription.findMany({
    where:   { status: 'active', endDate: { lte: targetDate } },
    include: { school: true, tier: true },
  });

export const updateSubscriptionStatusById = (id: string, status: SubscriptionStatus) =>
  prisma.subscription.update({ where: { id }, data: { status } });
