export async function GET(request) {
  // We'll create this as a placeholder API route
  // For static export, the route won't actually be called
  // but having it defined will help with Next.js build
  try {
    const searchParams = new URL(request.url).searchParams;
    const shareId = searchParams.get('id');

    if (!shareId) {
      return new Response(
        JSON.stringify({ success: false, message: 'No share ID provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In a real server-side app, we would fetch from a database
    // For our static export, we'll return a placeholder
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'This API route is not available in static exports. Data is loaded client-side.' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 