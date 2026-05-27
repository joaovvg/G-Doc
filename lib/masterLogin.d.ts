export type MasterUnitLike = { id: string } | null | undefined;
export type MasterSectorLike = { id: string; unitId: string };

export declare const buildMasterFallbackAssignment: (
  existingUnit: MasterUnitLike,
  sectors: MasterSectorLike[],
  masterProfileId: string
) => { unitId: string; sectorId: string; profileId: string } | undefined;
