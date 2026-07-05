import { Loader2, Mic, MicOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type AudioCaptureStatus,
  type UseAudioCaptureOptions,
  useAudioCapture,
} from "@/hooks/useAudioCapture";
import { cn } from "@/lib/utils";

export interface AudioRecorderButtonProps {
  captureOptions?: Omit<UseAudioCaptureOptions, "onTranscription">;
  onTranscription?: (text: string) => void;
  className?: string;
}

const STATUS_LABELS: Record<AudioCaptureStatus, string> = {
  idle: "Click to record",
  recording: "Recording… click to stop",
  error: "Error, try again",
};

const STATUS_ICONS: Record<AudioCaptureStatus, React.ReactNode> = {
  idle: <Mic className="size-4" />,
  recording: (
    <div className="flex items-center gap-1">
      <span className="size-2 rounded-full bg-red-500 animate-pulse" />
      <MicOff className="size-3.5" />
    </div>
  ),
  error: <Mic className="size-4 text-destructive" />,
};

export function AudioRecorderButton({
  captureOptions,
  onTranscription,
  className,
}: AudioRecorderButtonProps) {
  const {
    status,
    error,
    isSupported,
    startRecording,
    stopRecording,
    permission,
  } = useAudioCapture({
    ...captureOptions,
    onTranscription,
  });

  const handleClick = async () => {
    if (status === "recording") {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  if (!isSupported) {
    return (
      <span
        title="Speech recognition not supported in this browser"
        className="inline-flex"
      >
        <Button
          variant="ghost"
          size="icon"
          disabled
          className={cn("size-7 opacity-30", className)}
        >
          <Mic className="size-4" />
        </Button>
      </span>
    );
  }

  const isBlocked = permission === "denied" && status !== "recording";
  const label = isBlocked
    ? "Microphone blocked — click to request access"
    : error || STATUS_LABELS[status];

  return (
    <span title={label} className="inline-flex">
      <Button
        variant={isBlocked ? "outline" : status === "recording" ? "destructive" : "secondary"}
        size="icon"
        className={cn(
          "size-7 relative",
          status === "recording" && "animate-pulse",
          className,
        )}
        onClick={handleClick}
      >
        {isBlocked ? <TriangleAlert className="size-3.5 text-warning" /> : STATUS_ICONS[status]}
      </Button>
    </span>
  );
}
