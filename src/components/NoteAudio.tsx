'use client';

import { Play, SquareIcon, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause } from 'lucide-react';
import { AudioVisualizer } from 'react-audio-visualize';

import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useAudioPlayer } from '../hooks/audioPlayer/useAudioPlayer';
import { NoteLiveAudioVisualizer } from './NoteLiveAudioVisualizer';
import { useAudioRecorderAlt } from '@/hooks/useAudioRecAlt';

type NoteAudioModProps = {
  showNudge?: boolean;
  className?: string;
  onAudioChange?: (blob: Blob | null) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  initialAudioUrl?: string;
  disabled?: boolean;
};

export function NoteAudio({
  className,
  onAudioChange,
  onLoadingChange,
  initialAudioUrl,
  disabled = false,
}: NoteAudioModProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayedBlob, setDisplayedBlob] = useState<Blob | null>(null);

  const {
    audioUrl,
    isRecording,
    releaseResources,
    startRecording,
    mediaRecorder,
    togglePauseResume,
    recordingBlob,
    status,
    currentDeviceLabel,
    stopRecording,
  } = useAudioRecorderAlt();

  const {
    isPlaying,
    play,
    pause,
    isReady,
    loadAudio: loadAudioPlayer,
    disposeAudioResources,
    isLoading,
    currentTime,
  } = useAudioPlayer();

  // Handle initial audio if provided
  useEffect(() => {
    if (initialAudioUrl) {
      loadAudioPlayer(initialAudioUrl);
    }
  }, [initialAudioUrl, loadAudioPlayer]);

  // sync the displayed blob with the audio blob
  useEffect(() => {
    console.log('recordingBlob', recordingBlob);
    if (recordingBlob) {
      console.log('setting displayed blob');
      setDisplayedBlob(recordingBlob);
    }
  }, [recordingBlob]);

  // Notify parent component when audio changes
  useEffect(() => {
    disposeAudioResources();
    if (audioUrl && recordingBlob) {
      loadAudioPlayer(audioUrl);
      onAudioChange?.(recordingBlob);
    }
  }, [
    audioUrl,
    disposeAudioResources,
    loadAudioPlayer,
    onAudioChange,
    recordingBlob,
  ]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Handle errors
  // useEffect(() => {
  //   if (isError) {
  //     toast.error(error?.message);
  //   }
  // }, [isError, error]);

  const handleReset = () => {
    releaseResources();
    disposeAudioResources();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onAudioChange?.(null);
    setDisplayedBlob(null);
  };

  const handleToggleRecording = () => {
    if (status === 'idle') {
      startRecording();
    } else {
      console.log('togglePauseResume');
      togglePauseResume();
    }
  };

  const recordingUrl = useMemo(() => {
    if (recordingBlob) {
      return URL.createObjectURL(recordingBlob);
    }
    return null;
  }, [recordingBlob]);

  const togglePlayPause = () => {
    console.log('togglePlayPause');
    if (isPlaying) {
      console.log('pausing');
      pause();
    } else {
      console.log('playing');
      play();
    }
  };

  return (
    <div
      className={cn(
        'flex max-w-full flex-col items-center gap-4 p-4',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1',
          isRecording ? 'bg-green-500 bg-opacity-20' : ''
        )}
      >
        <div className='h-3 w-3 rounded-full bg-primary' />
        {isRecording ? 'Grabando' : 'En espera'}
      </div>
      <pre>
        {JSON.stringify(
          {
            Mic: currentDeviceLabel,
            status,
            mediaRecorder: mediaRecorder?.mimeType,
            recorderStatus: mediaRecorder?.state,
            blobUrl: audioUrl?.slice(-5),
            displayedBlob: displayedBlob?.size,
            isReady,
          },
          null,
          2
        )}
      </pre>
      <div
        className={cn('relative h-24 w-48 max-w-full rounded-md bg-indigo-100')}
      >
        <NoteLiveAudioVisualizer
          className={cn(`absolute inset-0 mx-auto overflow-hidden`, {
            'opacity-100': isRecording,
            'opacity-0': status === 'paused',
          })}
          status={status}
          mediaRecorder={mediaRecorder}
        />
        {displayedBlob && (
          <AudioVisualizer
            barPlayedColor='hsl(230 100% 62%)'
            currentTime={currentTime}
            blob={displayedBlob}
            width={640}
            height={240}
            style={{
              width: '100%',
              height: '100%',
              opacity: !displayedBlob || isRecording ? 0 : 1,
              transition: 'opacity 1s ease-in-out',
            }}
          />
        )}
      </div>
      <div className='flex max-w-md items-center gap-4'>
        <Button
          className='flex h-10 w-10 items-center justify-center rounded-full bg-primary p-2 text-primary-foreground'
          onClick={togglePlayPause}
          // disabled={!isReady || disabled}
        >
          {isPlaying ? (
            <Pause className='h-4 w-4' />
          ) : (
            <Play className='h-4 w-4' />
          )}
        </Button>

        <Button
          className='flex items-center justify-center rounded-full bg-primary p-2 text-primary-foreground'
          onClick={handleToggleRecording}
        >
          {isRecording ? 'Pause' : 'Record'}
        </Button>

        <Button
          className='flex h-10 w-10 items-center justify-center rounded-full bg-primary p-2 text-primary-foreground'
          onClick={handleReset}
          disabled={!isReady || disabled}
        >
          <Trash2 size={20} />
        </Button>
      </div>
      <Button
        className='flex h-10 w-10 items-center justify-center rounded-full bg-primary p-2 text-primary-foreground'
        onClick={stopRecording}
      >
        <SquareIcon size={20} />
      </Button>
      {recordingUrl && <audio src={recordingUrl} controls />}
      {recordingUrl && (
        <a href={recordingUrl} download='audio.webm'>
          Download
        </a>
      )}
    </div>
  );
}
