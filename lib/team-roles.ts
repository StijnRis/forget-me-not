export const TeamRole = {
  CAREGIVER: 'caregiver',
  PERSON_WITH_DEMENTIA: 'person_with_dementia',
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  [TeamRole.CAREGIVER]: 'Caregiver',
  [TeamRole.PERSON_WITH_DEMENTIA]: 'Person with dementia',
};

export function isCaregiver(role: string | null | undefined): boolean {
  return role === TeamRole.CAREGIVER || role === 'owner';
}

export function isPersonWithDementia(role: string | null | undefined): boolean {
  return role === TeamRole.PERSON_WITH_DEMENTIA;
}

export function getHomePathForRole(_role?: string | null): string {
  return '/teams';
}
