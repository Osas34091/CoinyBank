const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;

// You can find voice IDs in the ElevenLabs dashboard. This is a generic pre-made voice ID.
const DEFAULT_VOICE_ID = "fjgAVa6FpNYGo4UpjqML"; // Ziggy (Cute little Australian character)

export const textToSpeech = async (text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<ArrayBuffer> => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API Key is missing");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2", // Better for Spanish (HackMTY)
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to generate speech from ElevenLabs");
  }

  return response.arrayBuffer();
};
