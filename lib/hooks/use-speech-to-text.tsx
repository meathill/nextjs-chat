import { useState, useRef } from 'react'
import { ResponseBody } from '@/lib/types'

type SttResponse = {
  text: string
  url: string
}

export function useSpeechToText() {
  const [isRecording, setIsRecording] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [promptText, setPromptText] = useState<string>('')
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [error, setError] = useState<string>()
  const audioBlob = useRef<Blob>()
  const recordedChunks = useRef<BlobPart[]>([])
  const mediaRecorder = useRef<MediaRecorder>()

  async function doSpeechToText(): Promise<void> {
    let stream: MediaStream | null = null
    recordedChunks.current.length = 0
    const constraints = { audio: true }
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (e) {
      setError("Sorry, your browser doesn't support voice input.")
      return
    }

    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    mediaRecorder.current.addEventListener('dataavailable', function (event) {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data)
      }
    })
    mediaRecorder.current.addEventListener('stop', function () {
      audioBlob.current = new Blob(recordedChunks.current, {
        type: 'audio/webm;codecs=opus'
      })
      stream?.getTracks().forEach(track => track.stop())
      stream = null

      // send audio to whisper
      upload()
    })

    setIsRecording(true)
    mediaRecorder.current.start()
  }

  function doStopRecording(): void {
    mediaRecorder.current?.stop()
    mediaRecorder.current = undefined
    setIsConverting(true)
    setIsRecording(false)
  }

  async function upload(): Promise<void> {
    if (!audioBlob.current) {
      return
    }

    const formData = new FormData()
    formData.append('file', audioBlob.current, 'audio.webm')
    formData.append('language', 'en')
    setIsSending(true)
    const response = await fetch('/api/stt', {
      method: 'POST',
      body: formData
    })
    const json = (await response.json()) as ResponseBody<SttResponse>
    if (json?.data) {
      const { text, url } = json.data
      setPromptText(text)
      setAudioUrl(url)
    }
    setIsSending(false)
    setIsRecording(false)
    setIsConverting(false)
  }

  function clearError(): void {
    setError('')
  }

  return {
    isRecording,
    isConverting,
    isSending,
    error,
    promptText,
    audioUrl,
    doSpeechToText,
    doStopRecording,
    clearError
  }
}
