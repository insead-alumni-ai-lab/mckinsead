import { useCallback, useEffect, useRef, useState } from "react";

export type AudioCaptureStatus = "idle" | "recording" | "error";

export interface UseAudioCaptureOptions {
  language?: string;
  onTranscription?: (text: string) => void;
  onInterim?: (text: string) => void;
}

export interface UseAudioCaptureReturn {
  status: AudioCaptureStatus;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  permission: PermissionState | "unsupported";
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;

async function getMicPermission(): Promise<PermissionState> {
  try {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state;
  } catch {
    return "unsupported";
  }
}

export function useAudioCapture({
  language,
  onTranscription,
  onInterim,
}: UseAudioCaptureOptions = {}): UseAudioCaptureReturn {
  const [status, setStatus] = useState<AudioCaptureStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | "unsupported">("prompt");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onTranscriptionRef = useRef(onTranscription);
  const onInterimRef = useRef(onInterim);

  onTranscriptionRef.current = onTranscription;
  onInterimRef.current = onInterim;

  const isSupported = !!SpeechRecognitionAPI;

  useEffect(() => {
    getMicPermission().then(setPermission);
  }, []);

  const cleanup = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onstart = null;
      try { rec.abort(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.stop();
  }, []);

  const cancelRecording = useCallback(() => {
    setStatus("idle");
    setTranscript("");
    setError(null);
    cleanup();
  }, [cleanup]);

  const requestMicAccess = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPermission("granted");
      return true;
    } catch {
      const state = await getMicPermission();
      setPermission(state);
      if (state === "denied") {
        setError(
          'Microphone access is blocked in your browser settings. ' +
          'To enable it, click the lock/info icon next to the URL bar, ' +
          'find "Microphone", and change it to "Allow".'
        );
      } else {
        setError("Microphone access denied. Check your browser settings and try again.");
      }
      setStatus("error");
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser");
      setStatus("error");
      return;
    }

    setError(null);
    setTranscript("");
    cleanup();

    const granted = await requestMicAccess();
    if (!granted) return;

    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = true;
    if (language) rec.lang = language;

    rec.onstart = () => {
      setStatus("recording");
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      const text = final || interim;
      if (text) setTranscript(text);

      if (interim && onInterimRef.current) {
        onInterimRef.current(interim);
      }
      if (final && onTranscriptionRef.current) {
        onTranscriptionRef.current(final);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[useAudioCapture] Speech recognition error:", event.error);
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access denied."
          : `Speech recognition failed: ${event.error}`
      );
      setStatus("error");
    };

    rec.onend = () => {
      setStatus("idle");
    };

    recognitionRef.current = rec;
    rec.start();
  }, [language, cleanup, requestMicAccess]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    status,
    transcript,
    isSupported,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    permission,
  };
}
