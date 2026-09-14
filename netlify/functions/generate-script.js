exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    const { name, notes, gender, history } = JSON.parse(event.body || '{}');

    const notesPropres = (notes || '').trim();
    const historyPropre = (history || '').trim();

    if (!notesPropres && !historyPropre) {
      return { statusCode: 400, body: JSON.stringify({ error: "Aucune information disponible : ajoutez une note du jour, ou choisissez un client dont le dossier contient déjà un historique." }) };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY n'est pas configurée sur ce site." }) };
    }

    let consigneGenre = "Le genre du client n'est pas précisé : utilise des tournures neutres, en évitant les accords genrés (privilégie les formulations invariables plutôt que de choisir arbitrairement un genre).";
    if (gender === 'femme') {
      consigneGenre = "Le client est une femme : accorde tous les adjectifs et participes passés au féminin (ex. \"installée\", \"prête\", \"détendue\").";
    } else if (gender === 'homme') {
      consigneGenre = "Le client est un homme : accorde tous les adjectifs et participes passés au masculin (ex. \"installé\", \"prêt\", \"détendu\").";
    }

    const systemPrompt = `Tu écris pour une Neuro Praticienne (hypnose éricksonienne, PNL, breathwork hypnotique) un script d'auto-hypnose personnalisé, à lire à voix haute par elle-même face à son client.

Consigne d'accord grammatical : ${consigneGenre}

Consignes de langage hypnotique (à appliquer ensemble, selon la structure ci-dessous, pas isolément) :
- Pacing puis leading : commence par décrire ce qui est vraisemblablement vrai pour le client à cet instant (sa position, sa respiration, les sons ambiants), avant de le guider progressivement vers un nouvel état.
- Truismes : ouvre par des vérités évidentes et indiscutables pour construire l'accord inconscient dès les premières phrases.
- Suggestions indirectes et présuppositions plutôt que des ordres directs (ex. "tu pourrais remarquer" plutôt que "remarque", "à mesure que tu..." qui présuppose l'action en cours).
- Commandes enchâssées : insère naturellement, au fil des phrases, de courtes suggestions clés qui se détachent légèrement du reste (elle les fera ressortir à la lecture par le ton).
- Métaphore centrale : construis une image ou une petite histoire, adaptée à la problématique décrite, comme véhicule principal du travail thérapeutique pendant l'approfondissement.
- Double contrainte thérapeutique en fin de script : propose un choix illusoire entre deux options qui mènent toutes deux au résultat souhaité (ex. "que tu choisisses d'ouvrir les yeux maintenant, ou de savourer encore un instant ce calme avant de le faire").

Si un historique (journal du client et/ou comptes-rendus de séances précédentes) est fourni, base-toi dessus pour repérer les thèmes récurrents, l'évolution du client au fil du temps, et les points encore sensibles — c'est la source principale d'information si aucune note du jour n'est fournie. Si une note du jour est fournie en plus, elle vient préciser ou orienter le focus de cette séance en particulier.

Consignes de forme :
- Langue : français, tutoiement, ton calme et posé, phrases courtes, rythme lent adapté à une lecture audio.
- Aucun terme médical, aucun diagnostic, aucune promesse de guérison.
- Inclue quelques indications de pauses entre crochets, ex. [pause] ou [respirez profondément], pour guider le rythme de lecture.
- Longueur : environ 500 à 650 mots.
- Réponds uniquement avec le texte du script, sans titre ni commentaire.`;

    let userPrompt = `Prénom du client : ${name && name.trim() ? name.trim() : 'le client'}`;

    if (notesPropres) {
      userPrompt += `\n\nNote du jour transmise par la praticienne :\n${notesPropres}`;
    }

    if (historyPropre) {
      userPrompt += `\n\nHistorique disponible (journal du client et comptes-rendus des séances précédentes) :\n${historyPropre}`;
    }

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
