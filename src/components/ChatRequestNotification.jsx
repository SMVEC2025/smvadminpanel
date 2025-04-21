import { useEffect, useContext } from "react";
import { supabase } from "../supabaseClient";
import { AppContext } from "../context/AppContext";

const ChatRequestNotification = ({ fetchRooms }) => {
  const { notify } = useContext(AppContext);

  useEffect(() => {
    // Listener for new room inserts
    const roomInsertSub = supabase
      .channel("room-insert")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room",
        },
        async (payload) => {
          const newRoom = payload.new;


          // Optional: Play audio & notify
          const audio = new Audio("/assets/ringtone/ringtone.mp3");
          audio.play();
          notify({ data: newRoom,message: `New Chat from ${newRoom.name || "a user"}`, type: "info" });
          // Optional: Refresh room list
          fetchRooms();
        }
      )
      .subscribe();

    // Listener for room updates
    const roomUpdateSub = supabase
      .channel("room-update")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room",
        },
        (payload) => {
          fetchRooms(); // Refresh room list silently
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(roomInsertSub);
      supabase.removeChannel(roomUpdateSub);
    };
  }, [fetchRooms, notify]);

  return null; // No visual output
};

export default ChatRequestNotification;
