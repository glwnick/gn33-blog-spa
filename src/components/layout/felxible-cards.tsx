export const FlexibleCards = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-wrap items-baseline justify-start gap-4">
      {children}
    </div>
  );
};
