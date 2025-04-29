import ShareViewClient from './client';

// Server component that handles static params
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export const dynamicParams = true;

export default function SharePage({ params }) {
  return <ShareViewClient id={params.id} />;
}