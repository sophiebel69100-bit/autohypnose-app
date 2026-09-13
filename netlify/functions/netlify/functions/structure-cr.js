exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    const { transcript } = JSON.parse(event.body || '{}');

    if (!transcript || !transcript.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Transcription vide.' }) };
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY n'est pas configurée sur ce site." }) };
    }

    const systemPrompt = `Tu aides une Neuro Praticienne (hypnose éricksonienne, PNL, breathwork hypnotique) à structurer ses notes de séance.
Elle vient de dicter à voix haute, en vrac, ce qui s'est passé pendant une séance avec un client. Voici la transcription brute de cette dictée.

Rédige un compte-rendu de séance clair et structuré, à usage strictement interne (jamais montré au client), avec ces sections :
- Contexte / motif de la séance
- Observations pendant la séance
- Techniques utilisées
- Réactions et ressentis du client
- Pistes pour la prochaine séance

Consignes :
- Français, ton professionnel et neutre (pas de tutoiement, c'est une note interne).
- Reformule et organise, ne te contente pas de recopier la transcription brute.
- N'invente aucune information qui ne serait pas dans la transcription.
- Aucun terme diagnostique ou médical formel, reste descriptif.
- Réponds uniquement avec le compte-rendu structuré, sans commentaire ni préambule.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: transcript }]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Erreur du service de génération : ' + detail }) };
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');

    return { statusCode: 200, body: JSON.stringify({ cr: textBlock ? textBlock.text.trim() : '' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
