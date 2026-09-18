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
    address: ((userId: string) => `/v1/users/${userId}/address`) as PathBuilder<
      [string]
    >,
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

  adminSettings: {
    get: '/v1/admin/settings',
    update: '/v1/admin/settings',
  },

  adminCsvImport: {
    users: '/v1/admin/csv-import/users', // query: dryRun
    stockLevels: '/v1/admin/csv-import/stock-levels', // query: dryRun
  },

  gdpr: {
    export: '/v1/gdpr/export',
    deleteAccount: '/v1/gdpr/account',
  },

  products: {
    list: '/v1/products', // query: page, size, category, minPrice, maxPrice, colours, readyToShip, search, sort
    facets: '/v1/products/facets', // the filter rail's yarn swatches and price bounds
    detail: ((slug: string) => `/v1/products/${slug}`) as PathBuilder<[string]>,
    cataloguePdf: '/v1/products/catalogue.pdf', // query: same filters as `list`, minus page/size
  },

  categories: {
    list: '/v1/categories',
  },

  favorites: {
    list: '/v1/favorites', // query: page, size
    add: ((productId: string) => `/v1/favorites/${productId}`) as PathBuilder<
      [string]
    >,
    remove: ((productId: string) =>
      `/v1/favorites/${productId}`) as PathBuilder<[string]>,
  },

  orders: {
    checkout: '/v1/orders/checkout',
    confirmation: ((orderId: string) =>
      `/v1/orders/${orderId}/confirmation`) as PathBuilder<[string]>,
    storefrontConfig: '/v1/storefront-config',
    list: '/v1/orders', // query: filter, page, size
    detail: ((orderId: string) => `/v1/orders/${orderId}`) as PathBuilder<
      [string]
    >,
    cancel: ((orderId: string) =>
      `/v1/orders/${orderId}/cancel`) as PathBuilder<[string]>,
    board: '/v1/orders/board',
    status: ((orderId: string) =>
      `/v1/orders/${orderId}/status`) as PathBuilder<[string]>,
  },

  adminProducts: {
    list: '/v1/admin/products', // query: search, status, category, page, size
    defaults: '/v1/admin/products/defaults',
    detail: ((productId: string) =>
      `/v1/admin/products/${productId}`) as PathBuilder<[string]>,
    create: '/v1/admin/products',
    update: ((productId: string) =>
      `/v1/admin/products/${productId}`) as PathBuilder<[string]>,
    status: ((productId: string) =>
      `/v1/admin/products/${productId}/status`) as PathBuilder<[string]>,
    featured: ((productId: string) =>
      `/v1/admin/products/${productId}/featured`) as PathBuilder<[string]>,
    duplicate: ((productId: string) =>
      `/v1/admin/products/${productId}/duplicate`) as PathBuilder<[string]>,
    adjustStock: ((variantId: string) =>
      `/v1/admin/products/variants/${variantId}/stock`) as PathBuilder<
      [string]
    >,
    delete: ((productId: string) =>
      `/v1/admin/products/${productId}`) as PathBuilder<[string]>,
    uploadImage: ((productId: string) =>
      `/v1/admin/products/${productId}/images`) as PathBuilder<[string]>,
    reorderImages: ((productId: string) =>
      `/v1/admin/products/${productId}/images/order`) as PathBuilder<[string]>,
    deleteImage: ((productId: string, imageId: string) =>
      `/v1/admin/products/${productId}/images/${imageId}`) as PathBuilder<
      [string, string]
    >,
  },

  adminCategories: {
    list: '/v1/admin/categories',
    create: '/v1/admin/categories',
    update: ((categoryId: string) =>
      `/v1/admin/categories/${categoryId}`) as PathBuilder<[string]>,
    makingLeadTime: ((categoryId: string) =>
      `/v1/admin/categories/${categoryId}/making-lead-time`) as PathBuilder<[string]>,
    delete: ((categoryId: string) =>
      `/v1/admin/categories/${categoryId}`) as PathBuilder<[string]>,
  },

  adminYarns: {
    list: '/v1/admin/yarns',
    create: '/v1/admin/yarns',
    products: ((yarnId: string) =>
      `/v1/admin/yarns/${yarnId}/products`) as PathBuilder<[string]>,
    update: ((yarnId: string) => `/v1/admin/yarns/${yarnId}`) as PathBuilder<
      [string]
    >,
    reorder: '/v1/admin/yarns/reorder',
    delete: ((yarnId: string) => `/v1/admin/yarns/${yarnId}`) as PathBuilder<
      [string]
    >,
  },

  adminSizes: {
    list: '/v1/admin/sizes',
    create: '/v1/admin/sizes',
    products: ((sizeId: string) =>
      `/v1/admin/sizes/${sizeId}/products`) as PathBuilder<[string]>,
    update: ((sizeId: string) => `/v1/admin/sizes/${sizeId}`) as PathBuilder<
      [string]
    >,
    reorder: '/v1/admin/sizes/reorder',
    delete: ((sizeId: string) => `/v1/admin/sizes/${sizeId}`) as PathBuilder<
      [string]
    >,
  },

  adminMaterials: {
    list: '/v1/admin/materials',
    create: '/v1/admin/materials',
    products: ((materialId: string) =>
      `/v1/admin/materials/${materialId}/products`) as PathBuilder<[string]>,
    update: ((materialId: string) =>
      `/v1/admin/materials/${materialId}`) as PathBuilder<[string]>,
    reorder: '/v1/admin/materials/reorder',
    delete: ((materialId: string) =>
      `/v1/admin/materials/${materialId}`) as PathBuilder<[string]>,
  },

  adminSeasonalBatches: {
    list: '/v1/admin/seasonal-batches',
    create: '/v1/admin/seasonal-batches',
    update: ((batchId: string) =>
      `/v1/admin/seasonal-batches/${batchId}`) as PathBuilder<[string]>,
    delete: ((batchId: string) =>
      `/v1/admin/seasonal-batches/${batchId}`) as PathBuilder<[string]>,
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
