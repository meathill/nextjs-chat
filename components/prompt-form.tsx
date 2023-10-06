import { UseChatHelpers } from 'ai/react'
import { useRef, useEffect, useState } from 'react'
import Textarea from 'react-textarea-autosize'

import { Button, buttonVariants } from '@/components/ui/button'
import { IconArrowElbow, IconPlus, IconSpinner } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useSpeechToText } from '@/lib/hooks/use-speech-to-text'
import { cn } from '@/lib/utils'

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  onSubmit: (value: string, audioUrl?: string) => Promise<void>
  isLoading: boolean
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const audio = useRef<HTMLAudioElement>()
  const [isPlaying, setIsPlaying] = useState(false)

  const {
    isRecording,
    isConverting,
    isSending,
    promptText,
    audioUrl,
    doSpeechToText,
    doStopRecording,
    clearError
  } = useSpeechToText()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  useEffect(() => {
    if (promptText) {
      setInput(input + promptText)
    }
  }, [promptText])

  const onSttClick = async () => {
    if (isRecording) {
      doStopRecording()
    } else {
      clearError()
      await doSpeechToText()
    }
  }
  const doPlayVoice = async () => {
    if (!audio.current) {
      audio.current = new Audio()
      audio.current?.addEventListener('ended', () => {
        setIsPlaying(false)
      })
    }
    audio.current.src = audioUrl
    if (isPlaying) {
      audio.current.pause()
      setIsPlaying(false)
    } else {
      await audio.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        setInput('')
        await onSubmit(input, audioUrl)
      }}
      ref={formRef}
    >
      <div className="relative flex max-h-60 w-full grow flex-col bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onSttClick}
              className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'absolute left-0 top-4 h-8 w-8 rounded-full bg-background p-0 sm:left-4'
              )}
            >
              {isSending || isConverting ? (
                <IconSpinner className="animate-spin" />
              ) : isRecording ? (
                <i className="bi bi-stop-fill" />
              ) : (
                <i className="bi bi-mic-fill" />
              )}
              <span className="sr-only">Voice input</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Voice input</TooltipContent>
        </Tooltip>
        {audioUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={doPlayVoice}
                className={cn(
                  buttonVariants({ size: 'sm', variant: 'outline' }),
                  'absolute left-0 top-14 h-8 w-8 rounded-full bg-background p-0 sm:left-4'
                )}
              >
                {isPlaying ? (
                  <i className="bi bi-stop-fill" />
                ) : (
                  <i className="bi bi-play-fill" />
                )}
                <span className="sr-only">Play voice</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Play voice</TooltipContent>
          </Tooltip>
        )}
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message."
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        />
        <div className="absolute right-0 top-4 sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || input === ''}
              >
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
