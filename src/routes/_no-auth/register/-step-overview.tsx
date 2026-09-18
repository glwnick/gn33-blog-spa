import { STEP_NAME_KEYS, TOTAL_STEPS } from './-wizard-steps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type StepOverviewProps = {
  readonly currentStep: number;
};

// A vertical dot-and-line list, same visual language as the order-detail page's `OrderTimeline` (filled dot
// + connecting line for what's already done), extended with a third, distinct "current" state - the wizard
// itself is still in progress, unlike an order's status history which only ever has done/upcoming nodes.
export const StepOverview = ({ currentStep }: StepOverviewProps) => {
  const { t } = useTranslation();

  return (
    <Card className="w-full py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('registerStepOverviewTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col">
          {STEP_NAME_KEYS.map((nameKey, index) => {
            const stepNumber = index + 1;
            const done = stepNumber < currentStep;
            const current = stepNumber === currentStep;

            return (
              <div key={nameKey} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'size-3 shrink-0 rounded-full',
                      done || current ? 'bg-primary' : 'bg-muted',
                      current &&
                        'ring-2 ring-offset-2 ring-primary ring-offset-background',
                    )}
                  />
                  {stepNumber < TOTAL_STEPS && (
                    <span
                      className={cn(
                        'w-0.5 flex-1',
                        done ? 'bg-primary' : 'bg-muted',
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn('pb-4', stepNumber === TOTAL_STEPS && 'pb-0')}
                >
                  <span
                    className={cn(
                      'text-sm',
                      current ? 'font-semibold text-foreground' : 'font-medium',
                      !done && !current && 'text-muted-foreground',
                    )}
                  >
                    {t(nameKey)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
