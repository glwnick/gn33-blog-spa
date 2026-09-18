import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type { FC } from 'react';
import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  ErrorCorrectionLevel,
  Gradient,
  Mode,
  Options,
  TypeNumber,
} from 'qr-code-styling';

type MyQrCodeProps = {
  data: string;
};

const gradient: Gradient = {
  type: 'linear',
  rotation: 180,
  colorStops: [
    { offset: 0, color: 'var(--color-primary)' },
    { offset: 0.5, color: 'var(--color-black)' },
    { offset: 1, color: 'var(--color-black)' },
  ],
};

const options: Options = {
  width: 233,
  height: 233,
  type: 'svg',
  image: '/nLogoColor.svg',
  margin: 10,
  qrOptions: {
    typeNumber: 0 as TypeNumber,
    mode: 'Byte' as Mode,
    errorCorrectionLevel: 'Q' as ErrorCorrectionLevel,
  },
  imageOptions: {
    margin: 4,
  },
  dotsOptions: {
    type: 'rounded' as DotType,
    gradient,
  },
  cornersSquareOptions: {
    type: 'extra-rounded' as CornerSquareType,
    gradient,
  },
  cornersDotOptions: {
    type: 'extra-rounded' as CornerDotType,
    gradient,
  },
};

export const MyQrCode: FC<MyQrCodeProps> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      const qrCode = new QRCodeStyling({ ...options, data });
      qrCode.append(ref.current);
    }
  }, [data]);

  return (
    <div className="flex justify-center">
      <div className="rounded-lg overflow-hidden" ref={ref} />
    </div>
  );
};
