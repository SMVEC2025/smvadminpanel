import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const ChatMessageLayer = () => {
  const [userRooms, setUserRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMsg, setReplyMsg] = useState("");
  const messagesEndRef = useRef(null);

  const fetchUniqueRooms = async () => {
    const { data: allMessages, error } = await supabase
      .from("messages")
      .select("room_id, name, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    const roomCount = {};
    const roomMap = new Map();

    // Count occurrences of each room_id
    for (const msg of allMessages) {
      roomCount[msg.room_id] = (roomCount[msg.room_id] || 0) + 1;
    }

    for (const msg of allMessages) {
      const { room_id, name, email, created_at } = msg;

      const seen = roomCount[room_id] > 1 ? "false" : "true";

      if (!roomMap.has(room_id)) {
        roomMap.set(room_id, {
          room_id,
          name: name || null,
          email: email || null,
          created_at,
          seen,
        });
      } else {
        const existing = roomMap.get(room_id);

        if (new Date(created_at) > new Date(existing.created_at)) {
          existing.created_at = created_at;
        }

        if ((!existing.name || !existing.email) && name && email) {
          existing.name = name;
          existing.email = email;
        }

        existing.seen = seen; // Always keep this up to date just in case
        roomMap.set(room_id, existing);
      }
    }

    const refinedRooms = Array.from(roomMap.values());

    // Ensure final sort
    refinedRooms.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setUserRooms(refinedRooms);
  };  useEffect(() => {
    
  
    fetchUniqueRooms();
  }, [messages]);
  

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time message listener
  useEffect(() => {
    const channel = supabase
      .channel("agent-room-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMsg = payload.new;
          const room = newMsg.room_id;
  
          // Check if the room already exists in userRooms
          const isNewRoom = !userRooms.some((r) => r.room_id === room);
  
          // If new room, log to console
          if (isNewRoom) {
            fetchUniqueRooms()
            const audio = new Audio('/assets/ringtone/ringtone.mp3');
            audio.play()
          }
  
          // Add to userRooms if it's a new room
          setUserRooms((prev) => {
            const exists = prev.some((r) => r.room_id === room);
            if (exists) return prev;
            return [
              ...prev,
              {
                room_id: room,
                name: newMsg.name || "Unknown",
                email: newMsg.email || "",
                created_at: newMsg.created_at,
                seen: "false",
              },
            ];
          });
  
          // If selected room is this room, add message to chat
          if (room === selectedRoom) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();
  
    return () => supabase.removeChannel(channel);
  }, [selectedRoom, userRooms]);
  

  const loadMessages = async (roomid, name) => {
    setSelectedRoom(roomid);
    setSelectedName(name);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomid)
      .order("created_at", { ascending: true });

    if (error) console.error("Error loading messages:", error);
    else setMessages(data);
  };

  const sendReply = async () => {
    if (!replyMsg.trim()) return;

    const { error } = await supabase.from("messages").insert({
      content: replyMsg,
      sender_type: "agent",
      room_id: selectedRoom,
    });

    if (error) console.error("Send message failed:", error);
    else setReplyMsg("");
  };

  const deleteChat = async () => {
    if (!selectedRoom) return alert("No chat selected");

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("room_id", selectedRoom);

    if (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete chat");
    } else {
      alert("Chat deleted");
      setMessages([]);
    }
  };

 
  return (
    <div className="chat-wrapper">
      <div className="chat-sidebar card">
        <div className="chat-all-list">
          {userRooms.map((room) => (
            <div
              className={`chat-sidebar-single ${selectedRoom === room.room_id ? "opened" : ""}`}
              key={room.room_id}
              onClick={() => loadMessages(room.room_id, room.name)}
            >
              <div className="img">
                <img
                  style={{ borderRadius: "50%" }}
                  src="https://img.freepik.com/free-vector/young-man-orange-hoodie_1308-175788.jpg"
                  alt="user icon"
                />
              </div>
              <div className="info">
                <h6 className="text-sm mb-1">{room.name}</h6>
              </div>
              <div className="action text-end">
                <p className='mb-0 text-neutral-400 text-xs lh-1'>{room.created_at?(new Date(room.created_at).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })):('New')}</p>
                {room?.seen == 'true' || !room.created_at?(
                  <span className='w-10-px h-10-px text-xs rounded-circle bg-warning-main text-white d-inline-flex align-items-center justify-content-center'>
                  
                  </span>
                ):null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main card">
        {selectedRoom && (
          <div className="chat-sidebar-single active">
            <div className="img">
              <img
                style={{ borderRadius: "50%" }}
                src="https://img.freepik.com/free-vector/young-man-orange-hoodie_1308-175788.jpg"
                alt="user icon"
              />
            </div>
            <div className="info">
              <h6 className="text-md mb-0">{selectedName}</h6>
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
          {selectedRoom ? (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-single-message ${msg.sender_type === "agent" ? "right" : "left"}`}>
                  <div className="chat-message-content">
                    <p className="mb-3">{msg.content}</p>
                    <p className="chat-time mb-0">
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

        {selectedRoom && (
          <div className="chat-message-box">
            <input
              type="text"
              name="chatMessage"
              placeholder="Write message"
              value={replyMsg}
              onChange={(e) => setReplyMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendReply();
                }
              }}
            />
            <div className="chat-message-box-action">
              <button
                onClick={sendReply}
                className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1"
              >
                Send
                <Icon icon="f7:paperplane" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageLayer;
