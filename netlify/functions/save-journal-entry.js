const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const { code, text } = JSON.parse(event.body || '{}');

    if (!code || !text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Code ou texte manquant.' }) };
    }

    const store = getStore('journals');
    let entries = [];
    const raw = await store.get(code);
    if (raw) {
      try { entries = JSON.parse(raw); } catch (e) { entries = []; }
    }

    entries.push({ text: text.trim(), date: new Date().toISOString() });
    await store.set(code, JSON.stringify(entries));

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
