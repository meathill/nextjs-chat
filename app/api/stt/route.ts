import { put } from '@vercel/blob'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const form = await req.formData()
  const file = form.get('file') as File
  const id = nanoid()
  const uploaded = await put(id + '.wav', file, { access: 'public' })

  // stt
  const params: OpenAI.Audio.TranscriptionCreateParams = {
    file,
    model: 'whisper-1',
    language: 'en'
  }
  let response: OpenAI.Audio.Transcription
  try {
    response = await openai.audio.transcriptions.create(params)
  } catch (e) {
    return new Response('Failed to STT.' + ((e as Error).message || e), {
      status: 400
    })
  }

  return Response.json({
    code: 0,
    data: {
      text: response.text,
      url: uploaded.url
    }
  })
}
