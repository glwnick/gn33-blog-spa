import { cn } from '@/lib/utils';

/**
 * The wordmark.
 *
 * <p>`textClassName` exists because the wordmark now appears twice on the landing page: once in the global `TopNav`
 * and once as the hero. At one size those two read as an accidental duplicate rather than as chrome plus headline,
 * so the hero scales its type up rather than the mark being repeated verbatim.
 */
const Logo = ({
  logoClassName,
  textClassName,
}: {
  logoClassName?: string;
  textClassName?: string;
}) => {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <img
        src="/nLogoColorBG.svg"
        alt="Logo"
        className={cn('size-9 shrink-0 object-contain', logoClassName)}
      />
      <span
        className={cn(
          'bg-linear-to-r from-purple-600 via-purple-800 to-blue-600 bg-clip-text text-xl font-semibold text-transparent dark:via-purple-300',
          textClassName,
        )}
      >
        gn33/Shop
      </span>
    </div>
  );
};

export default Logo;
