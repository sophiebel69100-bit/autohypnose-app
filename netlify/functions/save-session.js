const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const { code, clientName, script, audio } = JSON.parse(event.body || '{}');

    if (!code || !audio) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Code ou audio manquant.' }) };
    }

    const store = getStore('sessions');
    await store.set(
      code,
      JSON.stringify({ clientName, script, audio, createdAt: new Date().toISOString() })
    );

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
