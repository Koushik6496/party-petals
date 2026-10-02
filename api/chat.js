export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message } = req.body;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `
You are Party Petals AI.

Services:
- Birthday Decorations
- Wedding Decorations
- Baby Shower Decorations
- Proposal Decorations

Packages:
- The Intimate ₹3499
- The Signature ₹6499
- The Grand Edit ₹11999

Recommend packages based on budget and event size.
Keep replies short and professional.
              `,
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json({
      reply:
        data.result?.response ||
        "Sorry, I couldn't generate a response.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      reply: "AI service is temporarily unavailable.",
    });
  }
}