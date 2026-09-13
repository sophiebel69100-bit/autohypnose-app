const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const { code, name } = JSON.parse(event.body || '{}');

    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Code manquant.' }) };
    }

    const store = getStore('clients');
    let list = [];
    const raw = await store.get('index');
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }

    const existing = list.find((c) => c.code === code);
    if (existing) {
      existing.name = name || existing.name;
    } else {
      list.push({ code, name: name || '', createdAt: new Date().toISOString() });
    }

    await store.set('index', JSON.stringify(list));

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
