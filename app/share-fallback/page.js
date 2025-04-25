import ShareFallbackClient from './client';

// Required for static generation with the App Router
export function generateStaticParams() {
  return [{}];
}

// Plain static version for pre-rendering
export default function ShareFallbackPage() {
  return (
    <div>
      <ShareFallbackClient />
    </div>
  );
} 