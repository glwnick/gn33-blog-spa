import type { FC } from 'react';

type TopDialogImageProps = {
  picture: File | undefined;
};

export const TopDialogImage: FC<TopDialogImageProps> = ({ picture }) => {
  return (
    <>
      {picture && (
        <div className="absolute select-none rounded-t-xl -z-10 w-full h-28 overflow-hidden mask-linear-175 mask-linear-from-0% mask-linear-to-65%">
          <img
            src={URL.createObjectURL(picture)}
            alt={picture.name}
            className="object-cover size-full -mt-px"
          />
        </div>
      )}
    </>
  );
};
