import '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostActions } from './post-actions';

const deletePost = vi.hoisted(() => vi.fn());
vi.mock('@/api/posts-api', () => ({ deletePost }));
vi.mock('@/components/anchor-link', () => ({
  AnchorLink: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a href="/x" aria-label={props['aria-label']}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  deletePost.mockReset();
});

function renderActions(props: Partial<React.ComponentProps<typeof PostActions>> = {}) {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <PostActions postId="p1" title="Hello" {...props} />
    </QueryClientProvider>,
  );
  return client;
}

describe('PostActions', () => {
  it('offers view, edit and delete', () => {
    renderActions();
    for (const name of ['View', 'Edit', 'Delete']) {
      expect(screen.getByLabelText(name)).toBeTruthy();
    }
  });

  it('omits view when showView is false', () => {
    renderActions({ showView: false });
    expect(screen.queryByLabelText('View')).toBeNull();
  });

  it('deletes after confirmation, then calls onDeleted', async () => {
    deletePost.mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    renderActions({ onDeleted });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(deletePost).toHaveBeenCalledWith('p1');
  });

  it('does not call onDeleted when the delete fails', async () => {
    deletePost.mockRejectedValue(new Error('boom'));
    const onDeleted = vi.fn();
    renderActions({ onDeleted });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(deletePost).toHaveBeenCalled());
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
