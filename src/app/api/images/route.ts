import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Only proxy requests to our Supabase instance for security
    if (!imageUrl.startsWith('https://njvgqybtgakgevnxmetf.supabase.co/')) {
      return new NextResponse('Forbidden target URL', { status: 403 });
    }

    const res = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        // Forward headers if needed, but simple GET is usually sufficient
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch image: ${imageUrl}. Status: ${res.status}`);
      return new NextResponse('Failed to fetch remote image', { status: res.status });
    }

    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
