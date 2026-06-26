export const CaregiverRelationship = {
  DAUGHTER: 'daughter',
  SON: 'son',
  PARTNER: 'partner',
  SPOUSE: 'spouse',
  FRIEND: 'friend',
  GRANDCHILD: 'grandchild',
  SIBLING: 'sibling',
  NEIGHBOR: 'neighbor',
  OTHER: 'other',
} as const;

export type CaregiverRelationship =
  (typeof CaregiverRelationship)[keyof typeof CaregiverRelationship];

export const CAREGIVER_RELATIONSHIP_VALUES = Object.values(
  CaregiverRelationship
) as [CaregiverRelationship, ...CaregiverRelationship[]];

export const CAREGIVER_RELATIONSHIP_LABELS: Record<CaregiverRelationship, string> = {
  [CaregiverRelationship.DAUGHTER]: 'Daughter',
  [CaregiverRelationship.SON]: 'Son',
  [CaregiverRelationship.PARTNER]: 'Partner',
  [CaregiverRelationship.SPOUSE]: 'Spouse',
  [CaregiverRelationship.FRIEND]: 'Friend',
  [CaregiverRelationship.GRANDCHILD]: 'Grandchild',
  [CaregiverRelationship.SIBLING]: 'Sibling',
  [CaregiverRelationship.NEIGHBOR]: 'Neighbor',
  [CaregiverRelationship.OTHER]: 'Other',
};

export function formatCaregiverRelationship(
  relationship: string | null | undefined
): string | null {
  if (!relationship?.trim()) return null;
  return relationship.trim();
}
