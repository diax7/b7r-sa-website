import config from '@payload-config';
import '@payloadcms/next/css';
import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import { getAppearance, preloadsFor, typefaceCss } from '@/modules/brand';
import { importMap } from './admin/importMap.js';
import './admin.css';

/** The weights the panel uses on every screen; preloaded so no page paints in the fallback. */
const ADMIN_FONT_WEIGHTS = [400, 500, 700] as const;

type Args = { children: ReactNode };

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

/**
 * Payload's root layout (the admin at /admin, English or Arabic RTL, BRD 9.3). Do not edit
 * beyond the imports and the typeface: the panel's colours are its own (ADR-039), its
 * typeface is the site's (spec 010, decision 7), so the one style block here carries
 * `--font-sans` alone. React hoists it into the head Payload's layout owns.
 */
export default async function PayloadLayout({ children }: Args) {
  const { typeface } = await getAppearance();
  for (const href of preloadsFor(typeface, ADMIN_FONT_WEIGHTS)) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      <style href="appearance-typeface" precedence="default">
        {typefaceCss(typeface)}
      </style>
      {children}
    </RootLayout>
  );
}
