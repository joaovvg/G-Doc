import assert from 'node:assert/strict';
import { buildMasterFallbackAssignment } from '../lib/masterLogin.js';

const masterProfileId = '70707070-7070-7070-7070-707070707070';
const unit = { id: 'unit-1' };

const noSectorResult = buildMasterFallbackAssignment(unit, [], masterProfileId);
assert.equal(noSectorResult, undefined, 'Sem setor, o login mestre nao deve criar lotacao falsa.');

const sectorResult = buildMasterFallbackAssignment(unit, [{ id: 'sector-1', unitId: 'unit-1' }], masterProfileId);
assert.deepEqual(
  sectorResult,
  { unitId: 'unit-1', sectorId: 'sector-1', profileId: masterProfileId },
  'Com setor valido, o login mestre deve criar lotacao real.'
);

console.log('OK: master login fallback assignment');
