import { queryOptions } from '@tanstack/react-query';
import type { LegalDocumentType } from '@/schemas/legal-document';
import { DEFAULT_STALE_TIME } from '@/config/query';
import {
  getAdminLegalDocument,
  getCurrentLegalDocument,
  getLegalDocumentVersions,
} from '@/api/legal-document-api';

export const LEGAL_DOCUMENT_KEY = 'legal-document' as const;
export const ADMIN_LEGAL_DOCUMENT_KEY = 'admin-legal-document' as const;
export const LEGAL_DOCUMENT_VERSIONS_KEY = 'legal-document-versions' as const;

export const legalDocumentOptions = (type: LegalDocumentType) => {
  return queryOptions({
    queryKey: [LEGAL_DOCUMENT_KEY, type],
    queryFn: () => getCurrentLegalDocument(type),
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const adminLegalDocumentOptions = (type: LegalDocumentType) => {
  return queryOptions({
    queryKey: [ADMIN_LEGAL_DOCUMENT_KEY, type],
    queryFn: () => getAdminLegalDocument(type),
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const legalDocumentVersionsOptions = (type: LegalDocumentType) => {
  return queryOptions({
    queryKey: [LEGAL_DOCUMENT_VERSIONS_KEY, type],
    queryFn: () => getLegalDocumentVersions(type),
    staleTime: DEFAULT_STALE_TIME,
  });
};
