import type { FC } from 'react';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useFormContext } from '@/hooks/use-form-context';
import { useIsMobile } from '@/hooks/use-mobile';

interface ISubmitAndResetButtons {
  submitLabel: string;
  resetLabel: string;
}

const SubmitAndResetButtons: FC<ISubmitAndResetButtons> = ({
  submitLabel,
  resetLabel,
}) => {
  const form = useFormContext();
  const isMobile = useIsMobile();
  return (
    <form.Subscribe
      selector={(state) => [
        state.canSubmit,
        state.isDirty,
        state.isSubmitSuccessful,
      ]}
      children={([canSubmit, isDirty, isSubmitSuccessful]) => (
        <Field orientation={isMobile ? 'vertical' : 'horizontal'}>
          <Button onClick={form.handleSubmit} disabled={!canSubmit || !isDirty}>
            {submitLabel}
          </Button>
          {isDirty && !isSubmitSuccessful && (
            <Button variant="outline" onClick={() => form.reset()}>
              {resetLabel}
            </Button>
          )}
        </Field>
      )}
    />
  );
};

export default SubmitAndResetButtons;
