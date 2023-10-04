import { useState, useRef } from 'react';
import { Subtitle } from '../types';

export type TtsOptions = {
  text: string;
  uuid: string;
  voiceType: number;
  emotionCategory: string;
  emotionIntensity: number;
  speed: number;
  tencentSecretId: string;
  tencentSecretKey: string;
};

type EmotionOptions = {
  emotionCategory?: string;
  emotionIntensity?: number;
};

export default function useTextToSpeech() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const audioBlob = useRef<Blob>();
  const audioLink = useRef<string>('');

  async function doTTS({
    text,
    uuid,
    voiceType,
    emotionCategory,
    emotionIntensity,
    speed,
    tencentSecretId,
    tencentSecretKey,
  }: TtsOptions): Promise<void> {
    setError('');
    if (isSending) return;

    setIsSending(true);
    try {
      const emotion: EmotionOptions = {};
      if (emotionCategory) {
        emotion.emotionCategory = emotionCategory;
        emotion.emotionIntensity = emotionIntensity;
      }
      const response = await fetch((process.env.NEXT_PUBLIC_STT_HOST || '') + '/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          uuid,
          voiceType,
          speed,
          volume: 5,
          ...emotion,
          tencentSecretId,
          tencentSecretKey,
        }),
      });
      if (!response.ok) {
        setError('Upload failed. ' + response.statusText);
        setIsSending(false);
        return;
      }

      const result = (await response.json()) as { data: { Audio: string; Subtitles: Subtitle[] } };
      const audio = result.data.Audio;
      const raw = atob(audio);
      const rawLength = raw.length;
      const array = new Uint8Array(new ArrayBuffer(rawLength));
      for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      audioBlob.current = new Blob([array], { type: 'audio/ogg' });
      audioLink.current = URL.createObjectURL(audioBlob.current);
    } catch (e) {
      setError('TTS failed. ' + (e as Error).message);
      return;
    }
    setIsSending(false);
  }

  function clearError(): void {
    setError('');
  }

  return {
    isSending,
    error,
    audioBlob,
    audioLink,
    doTTS,
    clearError,
  };
}
