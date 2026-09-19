// The /contact page's email address: not a translation, so it lives here once instead of in every locale
// file. Deliberately duplicated with the backend's app.branding.support-email (BrandingProperties, used for
// outbound mail) - update both together.
//
// TODO(branding): placeholder address, replace with the real support mailbox once the brand is decided.
const CONTACT_INFO = {
  email: 'contact@gn33.eu',
} as const;

export default CONTACT_INFO;
