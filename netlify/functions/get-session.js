const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const code = (event.queryStringParameters || {}).code;

    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Code manquant.' }) };
    }

    const store = getStore('sessions');
    const raw = await store.get(code);

    if (!raw) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Code introuvable.' }) };
    }

    return { statusCode: 200, body: raw };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
