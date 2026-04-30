import { useEffect, useRef, useState } from 'react';

interface Props {
  onTranscriptComplete: (transcript: string) => void;
  presetTranscript: string;
  routingTranscript?: string;
  disabled?: boolean;
  hint?: string;
}

export function DictationMic({
  onTranscriptComplete,
  presetTranscript,
  routingTranscript,
  disabled = false,
  hint,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const intervalRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (startTimeoutRef.current) window.clearTimeout(startTimeoutRef.current);
    };
  }, []);

  function handleStart() {
    setTranscript('');
    setRecording(true);
    startTimeoutRef.current = window.setTimeout(() => {
      let charIndex = 0;
      intervalRef.current = window.setInterval(() => {
        if (charIndex >= presetTranscript.length) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setRecording(false);
          onTranscriptComplete(routingTranscript ?? presetTranscript);
          return;
        }
        setTranscript(presetTranscript.slice(0, charIndex + 1));
        charIndex++;
      }, 22);
    }, 400);
  }

  function handleStop() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    setRecording(false);
    if (transcript.trim()) {
      onTranscriptComplete(routingTranscript ?? transcript);
    }
  }

  return (
    <div className="bg-arkana-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={recording ? handleStop : handleStart}
          disabled={disabled && !recording}
          title={disabled ? hint ?? 'Disabled' : ''}
          className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arkana-red focus-visible:ring-offset-2 ${
            recording
              ? 'bg-arkana-red text-white animate-pulse'
              : 'bg-white border border-arkana-gray-200 text-arkana-black hover:border-arkana-gray-500'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          🎙
        </button>
        <div className="flex-1 min-h-16 bg-white rounded-xl border border-arkana-gray-200 p-3 text-sm text-arkana-black">
          {transcript || (
            <span className="text-arkana-gray-500">
              {recording
                ? 'Listening…'
                : hint ?? 'Tap mic to dictate. Use bottle keywords (formalin, michel\'s, glute) to route automatically.'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
