'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
import type { ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-lime-600 dark:text-lime-400" />
        ),
        info: <InfoIcon className="size-4 text-blue-600 dark:text-blue-400" />,
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
        ),
        error: (
          <CircleAlertIcon className="size-4 text-red-600 dark:text-red-400" />
        ),
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
