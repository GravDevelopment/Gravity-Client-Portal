// Where people are sent when the portal can't give them what they came for.
// The two old sites disagreed (gravitygh.co.za vs gravitytraining.co.za); this
// uses the manuals portal's address.
export const SUPPORT_EMAIL = 'certification@gravitygh.co.za';
export const SUPPORT_PHONE = '+27 12 349 1318';
export const SUPPORT_PHONES = ['086 110 1213', SUPPORT_PHONE];

export function supportMailto(subject) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
