import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, products } from '@/content/products';
import { productMetadata } from '@/modules/core';
import { ProductPage } from '@/modules/products';

interface Params {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return productMetadata(product);
}

export default async function ProductRoute({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductPage product={product} />;
}
