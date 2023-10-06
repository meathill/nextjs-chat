'use client'

import React from 'react'
import { type Message } from 'ai'

import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { useAudio } from '@/lib/hooks/use-audio'
import { ResponseBody } from '@/lib/types'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const { play, isPlaying } = useAudio()
  const [isPlayingMyVoice, setIsPlayingMyVoice] = React.useState(false)
  const [originalMessage, audio, myVoice] = message.content.split('//')

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(originalMessage)
  }

  const doPlay = async () => {
    if (audio) {
      return play(audio)
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({
        text: originalMessage,
        uuid: crypto.randomUUID(),
        voiceType: 301027,
        speed: 0,
        emotionCategory: '',
        emotionIntensity: 100,
        EnableSubtitle: false
      })
    })
    const json = (await response.json()) as ResponseBody<{ url: string }>
    if (!json.data) return
    const url = json.data.url
    return play(url)
  }

  const doPlayMyVoice = () => {
    return play(myVoice)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end md:absolute md:-right-10 md:bottom-0',
        className
      )}
      {...props}
    >
      <Button type="button" variant="ghost" size="icon" onClick={onCopy}>
        {isCopied ? (
          <i className="bi bi-check" />
        ) : (
          <i className="bi bi-copy" />
        )}
        <span className="sr-only">Copy message</span>
      </Button>
      {myVoice && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={doPlayMyVoice}
        >
          {isPlayingMyVoice ? (
            <IconSpinner className="animate-spin" />
          ) : (
            <i className="bi bi-headset" />
          )}
        </Button>
      )}
      <Button type="button" variant="ghost" size="icon" onClick={doPlay}>
        {isPlaying ? (
          <IconSpinner className="animate-spin" />
        ) : (
          <i className="bi bi-headset" />
        )}
        <span className="sr-only">Read message</span>
      </Button>
    </div>
  )
}
