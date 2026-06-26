export function buildSignUpInviteLink(email: string) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams({ email });
  return `${baseUrl}/sign-up?${params.toString()}`;
}