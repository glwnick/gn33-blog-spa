import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

type OtpFieldProps = {
  onComplete: (value: string) => void;
};

export const OtpField = ({ onComplete }: OtpFieldProps) => {
  return (
    <InputOTP
      id="otp"
      name="otp"
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
      onComplete={onComplete}
      autoFocus
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
};
