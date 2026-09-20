import { useEffect, useState } from 'react';
import { Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ShareNetwork } from '@/lib/post-share';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { SHARE_NETWORKS, shareNetworkUrl } from '@/lib/post-share';
import { cn } from '@/lib/utils';

type ShareButtonProps = {
  readonly url: string;
  readonly title: string;
  readonly className?: string;
};

const NETWORK_LABEL_KEYS = {
  x: 'shareOnX',
  facebook: 'shareOnFacebook',
  linkedin: 'shareOnLinkedIn',
  whatsapp: 'shareOnWhatsApp',
} as const satisfies Record<ShareNetwork, string>;

/** The async Clipboard API where it is allowed; otherwise the legacy selection copy, which embedded webviews and older browsers still honour inside a click. */
async function writeToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Fall through to the legacy path.
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  try {
    if (!document.execCommand('copy')) throw new Error('copy rejected');
  } finally {
    field.remove();
  }
}

/**
 * Share a post: the OS share sheet where the browser has one, otherwise a menu with copy-link and a few networks.
 * Native support is only known on the client, so it is read after mount - the server render and the first client
 * render both show the menu, which keeps hydration identical.
 */
export function ShareButton({ url, title, className }: ShareButtonProps) {
  const { t } = useTranslation();
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === 'function');
  }, []);

  const shareNatively = async () => {
    try {
      await navigator.share({ url, title });
    } catch (error) {
      // Dismissing the sheet rejects with AbortError; that is a choice, not a failure.
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error(t('shareFailed'));
      }
    }
  };

  const copyLink = async () => {
    try {
      await writeToClipboard(url);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('copyLinkFailed'));
    }
  };

  const triggerClassName = cn(
    buttonVariants({ variant: 'outline', size: 'sm' }),
    className,
  );

  if (canNativeShare) {
    return (
      <button
        type="button"
        className={triggerClassName}
        onClick={() => void shareNatively()}
      >
        <Share2 className="size-4" />
        {t('share')}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClassName}>
        <Share2 className="size-4" />
        {t('share')}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('share')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => void copyLink()}>
            <Link2 />
            {t('copyLink')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {SHARE_NETWORKS.map((network) => (
          <DropdownMenuItem
            key={network}
            // Same left edge as the icon'd "Copy link" label above.
            inset
            render={
              <a
                href={shareNetworkUrl(network, url, title)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            {t(NETWORK_LABEL_KEYS[network])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
