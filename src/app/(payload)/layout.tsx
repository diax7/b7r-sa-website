import config from '@payload-config';
import '@payloadcms/next/css';
import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import { importMap } from './admin/importMap.js';
import './admin.css';

/** The weights the panel uses on every screen; preloaded so no page paints in the fallback. */
const ADMIN_FONT_WEIGHTS = ['Regular', 'Medium', 'Bold'] as const;

type Args = { children: ReactNode };

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

/** Payload's root layout (the admin at /admin, English or Arabic RTL, BRD 9.3). Do not edit beyond the imports. */
export default function PayloadLayout({ children }: Args) {
  for (const weight of ADMIN_FONT_WEIGHTS) {
    preload(`/fonts/ITFRayatRound-${weight}.woff2`, {
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    });
  }
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
