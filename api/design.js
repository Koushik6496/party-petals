export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const prompt = String(req.body?.prompt || "").trim().slice(0, 1800);

    if (!prompt) {
      return res.status(400).json({
        error: "Please describe your event idea.",
      });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return res.status(503).json({
        error: "Cloudflare AI environment variables are not configured.",
      });
    }

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          steps: 8,
          seed: Math.floor(Math.random() * 1000000),
        }),
      }
    );

    const data = await cloudflareResponse.json();

    if (!cloudflareResponse.ok || data.success === false) {
      console.error("Cloudflare image error:", JSON.stringify(data));

      return res.status(cloudflareResponse.status || 502).json({
        error:
          data.errors?.[0]?.message ||
          "Cloudflare could not generate the concept image.",
      });
    }

    const base64Image = data.result?.image;

    if (!base64Image) {
      console.error("No image returned:", JSON.stringify(data));

      return res.status(502).json({
        error: "Cloudflare returned no generated image.",
      });
    }

    return res.status(200).json({
      image: `data:image/jpeg;charset=utf-8;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("Design API error:", error);

    return res.status(500).json({
      error: "Concept generation is temporarily unavailable.",
    });
  }
}