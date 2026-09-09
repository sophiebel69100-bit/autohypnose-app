const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  connectLambda(event);
  const store = getStore('audio-jobs');
  let jobId;

  try {
    const body = JSON.parse(event.body || '{}');
    jobId = body.jobId;
    const scriptAvecPauses = script.replace(/\[[^\]]*\]/g, '<break time="1.5s" />');

    if (!script || !jobId) return;

    await store.set(jobId, JSON.stringify({ status: 'processing' }));

    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
      await store.set(jobId, JSON.stringify({ status: 'error', error: "Clés ElevenLabs manquantes sur ce site." }));
      return;
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(process.env.ELEVENLABS_VOICE_ID)}?output_format=mp3_44100_64`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: scriptAvecPauses,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.6, similarity_boost: 0.8, speed: 0.8 }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      await store.set(jobId, JSON.stringify({ status: 'error', error: 'Erreur ElevenLabs : ' + detail }));
      return;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    await store.set(jobId, JSON.stringify({ status: 'done', audio: 'data:audio/mpeg;base64,' + base64 }));
  } catch (err) {
    if (jobId) {
      try { await store.set(jobId, JSON.stringify({ status: 'error', error: err.message })); } catch (e) {}
    }
  }
};
