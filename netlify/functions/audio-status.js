const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    connectLambda(event);
    const jobId = (event.queryStringParameters || {}).jobId;

    if (!jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'jobId manquant.' }) };
    }

    const store = getStore('audio-jobs');
    const raw = await store.get(jobId);

    if (!raw) {
      return { statusCode: 200, body: JSON.stringify({ status: 'processing' }) };
    }

    return { statusCode: 200, body: raw };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
