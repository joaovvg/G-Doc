export const buildMasterFallbackAssignment = (existingUnit, sectors, masterProfileId) => {
  if (!existingUnit || !Array.isArray(sectors)) return undefined;

  const existingSector = sectors.find((sector) => sector.unitId === existingUnit.id);
  if (!existingSector) return undefined;

  return {
    unitId: existingUnit.id,
    sectorId: existingSector.id,
    profileId: masterProfileId,
  };
};
