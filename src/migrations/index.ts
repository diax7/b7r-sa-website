import * as migration_20260913_091427_initial from './20260913_091427_initial';

export const migrations = [
  {
    up: migration_20260913_091427_initial.up,
    down: migration_20260913_091427_initial.down,
    name: '20260913_091427_initial'
  },
];
