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

    const store = getStore('journals');
    const raw = await store.get(code);
    const entries = raw ? JSON.parse(raw) : [];

    return { statusCode: 200, body: JSON.stringify({ entries }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
