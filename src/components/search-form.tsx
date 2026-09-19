import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';

type SearchFormProps = {
  readonly query: string;
  readonly placeholder: string;
  readonly onSearch: (query: string) => void;
};

/**
 * A list-search box driven by a URL query. The backend rejects queries under 2 characters, so a lone character
 * cannot be submitted.
 */
export function SearchForm({ query, placeholder, onSearch }: SearchFormProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    // The URL changed (back/forward, Clear): follow it. Adjusting state during render, rather than keying the
    // form on the query, keeps the input mounted so it does not lose focus after each search.
    setSyncedQuery(query);
    setDraft(query);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
      className="mb-6 flex max-w-xl items-center gap-2"
    >
      <Input
        ref={inputRef}
        type="search"
        value={draft}
        maxLength={100}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={t('search')}
      />
      <Button type="submit" size="sm" disabled={draft.trim().length === 1}>
        {t('search')}
      </Button>
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearch('');
            // The Clear button unmounts once the query is gone, so hand focus back to the field.
            inputRef.current?.focus();
          }}
        >
          {t('searchClear')}
        </Button>
      )}
    </form>
  );
}
