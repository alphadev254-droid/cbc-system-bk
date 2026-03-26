// @ts-nocheck
import { createError } from '../../middleware/errorHandler.middleware';
import { BillingCycle } from '../../config/constants';
import { addDays } from '../../utils/dateHelper';
import { sendEmail } from '../../services/email.service';
import * as repo from './subscription.repository';
import { Prisma } from '@prisma/client';

export const createTier = (data: Prisma.SubscriptionTierCreateInput) =>
  repo.createSubscriptionTier(data);

export const getTiers = () =>
  repo.findAllSubscriptionTiers();

export const updateTier = async (id: string, data: Prisma.SubscriptionTierUpdateInput) => {
  const tier = await repo.findSubscriptionTierById(id);
  if (!tier) throw createError('Tier not found', 404);
  return repo.updateSubscriptionTier(id, data);
};

export const assignTier = async (
  schoolId: string,
  tierId: string,
  billingCycle: BillingCycle,
  startDate: Date
) => {
  const tier = await repo.findSubscriptionTierById(tierId);
  if (!tier) throw createError('Tier not found', 404);

  const durationDays = billingCycle === BillingCycle.ANNUAL ? 365 : 30;
  const endDate      = addDays(startDate, durationDays);

  return repo.createSchoolSubscription({
    school:       { connect: { id: schoolId } },
    tier:         { connect: { id: tierId } },
    billingCycle,
    startDate,
    endDate,
    status:       'active',
  });
};

export const sendRenewalReminders = async () => {
  for (const days of [30, 14, 7]) {
    const targetDate = addDays(new Date(), days);
    const subs       = await repo.findSubscriptionsExpiringSoon(targetDate);

    for (const sub of subs) {
      await sendEmail(
        `admin@${sub.school.name.toLowerCase().replace(/\s/g, '')}.school`,
        'subscription-renewal',
        { schoolName: sub.school.name, daysLeft: days },
        `Subscription Expiring in ${days} Days`
      );
    }
  }
};
