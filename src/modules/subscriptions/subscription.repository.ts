import { SubscriptionTier, Subscription } from '../../models';
import { SubscriptionTierAttributes } from '../../models/SubscriptionTier.model';
import { SubscriptionAttributes } from '../../models/Subscription.model';
import { SubscriptionStatus } from '../../config/constants';
import { Op } from 'sequelize';

export const createSubscriptionTier = (data: Partial<SubscriptionTierAttributes>) =>
  SubscriptionTier.create(data as SubscriptionTierAttributes);

export const findAllSubscriptionTiers = () =>
  SubscriptionTier.findAll({ order: [['monthlyPrice', 'ASC']] });

export const findSubscriptionTierById = (id: string) =>
  SubscriptionTier.findByPk(id);

export const updateSubscriptionTier = (id: string, data: Partial<SubscriptionTierAttributes>) =>
  SubscriptionTier.update(data, { where: { id }, returning: true });

export const createSchoolSubscription = (data: Partial<SubscriptionAttributes>) =>
  Subscription.create(data as SubscriptionAttributes);

export const findActiveSubscriptionBySchool = (schoolId: string) =>
  Subscription.findOne({
    where: { schoolId, status: SubscriptionStatus.ACTIVE },
    include: [{ association: 'tier' }],
  });

export const findSubscriptionsExpiringSoon = (days: number) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  return Subscription.findAll({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: { [Op.lte]: targetDate },
    },
    include: [{ association: 'school' }, { association: 'tier' }],
  });
};

export const updateSubscriptionStatusById = (id: string, status: SubscriptionStatus) =>
  Subscription.update({ status }, { where: { id } });
