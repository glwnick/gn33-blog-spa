import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type StatCardProps = {
  readonly title: string;
  readonly value: number | string | undefined;
  readonly icon: ReactNode;
  readonly isPending?: boolean;
};

export const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon,
  isPending,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <span className="text-muted-foreground">{icon}</span>
    </CardHeader>
    <CardContent>
      {isPending ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className="text-2xl font-bold">{value ?? '—'}</p>
      )}
    </CardContent>
  </Card>
);
