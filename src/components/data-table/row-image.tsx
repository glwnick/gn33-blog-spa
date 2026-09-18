import type { FC, ReactNode } from 'react';

type RowImageProps = {
  src: string;
  alt: string;
  content: string | ReactNode;
};

export const RowImage: FC<RowImageProps> = ({ src, alt, content }) => {
  return (
    <div className="relative h-14 w-full">
      <div className="relative z-10 flex items-center h-full font-semibold ml-2">
        {content}
      </div>
      {src && (
        <div className="absolute select-none inset-0 rounded-bl-lg rounded-tr-lg overflow-hidden mask-linear-175 mask-linear-from-0% mask-linear-to-75%">
          <img alt={alt} src={src} className="object-cover w-full h-full" />
        </div>
      )}
    </div>
  );
};
