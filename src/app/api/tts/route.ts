import { NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/elevenlabs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const audioBuffer = await textToSpeech(text);

    // Devolver el archivo binario como respuesta de audio
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error("TTS API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
