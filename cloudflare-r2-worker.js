/**
 * Cloudflare Worker for ID Card Studio
 * Handles:
 * 1. Cloudflare R2 Image Upload (POST /upload) & Serve (GET /photos/*)
 * 2. Static Assets (React frontend from /dist) with SPA Fallback
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Enable CORS for frontend requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Secret',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Upload Route: POST /upload
    if (request.method === 'POST' && url.pathname === '/upload') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const recordId = formData.get('recordId') || 'unknown';
        const orgId = formData.get('orgId') || 'global';

        if (!file || typeof file === 'string') {
          return new Response(JSON.stringify({ error: 'No image file uploaded' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const ext = file.name?.split('.').pop() || 'jpg';
        const key = `photos/${orgId}/${recordId}_${Date.now()}.${ext}`;

        // Save to Cloudflare R2 Bucket
        await env.MY_BUCKET.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type || 'image/jpeg',
            cacheControl: 'public, max-age=31536000',
          },
        });

        // Generate public access URL
        const publicUrl = env.PUBLIC_CDN_URL
          ? `${env.PUBLIC_CDN_URL}/${key}`
          : `${url.origin}/${key}`;

        return new Response(
          JSON.stringify({
            success: true,
            key,
            url: publicUrl,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Serve R2 Photos: GET /photos/...
    if (request.method === 'GET' && url.pathname.startsWith('/photos/')) {
      const key = url.pathname.slice(1);
      const object = await env.MY_BUCKET.get(key);

      if (!object) {
        return new Response('Photo Not Found', { status: 404, headers: corsHeaders });
      }

      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new Response(object.body, { headers });
    }

    // 3. Static Assets: Serve React Frontend from /dist
    if (env.ASSETS) {
      let response = await env.ASSETS.fetch(request);
      // SPA Fallback: if 404 and is a navigation route (no file extension), return index.html
      if (response.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
        response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return response;
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
