// api/seriesly-ai.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Método não permitido. Use POST."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      reply:
        "A IA do Seriesly ainda não está configurada. Em breve estará disponível."
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(200).json({
        reply: "Por favor, escreva sua dúvida para que eu possa ajudar."
      });
    }

    const mappedHistory = Array.isArray(history)
      ? history.slice(-10).map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text || ""
        }))
      : [];

    const systemMessage = {
      role: "system",
      content:
        "Você é o assistente do Seriesly. Responda sempre de forma clara, útil e educada. " +
        "Foque em ajudar com dúvidas sobre login, planos, salvar links, buscar perfis e uso geral do app."
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          systemMessage,
          ...mappedHistory,
          { role: "user", content: message }
        ],
        max_output_tokens: 300,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      console.error("ERRO NA OPENAI:", await response.text());

      return res.status(200).json({
        reply:
          "A IA do Seriesly está temporariamente indisponível. Tente novamente em alguns instantes."
      });
    }

    const data = await response.json();
    const reply =
      data?.output?.[0]?.content?.[0]?.text?.trim() ||
      "No momento não consegui gerar uma resposta, tente novamente.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("ERRO NO SERVIDOR SERIESLY:", error);

    return res.status(200).json({
      reply:
        "A IA do Seriesly está temporariamente indisponível. Já estamos trabalhando para normalizar."
    });
  }
}
