import { describe, expect, it } from 'vitest';
import { fileNameFromContentDisposition } from '@/lib/save-blob-as-file';

describe('fileNameFromContentDisposition', () => {
  it('reads the exact header the catalogue PDF endpoint sends', () => {
    expect(
      fileNameFromContentDisposition(
        'attachment; filename="gn33-catalogue-2026-08-29.pdf"',
      ),
    ).toBe('gn33-catalogue-2026-08-29.pdf');
  });

  it('reads an unquoted filename', () => {
    expect(
      fileNameFromContentDisposition('attachment; filename=export.zip'),
    ).toBe('export.zip');
  });

  it('prefers the RFC 5987 filename* form and percent-decodes it', () => {
    expect(
      fileNameFromContentDisposition(
        "attachment; filename=\"catalog.pdf\"; filename*=UTF-8''catalog-de-produse-%C8%99i-preturi.pdf",
      ),
    ).toBe('catalog-de-produse-și-preturi.pdf');
  });

  it('keeps the basename only, so a header cannot pick the directory', () => {
    expect(
      fileNameFromContentDisposition(
        'attachment; filename="../../etc/passwd.pdf"',
      ),
    ).toBe('passwd.pdf');
  });

  it('returns null when the header is missing or carries no filename', () => {
    expect(fileNameFromContentDisposition(undefined)).toBeNull();
    expect(fileNameFromContentDisposition(null)).toBeNull();
    expect(fileNameFromContentDisposition('attachment')).toBeNull();
    expect(fileNameFromContentDisposition('attachment; filename=""')).toBeNull();
  });
});
