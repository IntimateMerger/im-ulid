import {defineConfig} from 'eslint/config';
import gts from 'gts';

export default defineConfig([
  ...gts,
  {
    ignores: ['dist/'],
  },
]);
