import { describe, expect, it } from 'vitest';
import { checkLine, checkSource } from '../scripts/check-rtl-classes';

const tsx = 'src/components/x.tsx';

describe('check-rtl-classes', () => {
  it.each([
    'className="ml-4"',
    'className="mr-2 flex"',
    'className="pl-6"',
    '"pr-3"',
    'className="left-0"',
    'className="right-4"',
    'className="text-left"',
    'className="text-right md:text-start"',
    'className="rounded-l"',
    'className="rounded-r-lg"',
    'className="border-l"',
    'className="border-r-2"',
    'className="float-left"',
  ])('flags physical class in %s', (line) => {
    expect(checkLine(tsx, 1, line).length).toBeGreaterThan(0);
  });

  it.each([
    'className="ms-4 me-2 ps-6 pe-3"',
    'className="start-0 end-4"',
    'className="text-start text-end"',
    'className="rounded-s rounded-e-lg border-s border-e-2"',
    'className="rounded-lg"',
    'className="scroll-pl-4"',
    'const rightSide = 1',
    'className="text-primary"',
  ])('allows logical or unrelated %s', (line) => {
    expect(checkLine(tsx, 1, line)).toEqual([]);
  });

  it('skips lines marked rtl-allow', () => {
    expect(checkLine(tsx, 1, 'className="right-6" // rtl-allow: WhatsApp widget (§6.15)')).toEqual(
      [],
    );
  });

  it('flags physical css properties in css files', () => {
    expect(checkLine('src/styles/x.css', 1, '  margin-left: 4px;')[0]?.rule).toBe('physical-css');
    expect(checkLine('src/styles/x.css', 1, '  text-align: right;')[0]?.rule).toBe('physical-css');
    expect(checkLine('src/styles/x.css', 1, '  left: 0;')[0]?.rule).toBe('physical-css');
    expect(checkLine('src/styles/x.css', 1, '  inset-inline-start: 0;')).toEqual([]);
    expect(checkLine('src/styles/x.css', 1, '  text-align: start;')).toEqual([]);
  });

  it('flags raw hex in tsx but not in globals.css or product colour data', () => {
    expect(checkLine(tsx, 1, 'style={{ color: "#0058B0" }}')[0]?.rule).toBe('raw-hex');
    expect(checkLine('src/styles/globals.css', 1, '--color-primary: #0058B0;')).toEqual([]);
    expect(checkLine('src/content/products.ts', 1, 'hex: "#F5F5DC",')).toEqual([]);
  });

  it('reports line numbers', () => {
    const v = checkSource(tsx, 'ok\nclassName="ml-1"\nok');
    expect(v).toHaveLength(1);
    expect(v[0]?.line).toBe(2);
  });
});
