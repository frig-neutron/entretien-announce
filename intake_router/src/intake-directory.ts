export enum Role {
  BR_3735,
  BR_3737,
  BR_3739,
  BR_3743,
  BR_3745,
  TRIAGE
}

export interface DirectoryEntry {
  name: string,
  email: string,
  roles: (keyof typeof Role)[]
}

export function parseRoutingDirectory(data: any): Promise<DirectoryEntry[]> {
  return Promise.resolve([])
}
