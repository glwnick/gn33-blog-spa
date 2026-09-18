import type {
  AuthInput,
  AuthResponse,
  GenericSuccessResponse,
} from '@/types/api-types';
import type { UserSignUpInput } from '@/schemas/auth';
import type { TwoFactorType } from '@/schemas/common';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const loginUser = async (credentials: AuthInput) => {
  const res = await api.post<AuthResponse>(
    API_ENDPOINTS.noAuth.login,
    credentials,
  );
  return res.data;
};

export const logoutUser = async () => {
  await api.post(API_ENDPOINTS.auth.logout);
};

export const refreshAccessToken = async () => {
  const res = await api.post<AuthResponse>(API_ENDPOINTS.noAuth.refresh);
  return res.data;
};

export const signupPinCode = async (email: string) => {
  const res = await api.post<AuthResponse>(
    API_ENDPOINTS.noAuth.signupPinCode,
    {},
    {
      params: {
        email: email,
      },
    },
  );
  return res.data;
};

export const signupUser = async (input: UserSignUpInput) => {
  const res = await api.post<AuthResponse>(API_ENDPOINTS.noAuth.signup, input, {
    params: {
      pinCode: input.pinCode,
    },
  });
  return res.data;
};

export const totpLogin = async () => {
  const res = await api.put<string>(API_ENDPOINTS.auth.setupTotp);
  return res.data;
};

export const otpLogin = async () => {
  const res = await api.put<GenericSuccessResponse>(
    API_ENDPOINTS.auth.setupOtp,
  );
  return res.data;
};

export const enableTwoFactorAuth = async (
  code: string,
  type: TwoFactorType,
) => {
  if (type === 'NONE') {
    return;
  }
  const res = await api.put(
    API_ENDPOINTS.auth.enableTwoFactor,
    {},
    {
      params: {
        code: code,
        type: type,
      },
    },
  );
  return res.data;
};

export const disableTwoFactorAuth = async () => {
  const res = await api.put(API_ENDPOINTS.auth.disableTwoFactor);
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await api.post<GenericSuccessResponse>(
    API_ENDPOINTS.noAuth.forgotPassword,
    {},
    {
      params: {
        email: email,
      },
    },
  );
  return res.data;
};

export const resetPassword = async (resetData: {
  token: string;
  newPassword: string;
}) => {
  const res = await api.post<GenericSuccessResponse>(
    API_ENDPOINTS.noAuth.resetPassword,
    resetData,
  );
  return res.data;
};

// M4, SECURITY-AUDIT-2026-09-15.md: redeems the token embedded in the order-confirmation email a
// checkout-created account received, so it can authenticate for the first time.
export const verifyEmail = async (token: string) => {
  const res = await api.post<GenericSuccessResponse>(
    API_ENDPOINTS.noAuth.verifyEmail,
    {},
    { params: { token } },
  );
  return res.data;
};

// M4, SECURITY-AUDIT-2026-09-15.md: recovery path for a checkout-created account whose original
// verification link was lost, spam-filtered, or has expired - always returns the same generic success
// response, whether or not the address needs one.
export const resendVerificationEmail = async (email: string) => {
  const res = await api.post<GenericSuccessResponse>(
    API_ENDPOINTS.noAuth.resendVerificationEmail,
    {},
    { params: { email } },
  );
  return res.data;
};

export const twoFactorLogin = async (token: string, code: string) => {
  const res = await api.post<AuthResponse>(
    API_ENDPOINTS.noAuth.twoFactor,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        code: code,
      },
    },
  );
  return res.data;
};

export const acceptTerms = async () => {
  const res = await api.put(API_ENDPOINTS.auth.acceptTnC, undefined, {
    params: {
      accepted: true,
    },
  });
  return res.data;
};

export const acceptGdprConsent = async () => {
  const res = await api.put(API_ENDPOINTS.auth.acceptGdpr, undefined, {
    params: {
      accepted: true,
    },
  });
  return res.data;
};
