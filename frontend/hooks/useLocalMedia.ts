"use client";

import { useEffect, useState } from "react";

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

  function setAudio(on: boolean) {
    stream?.getAudioTracks().forEach((track) => (track.enabled = on));
    setAudioOn(on);
  }

  function setVideo(on: boolean) {
    stream?.getVideoTracks().forEach((track) => (track.enabled = on));
    setVideoOn(on);
  }

  /** Stop the camera and mic right away, e.g. when the user clicks Leave */
  function stop() {
    stream?.getTracks().forEach((track) => track.stop());
  }

  return {
    stream,
    error,
    audioOn: audioOn && stream !== null,
    videoOn: videoOn && stream !== null,
    toggleAudio: () => setAudio(!audioOn),
    toggleVideo: () => setVideo(!videoOn),
    setAudio,
    stop,
  };
}
