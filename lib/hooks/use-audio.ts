import { useRef, useState } from 'react'

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement>()

  const play = async (audioUrl: string) => {
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

  return {
    isPlaying,
    play
  }
}
