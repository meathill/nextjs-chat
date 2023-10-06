'use client'

import { useState, ComponentProps, useEffect } from 'react'
import { type Message } from 'ai'

import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn, digestMessage } from '@/lib/utils'
import { useAudio } from '@/lib/hooks/use-audio'
import { ResponseBody } from '@/lib/types'
import { setAudio } from '@/app/actions'

interface ChatMessageActionsProps extends ComponentProps<'div'> {
  id: string
  message: Message
  audios: Record<string, string>
}

export function ChatMessageActions({
  id,
  message,
  audios,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const { play, isPlaying } = useAudio()
  const [isPlayingMyVoice, setIsPlayingMyVoice] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [voiceUrl, setVoiceUrl] = useState<string>('')

  useEffect(() => {
    digestMessage(message.content).then(hash => {
      if (audios[hash]) {
        setAudioUrl(audios[hash])
      }
    })
    digestMessage(message.content + ' // my voice').then(hash => {
      if (audios[hash]) {
        setVoiceUrl(audios[hash])
      }
    })
  }, [audios, message.content])

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  const doPlay = async () => {
    if (audioUrl) {
      return play(audioUrl)
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({
        text: message.content,
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
    setAudio(id, url, message.content)
    setAudioUrl(url)
    return play(url)
  }

  const doPlayMyVoice = () => {
    return play(voiceUrl)
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
      {voiceUrl && (
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
