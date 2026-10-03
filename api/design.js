export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed.' });
  }

  try {
    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid request body.' });
      }
    }

    const prompt = String(body?.prompt || '').trim().slice(0, 1800);

    if (!prompt) {
      return res.status(400).json({ error: 'Please describe your event idea.' });
    }

    const accountId =
      process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;

    const apiToken =
      process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;

    if (!accountId || !apiToken) {
      return res.status(503).json({
        error: 'Cloudflare AI credentials are not configured.',
      });
    }

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
        prompt
        }),
      }
    );

    const contentType = cloudflareResponse.headers.get('content-type') || '';

    if (!cloudflareResponse.ok) {
      const errorText = await cloudflareResponse.text();
      let message = 'Cloudflare could not generate the concept image.';

      try {
        const errorData = JSON.parse(errorText);
        message =
          errorData?.errors?.[0]?.message ||
          errorData?.messages?.[0]?.message ||
          errorData?.error ||
          message;
      } catch {
        if (errorText.trim()) message = errorText.slice(0, 300);
      }

      console.error('Cloudflare image error:', cloudflareResponse.status, message);
      return res.status(cloudflareResponse.status).json({ error: message });
    }

    if (contentType.includes('application/json')) {
      const responseText = await cloudflareResponse.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Cloudflare returned invalid JSON:', responseText.slice(0, 300));
        return res.status(502).json({
          error: 'Cloudflare returned an unreadable image response.',
        });
      }

      const base64Image =
        data?.result?.image ||
        data?.image ||
        data?.result?.data?.image;

      if (!base64Image) {
        console.error('Cloudflare JSON contained no image:', JSON.stringify(data).slice(0, 500));
        return res.status(502).json({
          error: 'Cloudflare completed the request but returned no image.',
        });
      }

      return res.status(200).json({
        image: base64Image.startsWith('data:')
          ? base64Image
          : `data:image/jpeg;base64,${base64Image}`,
      });
    }

    if (contentType.startsWith('image/')) {
      const imageBuffer = Buffer.from(await cloudflareResponse.arrayBuffer());
      return res.status(200).json({
        image: `data:${contentType.split(';')[0]};base64,${imageBuffer.toString('base64')}`,
      });
    }

    const unexpected = await cloudflareResponse.text();
    console.error('Unexpected Cloudflare response:', contentType, unexpected.slice(0, 300));

    return res.status(502).json({
      error: 'Cloudflare returned an unsupported response format.',
    });
  } catch (error) {
    console.error('Design API error:', error);
    return res.status(500).json({
      error: error?.message || 'Concept generation is temporarily unavailable.',
    });
  }
}
