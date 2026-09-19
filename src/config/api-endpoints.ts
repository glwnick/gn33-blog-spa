import env from './env';

type PathBuilder<
  TArgs extends Array<string> = [],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  R extends string = string,
> = (...args: TArgs) => R;

const API_ENDPOINTS = {
  users: {
    list: '/v1/users',
    details: ((userId: string) => `/v1/users/${userId}`) as PathBuilder<
      [string]
    >,
    create: '/v1/users',
    assignRole: ((userId: string, roleId: string) =>
      `/v1/users/${userId}/roles/${roleId}`) as PathBuilder<[string, string]>,
    update: ((userId: string) => `/v1/users/${userId}`) as PathBuilder<
      [string]
    >,
    uploadProfilePicture: ((userId: string) =>
      `/v1/users/${userId}/profile-picture`) as PathBuilder<[string]>,
    deleteRole: ((userId: string, roleId: string) =>
      `/v1/users/${userId}/roles/${roleId}`) as PathBuilder<[string, string]>,
    delete: ((userId: string) => `/v1/users/${userId}`) as PathBuilder<
      [string]
    >,
    deleteProfilePicture: ((userId: string) =>
      `/v1/users/${userId}/profile-picture`) as PathBuilder<[string]>,
    getRoles: ((userId: string) => `/v1/users/${userId}/roles`) as PathBuilder<
      [string]
    >,
    accountStatus: ((userId: string) =>
      `/v1/users/${userId}/account-status`) as PathBuilder<[string]>,
    gdprErase: ((userId: string) =>
      `/v1/users/${userId}/gdpr-erase`) as PathBuilder<[string]>,
    stats: '/v1/users/stats',
    authorProfile: ((userId: string) =>
      `/v1/users/${userId}/author-profile`) as PathBuilder<[string]>,
  },

  welcome: {
    index: '/v1/welcome', // optional query: name
  },

  noAuth: {
    login: '/v1/auth/login',
    twoFactor: '/v1/auth/two-factor', // query: code
    forgotPassword: '/v1/auth/forgot-password',
    resetPassword: '/v1/auth/reset-password', // query: token, newPassword
    refresh: '/v1/auth/refresh', // body or query: refreshToken
    signup: '/v1/auth/signup', // query: pinCode
    signupPinCode: '/v1/auth/signup/pin-code', // query: email
    verifyEmail: '/v1/auth/verify-email', // query: token
    resendVerificationEmail: '/v1/auth/resend-verification-email', // query: email
  },
  auth: {
    userDetails: '/v1/user',
    logout: '/v1/logout',
    changePassword: '/v1/change-password',
    acceptTnC: '/v1/accept-terms-and-conditions', // query: accepted=true|false
    acceptGdpr: '/v1/accept-gdpr', // query: accepted=true|false
    setupOtp: '/v1/setup-otp',
    setupTotp: '/v1/setup-totp',
    disableTwoFactor: '/v1/disable-two-factor',
    enableTwoFactor: '/v1/enable-two-factor', // query: type, code
  },
  sso: {
    google: `${env.API_URL}/oauth2/authorization/google`,
    facebook: `${env.API_URL}/oauth2/authorization/facebook`,
  },

  collections: {
    genders: '/v1/collections/genders',
    twoFactorTypes: '/v1/collections/two-factor-types',
    languages: '/v1/collections/languages',
  },

  roles: {
    list: '/v1/roles',
  },

  files: {
    downloadThumbnail: ((userId: string, pictureName: string) =>
      `/v1/files/download-thumbnail/${userId}/${pictureName}`) as PathBuilder<
      [string, string]
    >,
    downloadPicture: ((userId: string, pictureName: string) =>
      `/v1/files/download-picture/${userId}/${pictureName}`) as PathBuilder<
      [string, string]
    >,
  },

  postImages: {
    upload: '/v1/post-images',
  },

  push: {
    publicKey: '/v1/push/public-key',
    subscriptions: '/v1/push/subscriptions',
  },

  preferences: {
    notifications: '/v1/user/preferences/notifications',
  },

  whatsapp: {
    status: '/v1/user/whatsapp',
    verification: '/v1/user/whatsapp/verification',
    verificationConfirm: '/v1/user/whatsapp/verification/confirm',
    optOut: '/v1/user/whatsapp',
  },

  gdpr: {
    export: '/v1/gdpr/export',
    deleteAccount: '/v1/gdpr/account',
  },

  posts: {
    feed: '/v1/posts', // query: authorId, page, size
    mine: '/v1/posts/mine', // query: page, size
    detail: ((postId: string) => `/v1/posts/${postId}`) as PathBuilder<
      [string]
    >,
    create: '/v1/posts',
    update: ((postId: string) => `/v1/posts/${postId}`) as PathBuilder<
      [string]
    >,
    delete: ((postId: string) => `/v1/posts/${postId}`) as PathBuilder<
      [string]
    >,
  },

  comments: {
    list: ((postId: string) =>
      `/v1/posts/${postId}/comments`) as PathBuilder<[string]>,
    create: ((postId: string) =>
      `/v1/posts/${postId}/comments`) as PathBuilder<[string]>,
  },

  legalDocuments: {
    current: ((type: string) => `/v1/legal-documents/${type}`) as PathBuilder<
      [string]
    >,
    adminCurrent: ((type: string) =>
      `/v1/admin/legal-documents/${type}`) as PathBuilder<[string]>,
    versions: ((type: string) =>
      `/v1/admin/legal-documents/${type}/versions`) as PathBuilder<[string]>,
    publish: ((type: string) =>
      `/v1/admin/legal-documents/${type}`) as PathBuilder<[string]>,
  },
} as const;

export default API_ENDPOINTS;
