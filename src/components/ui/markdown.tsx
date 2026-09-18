import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { FC } from 'react';
import { cn } from '@/lib/utils';

type MarkdownProps = {
  readonly children: string;
  readonly className?: string;
};

/**
 * Renders a markdown string using react-markdown + remark-gfm.
 * Styled with Tailwind classes matching the app's design system.
 * Raw HTML is not allowed (default react-markdown behaviour).
 */
export const Markdown: FC<MarkdownProps> = ({ children, className }) => {
  return (
    <div className={cn('text-sm text-foreground', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children: c }) => (
            <h1 className="mb-2 mt-4 text-xl font-bold first:mt-0">{c}</h1>
          ),
          h2: ({ children: c }) => (
            <h2 className="mb-1.5 mt-3 text-lg font-semibold first:mt-0">
              {c}
            </h2>
          ),
          h3: ({ children: c }) => (
            <h3 className="mb-1 mt-2 text-base font-semibold first:mt-0">
              {c}
            </h3>
          ),
          p: ({ children: c }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{c}</p>
          ),
          ul: ({ children: c }) => (
            <ul className="mb-2 list-disc pl-5 space-y-0.5">{c}</ul>
          ),
          ol: ({ children: c }) => (
            <ol className="mb-2 list-decimal pl-5 space-y-0.5">{c}</ol>
          ),
          li: ({ children: c }) => <li className="leading-relaxed">{c}</li>,
          strong: ({ children: c }) => (
            <strong className="font-semibold">{c}</strong>
          ),
          em: ({ children: c }) => <em className="italic">{c}</em>,
          code: ({ children: c }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {c}
            </code>
          ),
          a: ({ href, children: c }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {c}
            </a>
          ),
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
