import { kv } from '@vercel/kv'
import { get } from '@vercel/edge-config'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.CF_AI_GATEWAY || 'https://api.openai.com/v1',
})

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const user = (await auth())?.user
  const userId = user?.id;

  if (!user || !userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const aw = (await get('aw')) as string[]
  let model = 'gpt-3.5-turbo-1106';
  console.log('xxx', user.email, userId)
  if (user.email && aw?.includes(user.email)) {
    openai.apiKey = process.env.AW_OPENAI_API_KEY || '';
    model = 'gpt-4-1106-preview'
  } else if (previewToken) {
    openai.apiKey = previewToken
  }

  const res = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
    }
  })

  return new StreamingTextResponse(stream)
}
