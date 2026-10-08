"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Asks the browser for the user's camera and microphone and exposes on/off toggles.
 *
 * Toggling sets track.enabled instead of stopping the track: a disabled track sends
 * black frames / silence, and turning it back on is instant with no new permission prompt.
 */
export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In development React runs effects twice; this flag stops a stale request from leaking a stream
    let cancelled = false;
    let acquired: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        acquired = mediaStream;
        setStream(mediaStream);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Camera or microphone unavailable. You can still join with your avatar.");
        setAudioOn(false);
        setVideoOn(false);
      });

    // Cleanup: release the camera (its light turns off) when leaving the page
    return () => {
      cancelled = true;
      acquired?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Apply the on/off state to the real tracks. As an effect it also covers a stream that
  // arrives after the state changed (new tracks always start enabled).
  useEffect(() => {
    stream?.getAudioTracks().forEach((track) => (track.enabled = audioOn));
    stream?.getVideoTracks().forEach((track) => (track.enabled = videoOn));
  }, [stream, audioOn, videoOn]);

  /** Stop the camera and mic right away, e.g. when the user clicks Leave.
   *  useCallback keeps the same function between renders, so effects can depend on it. */
  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  return {
    stream,
    error,
    audioOn: audioOn && stream !== null,
    videoOn: videoOn && stream !== null,
    toggleAudio: () => setAudioOn(!audioOn),
    toggleVideo: () => setVideoOn(!videoOn),
    setAudio: setAudioOn,
    stop,
  };
}
