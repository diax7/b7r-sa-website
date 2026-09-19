import { describe, expect, it } from 'vitest';
import { parseEnvFile } from '../scripts/media-shared';

/** The `--env <file>` reader of the media scripts: what `.env.cranl.local` may hold. */
describe('parseEnvFile', () => {
  it('reads KEY=value rows, trimmed, and skips comments and blank lines', () => {
    expect(
      parseEnvFile(
        ['# production', '', 'DATABASE_URL= postgres://h/db ', 'S3_BUCKET=media'].join('\n'),
      ),
    ).toEqual({ DATABASE_URL: 'postgres://h/db', S3_BUCKET: 'media' });
  });

  it('removes a matching pair of quotes around a value and keeps everything inside', () => {
    expect(
      parseEnvFile(
        [
          'S3_SECRET_ACCESS_KEY="ab/c=d#e"',
          "PAYLOAD_SECRET='s3cret'",
          'MIXED="left\'',
          'EMPTY=""',
          'HASH_INSIDE=x"y"z',
        ].join('\r\n'),
      ),
    ).toEqual({
      S3_SECRET_ACCESS_KEY: 'ab/c=d#e',
      PAYLOAD_SECRET: 's3cret',
      MIXED: '"left\'',
      EMPTY: '',
      HASH_INSIDE: 'x"y"z',
    });
  });

  it('the last row of a repeated key wins, as in the shell', () => {
    expect(parseEnvFile('A=1\nA=2')).toEqual({ A: '2' });
  });
});
