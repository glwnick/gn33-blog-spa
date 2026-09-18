const MAX_INITIALS = 2;

/**
 * Derives up to two uppercase initials from a name by taking the first
 * character of each whitespace-separated word.
 */
export function getInitials(value: string): string {
  return value
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, MAX_INITIALS);
}
