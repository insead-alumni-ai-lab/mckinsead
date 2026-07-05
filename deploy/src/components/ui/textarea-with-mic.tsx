import { forwardRef } from "react";
import { AudioRecorderButton } from "@/components/AudioRecorderButton";
import { Textarea } from "@/components/ui/textarea";
import type { UseAudioCaptureOptions } from "@/hooks/useAudioCapture";
import { cn } from "@/lib/utils";

export interface TextareaWithMicProps
  extends React.ComponentProps<typeof Textarea> {
  /** Called when voice transcription is complete */
  onTranscription?: (text: string) => void;
  /** Options for audio capture */
  captureOptions?: Omit<UseAudioCaptureOptions, "onTranscription">;
}

export const TextareaWithMic = forwardRef<
  HTMLTextAreaElement,
  TextareaWithMicProps
>(function TextareaWithMic(
  { className, onTranscription, captureOptions, ...props },
  ref,
) {
  return (
    <div className="relative">
      <Textarea ref={ref} className={cn("pr-9", className)} {...props} />
      <div className="absolute bottom-1.5 right-1.5">
        <AudioRecorderButton
          captureOptions={captureOptions}
          onTranscription={onTranscription}
        />
      </div>
    </div>
  );
});
