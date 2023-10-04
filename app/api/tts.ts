import { put } from '@vercel/blob';
import { tts } from 'tencentcloud-sdk-nodejs-tts';
import { TextToVoiceResponse } from "tencentcloud-sdk-nodejs-tts/tencentcloud/services/tts/v20190823/tts_models";

import { auth } from '@/auth';

const TtsClient = tts.v20190823.Client;
const clientConfig = {
  region: 'ap-guangzhou',
  profile: {
    httpProfile: {
      endpoint: 'tts.tencentcloudapi.com',
    },
  },
};

export async function defineEventHandler(req: Request) {
  const userId = (await auth())?.user.id;

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const body = await req.json();

  const client = new TtsClient({
    ...clientConfig,
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
  });
  const params = {
    Text: body.text,
    SessionId: body.uuid,
    VoiceType: body.voiceType,
    Speed: body.speed,
    Codec: 'mp3',
    Volume: body.volume || 0,
    EmotionCategory: body.emotionCategory,
    EmotionIntensity: body.emotionIntensity,
    EnableSubtitle: body.enableSubtitle,
  };
  let voice: TextToVoiceResponse;
  try {
    voice = (await client.TextToVoice(params)) as TextToVoiceResponse;
  } catch (e) {
    return new Response('Failed to TTS.' + ((e as Error).message || e), {
      status: 400,
    });
  }

  const audio = voice.Audio;
  const raw = atob(audio as string);
  const rawLength = raw.length;
  const array = new Uint8Array(new ArrayBuffer(rawLength));
  for (let i = 0; i < rawLength; i++) {
    array[ i ] = raw.charCodeAt(i);
  }
  const blob = new Blob([array], { type: 'audio/mp3' });
  const fileName = await put(body.uuid + '.mp3', blob, { access: 'public' });

  return Response.json({
    code: 0,
    data: {
      Subtitles: voice.Subtitles,
      fileName,
    },
  });
}
