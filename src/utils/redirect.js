/** Where to go after signing in: the page that sent the visitor to /login, or the profile. */
export function getRedirectTarget(location) {
  const from = location.state?.from;
  const path = from ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '';
  return path.startsWith('/') && !path.startsWith('/login') && !path.startsWith('/signup') ? path : '/profile';
}
