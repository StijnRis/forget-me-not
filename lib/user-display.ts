type NamedUser = {
  name: string | null;
  email: string;
};

export function getDisplayName(user: NamedUser) {
  return user.name || user.email.split('@')[0];
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
