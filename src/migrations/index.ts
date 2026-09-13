import * as migration_20260913_072032_initial from './20260913_072032_initial';

export const migrations = [
  {
    up: migration_20260913_072032_initial.up,
    down: migration_20260913_072032_initial.down,
    name: '20260913_072032_initial'
  },
];
