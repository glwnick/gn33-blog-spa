import type { FC } from 'react';

type IProps = {
  icon: React.ReactNode;
  title: string;
};

export const TwFactorBadge: FC<IProps> = ({ icon, title }) => {
  return (
    <div className="flex items-center">
      <div className="basis-1/3 flex justify-center">{icon}</div>
      <div className="basis-2/3">
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
    </div>
  );
};
