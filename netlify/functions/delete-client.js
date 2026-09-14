const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Code manquant.' }) };
    }

    const clientsStore = getStore('clients');
    let list = [];
    const raw = await clientsStore.get('index');
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }
    list = list.filter((c) => c.code !== code);
    await clientsStore.set('index', JSON.stringify(list));

    const sessionsStore = getStore('sessions');
    await sessionsStore.delete(code).catch(() => {});
    const journalsStore = getStore('journals');
    await journalsStore.delete(code).catch(() => {});
    const notesStore = getStore('notes');
    await notesStore.delete(code).catch(() => {});

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
