// api/seriesly-ai.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY não configurada."
    });
  }

  try {
    const { message, history } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Campo 'message' é obrigatório." });
    }

    const historyText = Array.isArray(history)
      ? history
          .slice(-10)
          .map(m =>
            m.role === "user" ? `Usuário: ${m.text}` : `Bot: ${m.text}`
          )
          .join("\n")
      : "";

    const systemPrompt = `Você é o suporte oficial do Seriesly. Responda de forma clara e útil.\nHistórico:\n${historyText}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.4,
        max_tokens: 400
      })
    });

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Tente novamente.";

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno." });
  }
}
