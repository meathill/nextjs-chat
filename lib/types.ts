import { type Message } from 'ai'

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export type Subtitle = {
  Text: string,
  BeginTime: number,
  EndTime: number,
  BeginIndex: number,
  EndIndex: number,
}
