// Language-independent contact channels for the /contact page: a phone number or a
// social URL is not a translation, so it lives here once instead of in every locale
// file. The contact email is deliberately duplicated with the backend's
// app.branding.support-email (BrandingProperties, used for outbound mail) - update
// both when the shop's contact details change.
//
// TODO(branding): these are still the fitness studio's details (the social handles read
// gn33studio), as are the opening hours in en.json/ro.json. They are real business data
// rather than code, so they need the owner's actual shop accounts, phone number and
// support hours before launch.
const CONTACT_INFO = {
  email: 'contact@gn33.eu',
  phone: '+40 721 234 567',
  instagramUrl: 'https://instagram.com/gn33studio',
  facebookUrl: 'https://facebook.com/gn33studio',
} as const;

export default CONTACT_INFO;
