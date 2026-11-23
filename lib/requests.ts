// Statuts des demandes clients (back office « Demandes »)
export const REQUEST_STATUSES = [
  { value: 'pending', label: 'À traiter' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'treated', label: 'Traitée' },
  { value: 'archived', label: 'Archivée' },
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number]['value'];

export function statusLabel(s?: string | null) {
  return REQUEST_STATUSES.find((x) => x.value === s)?.label ?? 'À traiter';
}

export function isRequestStatus(s: unknown): s is RequestStatus {
  return REQUEST_STATUSES.some((x) => x.value === s);
}
