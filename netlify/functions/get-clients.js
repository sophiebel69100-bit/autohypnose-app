const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const store = getStore('clients');
    const raw = await store.get('index');
    const clients = raw ? JSON.parse(raw) : [];

    return { statusCode: 200, body: JSON.stringify({ clients }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
