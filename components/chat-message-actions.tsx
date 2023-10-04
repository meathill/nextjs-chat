'use client'

import React from 'react';
import { type Message } from 'ai'

import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const [ isPlaying, setIsPlaying ] = React.useState(false);

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  const doPlay = async () => {
    setIsPlaying(true);
    const response = await fetch('/api/tts', {
      method: 'POST',
      body: JSON.stringify({
        text: message.content,
        uuid: crypto.randomUUID(),
        voiceType: 301027,
        speed: 0,
        emotionCategory: '',
        emotionIntensity: 100,
        EnableSubtitle: false,
      }),
    });
    const json = await response.json();
    console.log('xxx', json);
    setIsPlaying(false);
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-end transition-opacity group-hover:opacity-100 md:absolute md:-right-10 md:-top-2 md:opacity-0',
        className
      )}
      {...props}
    >
      <Button variant="ghost" size="icon" onClick={onCopy}>
        {isCopied ? <i className='bi bi-check' /> : <i className='bi bi-copy' />}
        <span className="sr-only">Copy message</span>
      </Button>
      <Button variant="ghost" size="icon" onClick={doPlay}>
        {isPlaying ? (
          <IconSpinner className="animate-spin" />
        ) : (
          <i className='bi bi-play-circle-fill' />
        )}
        <span className='sr-only'>Read message</span>
      </Button>
    </div>
  )
}
