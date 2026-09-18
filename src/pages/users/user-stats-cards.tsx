import { useQuery } from '@tanstack/react-query';
import { Ban, UserCheck, UserPlus, Users } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { userStatsOptions } from '@/query-options/user-options';
import { useTranslation } from '@/hooks/use-translation';

/** Slice 7's four Users-table stat cards. See `userStatsResponseSchema` for why two of the design handoff's
 * four cards (Pending verification, GDPR erase requests) were replaced with Active/Blocked accounts. */
export function UserStatsCards() {
  const { t } = useTranslation();
  const { data: stats, isPending } = useQuery(userStatsOptions());

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title={t('totalCustomers')}
        value={stats?.totalCustomers}
        icon={<Users size={18} />}
        isPending={isPending}
      />
      <StatCard
        title={t('newThisMonth')}
        value={stats?.newThisMonth}
        icon={<UserPlus size={18} />}
        isPending={isPending}
      />
      <StatCard
        title={t('activeAccounts')}
        value={stats?.activeAccounts}
        icon={<UserCheck size={18} />}
        isPending={isPending}
      />
      <StatCard
        title={t('blockedAccounts')}
        value={stats?.blockedAccounts}
        icon={<Ban size={18} />}
        isPending={isPending}
      />
    </div>
  );
}
