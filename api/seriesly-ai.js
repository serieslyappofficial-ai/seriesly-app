// api/seriesly-ai.js
// Endpoint usado pelo frontend em /api/seriesly-ai

export default async function handler(req, res) {
  // Aceita só POST
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Método não permitido. Use POST."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Se a variável não estiver configurada na Vercel
  if (!apiKey) {
    return res.status(200).json({
      reply:
        "A IA ainda não está configurada no servidor (OPENAI_API_KEY ausente). O bot local continua funcionando normalmente."
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(200).json({
        reply: "Preciso de uma mensagem de texto para ajudar você."
      });
    }

    // Converte o histórico salvo no navegador para o formato da API
    const mappedHistory = Array.isArray(history)
      ? history.slice(-10).map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text || ""
        }))
      : [];

    // Prompt de sistema para orientar a IA
    const systemMessage = {
      role: "system",
      content:
        "Você é o suporte oficial do Seriesly, um app que organiza links e perfis (principalmente vídeos de Instagram, TikTok, X). " +
        "Explique de forma simples e curta. Foque em: como salvar links, buscar perfis, planos Free/Premium/Lifetime, problemas de login e conta. " +
        "Responda sempre em português brasileiro, a não ser que o usuário escreva claramente em inglês."
    };

    // Chamada para a API nova de 'responses'
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
        max_output_tokens: 400,
        temperature: 0.4
      })
    });

    // Se a API respondeu com erro (sem crédito, etc.)
    if (!response.ok) {
      let errorMessage = "Erro ao conectar com a IA.";
      try {
        const errJson = await response.json();
        if (errJson && errJson.error && errJson.error.message) {
          errorMessage = errJson.error.message;
        }
      } catch (_) {
        // ignora erro de parse
      }

      return res.status(200).json({
        reply:
          "No momento não consegui falar com a IA na nuvem: " +
          errorMessage +
          " — você ainda pode usar as respostas básicas do bot aqui embaixo."
      });
    }

    // Lê o formato da API de responses
    const data = await response.json();
    const reply =
      data?.output?.[0]?.content?.[0]?.text?.trim() ||
      "Não consegui gerar uma resposta agora. Tente perguntar de outro jeito.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Erro em /api/seriesly-ai:", err);
    return res.status(200).json({
      reply:
        "Aconteceu um erro técnico ao falar com a IA. O bot local continua funcionando, mas as respostas inteligentes podem ficar fora do ar por alguns minutos."
    });
  }
}
