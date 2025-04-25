import ShareFallbackClient from './client';

// This function is required for Next.js static exports with the App Router
// It tells Next.js to statically generate this route
export async function generateStaticParams() {
  // We don't have any dynamic segments in this route
  // Just generate one static version of this page
  return [{}];
}

// Server component for the share-fallback page
// Static export will generate this, and the client component will handle the rest
export default function ShareFallbackPage() {
  return <ShareFallbackClient />;
} 