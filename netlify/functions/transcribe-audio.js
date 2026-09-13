exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    const { audio } = JSON.parse(event.body || '{}');

    if (!audio) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Audio manquant.' }) };
    }
    if (!process.env.ELEVENLABS_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "ELEVENLABS_API_KEY n'est pas configurée sur ce site." }) };
    }

    const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
    const buffer = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    formData.append('model_id', 'scribe_v2');
    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: formData
    });

    if (!response.ok) {
      const detail = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Erreur ElevenLabs : ' + detail }) };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify({ text: data.text || '' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
