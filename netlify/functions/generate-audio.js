exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    const { script } = JSON.parse(event.body || '{}');

    if (!script || !script.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Le script est vide.' }) };
    }
    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
      return { statusCode: 500, body: JSON.stringify({ error: "ELEVENLABS_API_KEY ou ELEVENLABS_VOICE_ID n'est pas configurée sur ce site." }) };
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(process.env.ELEVENLABS_VOICE_ID)}?output_format=mp3_44100_64`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.6, similarity_boost: 0.8 }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Erreur ElevenLabs : ' + detail }) };
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      statusCode: 200,
      body: JSON.stringify({ audio: 'data:audio/mpeg;base64,' + base64 })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
