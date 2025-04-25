import { redirect } from 'next/navigation';

// This function is required for Next.js static exports
// It pre-renders these specific routes at build time
export async function generateStaticParams() {
  return [
    { id: 'demo_share' },
    { id: 'demo_permalink' }
  ];
}

// This is a server component (no 'use client')
export default function SharePage({ params }) {
  // For static exports, client-side redirect will happen in a script
  return (
    <html>
      <head>
        <title>Redirecting to Shared Weight Tracker</title>
        {/* Add meta refresh as a fallback */}
        <meta httpEquiv="refresh" content={`0;url=/share-fallback#/share/${params.id}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Script to redirect to the fallback page
              window.location.href = "/share-fallback#/share/${params.id}";
            `,
          }}
        />
      </head>
      <body>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1>Redirecting...</h1>
            <p>Please wait while we redirect you to the shared weight tracker.</p>
            <p>If you are not redirected automatically, <a href={`/share-fallback#/share/${params.id}`}>click here</a>.</p>
          </div>
        </div>
      </body>
    </html>
  );
} 