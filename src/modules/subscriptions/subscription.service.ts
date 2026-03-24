import { createError } from '../../middleware/errorHandler.middleware';
import { BillingCycle, SubscriptionStatus } from '../../config/constants';
import { addDays } from '../../utils/dateHelper';
import { sendEmail } from '../../services/email.service';
import * as repo from './subscription.repository';
import { SubscriptionTierAttributes } from '../../models/SubscriptionTier.model';

export const createTier = (data: Partial<SubscriptionTierAttributes>) =>
  repo.createSubscriptionTier(data);

export const getTiers = () =>
  repo.findAllSubscriptionTiers();

export const updateTier = async (id: string, data: Partial<SubscriptionTierAttributes>) => {
  const tier = await repo.findSubscriptionTierById(id);
  if (!tier) throw createError('Tier not found', 404);
  const [, [updated]] = await repo.updateSubscriptionTier(id, data);
  return updated;
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
  const endDate = addDays(startDate, durationDays);

  return repo.createSchoolSubscription({
    schoolId,
    tierId,
    billingCycle,
    startDate,
    endDate,
    status: SubscriptionStatus.ACTIVE,
  });
};

export const sendRenewalReminders = async () => {
  for (const days of [30, 14, 7]) {
    const subs = await repo.findSubscriptionsExpiringSoon(days);
    for (const sub of subs) {
      const school = (sub as unknown as { school: { name: string } }).school;
      await sendEmail(
        `admin@${school.name.toLowerCase().replace(/\s/g, '')}.school`,
        'subscription-renewal',
        { schoolName: school.name, daysLeft: days },
        `Subscription Expiring in ${days} Days`
      );
    }
  }
};
