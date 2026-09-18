import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface TotpFieldProps {
  onComplete: (value: string) => void;
}

export const TotpField = ({ onComplete }: TotpFieldProps) => {
  return (
    <InputOTP
      id="totp"
      name="totp"
      autoFocus
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      onComplete={onComplete}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
};
