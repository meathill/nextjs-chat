'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'

async function digestMessage(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message) // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8) // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)) // convert buffer to byte array
  // convert bytes to hex string
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(chat: Chat) {
  const session = await auth()

  if (!session?.user?.id || session.user.id !== chat.userId) {
    return {
      error: 'Unauthorized'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}

export async function setAudio(id: string, audio: string, content: string) {
  const session = await auth()
  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await getChat(id, session.user.id)
  if (!chat) {
    return {
      error: 'Unauthorized'
    }
  }

  const key = await digestMessage(content)

  await kv.hset(`chat:${id}:audio`, {
    [key]: audio
  })
}

export async function getAudios(id: string) {
  const session = await auth()
  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await getChat(id, session.user.id)
  if (!chat) {
    return {
      error: 'Unauthorized'
    }
  }

  return kv.hgetall(`chat:${id}:audio`)
}
