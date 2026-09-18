import type { SignInType, TwoFactorType } from '@/schemas/common';

export type AuthInput = {
  readonly email: string;
  readonly password: string;
};

export type AuthResponse = {
  readonly accessToken?: string;
  readonly user?: AuthUser;
  readonly twoFactorToken?: string;
  readonly twoFactorType?: TwoFactorType;
};

export type AuthUser = {
  readonly userId: string;
  readonly email: string;
  readonly fullName: string;
  readonly enabled: boolean;
  readonly accountNonExpired: boolean;
  readonly accountExpiryDate: string;
  readonly twoFactorType: TwoFactorType;
  readonly signInType: SignInType;
  readonly roles: ReadonlyArray<string>;
  readonly preferredLanguage: string;
  readonly termsAccepted: boolean;
  readonly gdprConsentGiven: boolean;
  readonly picture: string;
};

export type GenericSuccessResponse = {
  readonly message: string;
};
