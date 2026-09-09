const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event) => {
  connectLambda(event);
  const store = getStore('audio-jobs');
  let jobId;

  try {
    const body = JSON.parse(event.body || '{}');
    jobId = body.jobId;
    const script = body.script;

    if (!script || !jobId) return;

    const scriptAvecPauses = script.replace(/\[[^\]]*\]/g, '<break time="1.5s" />');

    await store.set(jobId, JSON.stringify({ status: 'processing' }));

    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
      await store.set(jobId, JSON.stringify({ status: 'error', error: "Clés ElevenLabs manquantes sur ce site." }));
      return;
    }

    const morceaux = scriptAvecPauses.split(/\n\s*\n/).map(m => m.trim()).filter(m => m.length > 0);
    const buffers = [];

    for (const morceau of morceaux) {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(process.env.ELEVENLABS_VOICE_ID)}?output_format=mp3_44100_64`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: morceau,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.8, similarity_boost: 0.85, use_speaker_boost: true, speed: 0.9 }
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        await store.set(jobId, JSON.stringify({ status: 'error', error: 'Erreur ElevenLabs : ' + detail }));
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      buffers.push(Buffer.from(arrayBuffer));
    }

    const audioComplet = Buffer.concat(buffers);
    const base64 = audioComplet.toString('base64');
    await store.set(jobId, JSON.stringify({ status: 'done', audio: 'data:audio/mpeg;base64,' + base64 }));
  } catch (err) {
    if (jobId) {
      try { await store.set(jobId, JSON.stringify({ status: 'error', error: err.message })); } catch (e) {}
    }
  }
};
