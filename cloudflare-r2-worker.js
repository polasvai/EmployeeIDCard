/**
 * Cloudflare Worker for ID Card Studio - Cloudflare R2 Image Storage
 * 
 * Instructions:
 * 1. Log in to Cloudflare Dashboard -> R2 -> Create Bucket (e.g. "id-card-photos")
 * 2. Create a new Worker (e.g. "idcard-photo-storage")
 * 3. In Worker Settings -> Variables -> R2 Bucket Bindings:
 *    - Variable Name: MY_BUCKET
 *    - R2 Bucket: id-card-photos
 * 4. Paste this code into the Worker editor and click Deploy!
 * 5. Set VITE_CLOUDFLARE_WORKER_UPLOAD_URL in your .env file to your worker URL:
 *    https://idcard-photo-storage.<your-subdomain>.workers.dev/upload
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
        // If you have a custom domain on R2, use it; otherwise use the worker serve route
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

    // 2. Serve Image Route: GET /photos/...
    if (request.method === 'GET') {
      const key = url.pathname.slice(1);
      const object = await env.MY_BUCKET.get(key);

      if (!object) {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new Response(object.body, { headers });
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  },
};
