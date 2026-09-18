import axios from 'axios';
import { createIsomorphicFn } from '@tanstack/react-start';
import env from '../config/env';
import {
  getStoredAccessToken,
  notifyUnauthenticated,
  setStoredAccessToken,
} from './auth-token';
import { getStoredLanguage } from './i18n';
import { ApiResponseError } from './api-error';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ValidationError } from './api-error';
import { refreshAccessToken } from '@/api/auth-api';
import { getServerAccessToken } from '@/lib/server-auth';

import API_ENDPOINTS from '@/config/api-endpoints';

// `createIsomorphicFn` rather than a plain `import.meta.env.SSR` ternary: `lib/server-auth.ts` reaches into
// `@tanstack/react-start/server`, which does not exist in a browser, and only this macro's compiler
// transform - not a runtime branch a bundler has to prove dead - keeps that import out of the client build.
// `lib/auth-token.ts`'s store is never written on the server (see its header comment), so the server
// implementation reads the per-request session `routes/__root.tsx`'s `beforeLoad` already resolved instead.
const readAccessToken = createIsomorphicFn()
  .client(() => getStoredAccessToken())
  .server(() => getServerAccessToken());

// Shape your backend actually returns
interface ApiErrorResponse {
  readonly message: string;
  readonly validationErrors?: ReadonlyArray<ValidationError>;
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as Record<string, unknown>).message === 'string'
  );
}

const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Coalesce concurrent 401s into a single refresh call. All requests that hit a 401 at the same
// time await the same in-flight refresh instead of each firing their own.
let refreshPromise: Promise<string | null> | null = null;

export function refreshSharedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .then((res) => {
        const token = res.accessToken ?? null;
        setStoredAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Attach token and language
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = getStoredLanguage();
  if (lang) {
    config.headers['Accept-Language'] = lang;
  }

  return config;
});

// Refresh token after expire
api.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<unknown> & {
      config: InternalAxiosRequestConfig & { _retry?: boolean };
    },
  ) => {
    // Network / timeout — no response at all
    if (!error.response) {
      throw new ApiResponseError(
        'Network error — please check your connection',
        0,
      );
    }

    const originalRequest = error.config;
    const { status, data: rawData } = error.response;

    // A request made with `responseType: 'blob'` (catalogue PDF, GDPR export) gets its error body back as an
    // undecoded Blob too - XHR honours the configured responseType for the whole response, success or failure,
    // since it can't know in advance which one it's reading. Without this, every blob-typed request's error
    // handling falls through to the generic "Request failed with status N" branch below, even though the
    // backend sent a real JSON ErrorResponseDto describing exactly what went wrong (e.g. 429 SERVER_BUSY).
    let data: unknown = rawData;
    if (rawData instanceof Blob && rawData.type.includes('json')) {
      try {
        data = JSON.parse(await rawData.text());
      } catch {
        data = rawData;
      }
    }

    if (
      status === 401 &&
      // Client only. Plain `import.meta.env.SSR` is fine here, unlike the `createIsomorphicFn`
      // requirement noted near the top of this file: this branch imports nothing server-only, so
      // there is no `@tanstack/react-start/server` import for the build's import-protection plugin
      // to reject, only a runtime condition a bundler can tree-shake normally.
      // Slice 6b-2 made this branch reachable during SSR for the first time (`_auth` loaders now
      // run on the server), and there it is both futile and unsafe: `refreshSharedToken()` posts
      // through this same instance, which on the server has no browser cookie jar to send the
      // httpOnly `refreshToken` from, so the exchange can only ever fail - while still writing the
      // module-level `refreshPromise` that every concurrent render shares. `lib/server-auth.ts` has
      // already done this request's one legitimate exchange before any loader ran, so a 401 here means
      // the session is genuinely bad for this request and the error belongs to the caller.
      !import.meta.env.SSR &&
      !originalRequest._retry &&
      !Object.values(API_ENDPOINTS.noAuth).some((url) =>
        originalRequest.url?.includes(url),
      )
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshSharedToken();
        if (!newToken) {
          throw new Error('Failed to refresh token');
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — the session is unrecoverable. Clear auth state and let the app redirect to login.
        notifyUnauthenticated();
      }
    }

    if (isApiErrorResponse(data)) {
      throw new ApiResponseError(data.message, status, { ...data });
    }

    // Fallback for unexpected error shapes
    throw new ApiResponseError(
      typeof data === 'string' && data.length > 0
        ? data
        : `Request failed with status ${status}`,
      status,
    );
  },
);

export default api;
