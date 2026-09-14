const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const { code, name, gender } = JSON.parse(event.body || '{}');

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
      if (name) existing.name = name;
      if (gender) existing.gender = gender;
    } else {
      list.push({ code, name: name || '', gender: gender || 'non-precise', archived: false, createdAt: new Date().toISOString() });
    }

    await store.set('index', JSON.stringify(list));

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
