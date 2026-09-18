import type {
  LegalDocumentResponse,
  LegalDocumentType,
  LegalDocumentVersion,
} from '@/schemas/legal-document';
import {
  legalDocumentResponseSchema,
  legalDocumentVersionSchema,
} from '@/schemas/legal-document';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getCurrentLegalDocument = async (
  type: LegalDocumentType,
): Promise<LegalDocumentResponse> => {
  const res = await api.get<LegalDocumentResponse>(
    API_ENDPOINTS.legalDocuments.current(type),
  );
  return legalDocumentResponseSchema.parse(res.data);
};

export const getAdminLegalDocument = async (
  type: LegalDocumentType,
): Promise<LegalDocumentResponse> => {
  const res = await api.get<LegalDocumentResponse>(
    API_ENDPOINTS.legalDocuments.adminCurrent(type),
  );
  return legalDocumentResponseSchema.parse(res.data);
};

export const getLegalDocumentVersions = async (
  type: LegalDocumentType,
): Promise<Array<LegalDocumentVersion>> => {
  const res = await api.get<Array<LegalDocumentVersion>>(
    API_ENDPOINTS.legalDocuments.versions(type),
  );
  return res.data.map((item) => legalDocumentVersionSchema.parse(item));
};

export const publishLegalDocument = async (
  type: LegalDocumentType,
  content: string,
): Promise<LegalDocumentResponse> => {
  const res = await api.post<LegalDocumentResponse>(
    API_ENDPOINTS.legalDocuments.publish(type),
    { content },
  );
  return legalDocumentResponseSchema.parse(res.data);
};
