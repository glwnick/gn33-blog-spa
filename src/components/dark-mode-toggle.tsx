import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Kbd } from './ui/kbd';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useTranslation } from '@/hooks/use-translation';
import { useTheme } from '@/context/theme-provider';

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const dark = theme === 'dark';

  // `theme` comes from `localStorage`, which the server cannot see: it renders DEFAULT_THEME while the browser
  // may already be on the other one. The icons cope with that on their own - they are swapped by `dark:` CSS
  // variants, and `THEME_INIT_SCRIPT` puts the class on `<html>` before first paint - but these two *strings*
  // are chosen in JS, so rendering them from `theme` on the first client pass produced an `aria-label` that
  // disagreed with the server HTML. React does not patch attribute mismatches, so the label stayed wrong until
  // something else re-rendered the button. Deferring one tick makes the first client render match the server's.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const toggleLabel = t(hydrated && dark ? 'themeLight' : 'themeDark');

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={toggleLabel}
            onClick={() => {
              setTheme(dark ? 'light' : 'dark');
            }}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        }
      />
      <TooltipContent>
        <div className="flex gap-2">
          {toggleLabel}
          <Kbd>T</Kbd>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default DarkModeToggle;
