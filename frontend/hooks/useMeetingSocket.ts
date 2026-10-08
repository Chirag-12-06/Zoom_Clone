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
  onForceMute: () => void; // called when the host mutes everyone
};

/** Connects to the meeting WebSocket and keeps the live participant list in state. */
export function useMeetingSocket(options: Options) {
  const { enabled, code, passcode, displayName, userId, audio, video, onForceMute } = options;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endedReason, setEndedReason] = useState<"removed" | "ended" | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Latest mic/camera state and callback, read inside socket events.
  // Refs (not effect dependencies) so toggling the mic doesn't reconnect the socket.
  const mediaRef = useRef({ audio, video });
  const onForceMuteRef = useRef(onForceMute);
  useEffect(() => {
    mediaRef.current = { audio, video };
    onForceMuteRef.current = onForceMute;
  }, [audio, video, onForceMute]);

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
          user_id: userId,
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
  }, [enabled, code, passcode, displayName, userId]);

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
    sendMediaState: (audioOn: boolean, videoOn: boolean) =>
      send({ type: "media_state", audio: audioOn, video: videoOn }),
    muteAll: () => send({ type: "mute_all" }),
    removeParticipant: (participantId: number) =>
      send({ type: "remove_participant", participant_id: participantId }),
    endMeeting: () => send({ type: "end_meeting" }),
  };
}
