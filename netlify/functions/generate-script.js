exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    const { name, notes } = JSON.parse(event.body || '{}');

    if (!notes || !notes.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "L'analyse de suivi est vide." }) };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY n'est pas configurée sur ce site." }) };
    }

    const systemPrompt = `Tu écris pour une Neuro Praticienne (hypnose éricksonienne, PNL, breathwork hypnotique) un script d'auto-hypnose personnalisé, à lire à voix haute par elle-même face à son client.
Consignes strictes :
- Langue : français, vouvoiement, ton calme et posé, phrases courtes, rythme lent adapté à une lecture audio.
- Structure : induction douce (ancrage respiration/corps), approfondissement, travail métaphorique lié à la problématique décrite, suggestions positives personnalisées, retour progressif à l'éveil.
- Aucun terme médical, aucun diagnostic, aucune promesse de guérison.
- Inclue quelques indications de pauses entre crochets, ex. [pause] ou [respirez profondément], pour guider le rythme de lecture.
- Longueur : environ 500 à 650 mots.
- Réponds uniquement avec le texte du script, sans titre ni commentaire.`;

    const userPrompt = `Prénom du client : ${name && name.trim() ? name.trim() : 'le client'}\n\nAnalyse de suivi transmise par la praticienne :\n${notes}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Erreur du service de génération : ' + detail }) };
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');

    return {
      statusCode: 200,
      body: JSON.stringify({ script: textBlock ? textBlock.text.trim() : '' })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
