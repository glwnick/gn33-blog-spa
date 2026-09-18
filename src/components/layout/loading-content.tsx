import type { FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingContent: FC = () => {
  return (
    <div className="flex flex-col gap-4 p-1" aria-busy="true">
      <Skeleton className="h-7 w-44" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24 hidden sm:block" />
        <Skeleton className="h-24 hidden lg:block" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-40 max-w-2xl" />
    </div>
  );
};
