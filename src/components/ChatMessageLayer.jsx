import { Icon } from "@iconify/react/dist/iconify.js";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { AppContext } from "../context/AppContext";
import { MdContentCopy } from "react-icons/md";

const ChatMessageLayer = () => {
  const [userRooms, setUserRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { notify } = useContext(AppContext);

  // Memoized fetch functions
  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("room")
      .select('*')
      .order("last_msg_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
      notify({ message: "Failed to load chats", type: "error" });
    } else {
      setUserRooms(data);
    }
    setIsLoading(false);
  }, [notify]);

  const fetchMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select('*')
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      notify({ message: "Failed to load messages", type: "error" });
    } else {
      setMessages(data);
    }
    setIsLoading(false);
  }, [notify]);

  // Room click handler
  const handleRoomClick = useCallback(async (room) => {
    if (currentRoom?.room_id === room.room_id) return;
    
    setCurrentRoom(room);
    await fetchMessages(room.room_id);

    // Reset unseen count
    const { error } = await supabase
      .from("room")
      .update({ unseen_count: 0 })
      .eq("room_id", room.room_id);

    if (error) {
      console.error("Error resetting unseen count:", error);
    }
  }, [currentRoom, fetchMessages]);

  // Send message handler
  const sendMessage = useCallback(async (e) => {
    const trimmed = newMessage.trim();
    if (!trimmed || !currentRoom) return;
    
    try {
      setIsLoading(true);
      const { error: insertError } = await supabase
        .from("messages")
        .insert([{ 
          room_id: currentRoom.room_id, 
          content: trimmed, 
          sender_type: "agent" 
        }]);

      if (insertError) throw insertError;

      // Update room meta - don't fetch messages here
      const { error: updateError } = await supabase
        .from("room")
        .update({
          last_msg: trimmed,
          last_msg_at: new Date().toISOString(),
        })
        .eq("room_id", currentRoom.room_id);

      if (updateError) throw updateError;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      notify({ message: "Failed to send message", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [currentRoom, newMessage, notify]);

  // Copy email handler
  const handleCopy = useCallback((email) => {
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        notify({ message: "Email copied!", type: "success" });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        notify({ message: "Failed to copy email", type: "error" });
      });
  }, [notify]);

  // Delete chat handler
  const deleteChat = useCallback(async () => {
    if (!currentRoom?.room_id) {
      notify({ message: "No chat selected", type: "warning" });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      setIsLoading(true);
      // Delete messages first
      const { error: messageError } = await supabase
        .from("messages")
        .delete()
        .eq("room_id", currentRoom.room_id);

      if (messageError) throw messageError;

      // Then delete room
      const { error: roomError } = await supabase
        .from("room")
        .delete()
        .eq("room_id", currentRoom.room_id);

      if (roomError) throw roomError;

      setMessages([]);
      setCurrentRoom(null);
      await fetchRooms();
      notify({ message: "Chat deleted successfully", type: "success" });
    } catch (error) {
      console.error("Failed to delete chat:", error.message);
      notify({ message: "Failed to delete chat", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [currentRoom, fetchRooms, notify]);

  // Realtime subscriptions
  useEffect(() => {
    const channels = [];
    
    // Room insert listener
    const roomInsertSub = supabase
      .channel("room-insert-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room",
        },
        (payload) => {
          const newRoom = payload.new;
          const audio = new Audio("/assets/ringtone/ringtone.mp3");
          audio.play();
          notify({ 
            data: newRoom,
            message: `New Chat from ${newRoom.name || "a user"}`, 
            type: "info" 
          });
          fetchRooms();
        }
      );
    channels.push(roomInsertSub);

    // Room update listener
    const roomUpdateSub = supabase
      .channel("room-update-listener")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room",
        },
        (payload) => {
          fetchRooms();
        }
      );
    channels.push(roomUpdateSub);

    // Message listener for current room
    if (currentRoom?.room_id) {
      const messageSub = supabase
        .channel(`message-listener-${currentRoom.room_id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${currentRoom.room_id}`,
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new]);
          }
        );
      channels.push(messageSub);
    }

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());

    // Cleanup function
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [currentRoom?.room_id, fetchRooms, notify]);

  // Initial data fetch
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Enter key for message sending
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }, [sendMessage]);

  return (
    <div className="chat-wrapper">
      <div className="chat-sidebar card">
        <div className="chat-all-list">
          <div className="chatboxname">Chats</div>
          {userRooms?.map((room) => (
            <div
              className={`chat-sidebar-single ${currentRoom?.room_id === room.room_id ? "opened" : ""}`}
              key={room.room_id}
              onClick={() => handleRoomClick(room)}
              id="chat-sidebar-single"
            >
              <div className="imgdiv">
                {room.name.split("")[0]}
              </div>
              <div className="info">
                <h6 className="text-sm m-0">{room.name}</h6>
                <p className="text-sm m-0">{room.last_msg.length > 10 ? room.last_msg.slice(0, 17) + '...' : room.last_msg}</p>
              </div>
              <div className="action text-end">
                <p className='mb-0 text-neutral-400 text-xs lh-1'>{room.last_msg_at ? (new Date(room.last_msg_at).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })) : ('New')}</p>
                {room?.unseen_count == '1000' && (<p className="noti">new</p>)}
                {room?.unseen_count > 0 && room?.unseen_count < 1000 && (
                  <p className="notinum">{room?.unseen_count}</p>
                )}

                {room?.seen == 'true' || !room.created_at ? (
                  <span className='w-10-px h-10-px text-xs rounded-circle bg-warning-main text-white d-inline-flex align-items-center justify-content-center'>

                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main card">
        {currentRoom && (
          <div className="chat-sidebar-single active" onMouseEnter={() => { setShowProfile(true) }} onMouseLeave={() => { setShowProfile(false) }}>
            <div className="imgdiv" style={{ width: "40px", height: "40px" }}>
              {currentRoom.name.split("")[0]}
            </div>

            <div className="info" style={{ display: 'flex', flexDirection: "row", justifyContent: "start", alignItems: "center", gap: "5px" }}>
              <h6 className="text-md mb-0" >{currentRoom.name}</h6> -
              <h6 className="text-md mb-0" >{currentRoom.email}</h6>
              <div className="copy-btn-chat" onClick={() => { handleCopy(currentRoom.email) }} style={{ display: "flex" }}><MdContentCopy /></div>

            </div>

            <div className="action d-inline-flex align-items-center gap-3">
              <div className="btn-group">
                <button
                  type="button"
                  className="text-primary-light text-xl"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <Icon icon="tabler:dots-vertical" />
                </button>
                <ul className="dropdown-menu dropdown-menu-lg-end border">
                  <li>
                    <button onClick={deleteChat}
                      className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2"
                    >
                      <Icon icon="mdi:clear-circle-outline" />
                      Clear All
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2"
                    >
                      <Icon icon="ic:baseline-block" />
                      Block
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="chat-message-list">
          {currentRoom ? (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-single-message ${msg.sender_type === "agent" ? "right" : "left"}`}>
                  <div className="chat-message-content">
                    <p className="m-0">{msg.content}</p>
                    <p className="chat-time m-0">
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <p className="text-center text-muted">Select a user to start chat</p>
          )}
        </div>

        {currentRoom && (
          <div className="chat-message-box">
            <input
              type="text"
              name="chatMessage"
              placeholder="Write message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="chat-message-box-action">
              <button
                onClick={(e)=>{ e.preventDefault();
                  sendMessage();}}
                className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1"
              >
                Send
                <Icon icon="f7:paperplane" />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="chat_userprofile_container">

      </div>
    </div>
  );
};

export default ChatMessageLayer;

