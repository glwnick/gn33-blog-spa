import type { ReactNode } from 'react';
import { ProfileIdentityCard } from '@/components/profile-identity-card';
import { ProfileTabs } from '@/components/profile-tabs';

/**
 * The chrome shared by `/profile`, `/profile/security` and `/profile/privacy`: a sticky identity card on the
 * left and a tab row above whichever page's own content is passed in as `children`.
 */
export function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <ProfileIdentityCard />
      </div>
      <div className="flex flex-col gap-6">
        <ProfileTabs />
        {children}
      </div>
    </div>
  );
}
