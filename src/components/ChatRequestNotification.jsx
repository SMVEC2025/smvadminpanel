import { useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { AppContext } from "../context/AppContext";
const ChatRequestNotification = ({ knownRooms = [], onNewRoom }) => {
  const [roomIds, setRoomIds] = useState(new Set(knownRooms.map(r => r.room_id)));
  const {notify} = useContext(AppContext)
  useEffect(() => {
    const channel = supabase
      .channel("new-room-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const msg = payload.new;
          const roomId = msg.room_id;

          if (!roomIds.has(roomId)) {
            // Update roomIds set
            setRoomIds((prev) => new Set(prev).add(roomId));

            // Call parent handler if provided
            if (onNewRoom) {
              onNewRoom({
                room_id: roomId,
                name: msg.name,
                email: msg.email,
                created_at: msg.created_at,
              });
            }

            // Show notification
            const audio = new Audio('/assets/ringtone/ringtone.mp3');
            console.log('newmessage')
            notify({ message: "New Message received", type: "info" })
            audio.play()
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomIds]);

  return null;
};

export default ChatRequestNotification;
