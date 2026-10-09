"use client";

import { useEffect, useRef, useState } from "react";

import { meetingSocketUrl } from "@/lib/api";
import type { Participant, ServerMessage } from "@/lib/types";

type Options = {
  enabled: boolean; // connect only once the user has clicked Join
  code: string;
  passcode: string;
  displayName: string;
  token: string | null; // login token if logged in; the server decides who is host
  audio: boolean;
  video: boolean;
  onForceMute: () => void; // called when the host mutes everyone
};

/** Connects to the meeting WebSocket and keeps the live participant list in state. */
export function useMeetingSocket(options: Options) {
  const { enabled, code, passcode, displayName, token, audio, video, onForceMute } = options;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endedReason, setEndedReason] = useState<"removed" | "ended" | "replaced" | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Latest callback, read inside socket events. A ref (not an effect dependency) so a
  // new function on every render doesn't reconnect the socket.
  const onForceMuteRef = useRef(onForceMute);
  useEffect(() => {
    onForceMuteRef.current = onForceMute;
  }, [onForceMute]);

  // Mic/camera state: kept in a ref for the join message (again, so toggling doesn't
  // reconnect), and sent to the server whenever it changes. That also covers the camera
  // only becoming ready after we've already joined.
  const mediaRef = useRef({ audio, video });
  useEffect(() => {
    mediaRef.current = { audio, video };
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "media_state", audio, video }));
    }
  }, [audio, video]);

  useEffect(() => {
    if (!enabled) return;

    const socket = new WebSocket(meetingSocketUrl(code));
    socketRef.current = socket;
    let welcomed = false;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "join",
          display_name: displayName,
          passcode,
          token,
          ...mediaRef.current,
        }),
      );
    };

    socket.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      switch (message.type) {
        case "welcome":
          welcomed = true;
          setSelfId(message.self_id);
          setIsHost(message.is_host);
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
        case "force_mute":
          onForceMuteRef.current();
          break;
        case "removed":
          setEndedReason("removed");
          break;
        case "meeting_ended":
          setEndedReason("ended");
          break;
        case "replaced":
          setEndedReason("replaced");
          break;
        case "error":
          // Before the welcome, an error means we weren't let in. After it, it's a
          // rejected command (e.g. removing someone who already left): not fatal.
          if (welcomed) console.warn(message.message);
          else setError(message.message);
          break;
      }
    };

    socket.onclose = () => setDisconnected(true);

    return () => {
      socket.onclose = null; // we're closing on purpose: don't report it as a lost connection
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, code, passcode, displayName, token]);

  function send(message: object) {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  return {
    participants,
    selfId,
    isHost, // confirmed by the server, not just claimed by the URL
    error,
    endedReason,
    disconnected,
    muteAll: () => send({ type: "mute_all" }),
    muteParticipant: (participantId: number) =>
      send({ type: "mute_participant", participant_id: participantId }),
    removeParticipant: (participantId: number) =>
      send({ type: "remove_participant", participant_id: participantId }),
    endMeeting: () => send({ type: "end_meeting" }),
  };
}
