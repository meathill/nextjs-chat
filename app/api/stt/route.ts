import { put } from '@vercel/blob';
import { asr } from 'tencentcloud-sdk-nodejs-asr';
import { SentenceRecognitionResponse } from 'tencentcloud-sdk-nodejs-asr/tencentcloud/services/asr/v20190614/asr_models';

import { auth } from '@/auth';
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const AsrClient = asr.v20190614.Client;
const clientConfig = {
  region: '',
  profile: {
    httpProfile: {
      endpoint: 'asr.tencentcloudapi.com',
    },
  },
};

export async function POST(req: Request) {
  const userId = (await auth())?.user.id;

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const form = await req.formData();
  const file = form.get('file') as File;
  const fileContent = await file.text();
  const id = nanoid();
  const fileName = await put(id + '.wav', file, { access: 'public' });

  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;

  // stt
  const client = new AsrClient({
    ...clientConfig,
    credential: {
      secretId,
      secretKey,
    },
  });
  const params = {
    EngSerViceType: '16k_zh',
    SourceType: 1,
    Data: fileContent,
    VoiceFormat: 'wav',
    SubServiceType: 2,
    UsrAudioKey: 'xxx',
  };
  let response: SentenceRecognitionResponse;
  try {
    response = await client.SentenceRecognition(params);
  } catch (e) {
    return new Response('Failed to STT.' + ((e as Error).message || e), {
      status: 400,
    });
  }

  return Response.json({
    code: 0,
    data: {
      ...response,
      fileName,
    },
  });
}
