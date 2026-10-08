"use client";

import { useEffect, useRef, useState } from "react";

import { meetingSocketUrl } from "@/lib/api";
import type { Participant, ServerMessage } from "@/lib/types";

type Options = {
  enabled: boolean; // connect only once the user has clicked Join
  code: string;
  passcode: string;
  displayName: string;
  userId: number | null; // only the host sends this
  audio: boolean;
  video: boolean;
};

/** Connects to the meeting WebSocket and keeps the live participant list in state. */
export function useMeetingSocket({ enabled, code, passcode, displayName, userId, audio, video }: Options) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Latest mic/camera state, read when the join message is sent.
  // A ref (not an effect dependency) so toggling the mic doesn't reconnect the socket.
  const mediaRef = useRef({ audio, video });
  useEffect(() => {
    mediaRef.current = { audio, video };
  }, [audio, video]);

  useEffect(() => {
    if (!enabled) return;

    const socket = new WebSocket(meetingSocketUrl(code));
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "join",
          display_name: displayName,
          passcode,
          user_id: userId,
          ...mediaRef.current,
        }),
      );
    };

    socket.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      switch (message.type) {
        case "welcome":
          setSelfId(message.self_id);
          setParticipants(message.participants);
          break;
        case "participant_joined":
          setParticipants((list) => [...list, message.participant]);
          break;
        case "participant_updated":
          setParticipants((list) =>
            list.map((p) => (p.id === message.participant.id ? message.participant : p)),
          );
          break;
        case "participant_left":
          setParticipants((list) => list.filter((p) => p.id !== message.participant_id));
          break;
        case "error":
          setError(message.message);
          break;
      }
    };

    socket.onclose = () => setDisconnected(true);

    return () => {
      socket.onclose = null; // we're closing on purpose: don't report it as a lost connection
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, code, passcode, displayName, userId]);

  function sendMediaState(audioOn: boolean, videoOn: boolean) {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "media_state", audio: audioOn, video: videoOn }));
    }
  }

  return { participants, selfId, error, disconnected, sendMediaState };
}
