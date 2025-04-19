import { Icon } from "@iconify/react/dist/iconify.js";
import { useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { AppContext } from "../context/AppContext";
import ChatProfileLayer from "./ChatProfileLayer";
import { MdContentCopy } from "react-icons/md";

const ChatMessageLayer = () => {
  const [userRooms, setUserRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [showProfile, setShowProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMsg, setReplyMsg] = useState("");
  const messagesEndRef = useRef(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const { notify } = useContext(AppContext)

  // ✅ Fetch all rooms
  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("room")
      .select('*')
      .order("last_msg_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
    } else {
      setUserRooms(data);
    }
  };

  // ✅ Fetch messages for selected room
  const fetchMessages = async (roomId) => {
    const { data, error } = await supabase
      .from("messages")
      .select('*')
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data);
    }
  };

  // ✅ Handle room click
  const handleRoomClick = async (room) => {
    setCurrentRoom(room);

    // reset unseen_count
    const { error } = await supabase
      .from("room")
      .update({ unseen_count: 0 })
      .eq("room_id", room.room_id);

    if (error) {
      console.error("Error resetting unseen count:", error);
    }

    fetchMessages(room.room_id);
  };

  // ✅ Send new message
  const sendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !currentRoom) return;

    // insert message
    const { error: insertError } = await supabase
      .from("messages")
      .insert([{ room_id: currentRoom.room_id, content: trimmed, sender_type: "agent" }]);

    if (insertError) {
      console.error("Error sending message:", insertError);
      return;
    }

    // update room meta
    const { error: updateError } = await supabase
      .from("room")
      .update({
        last_msg: trimmed,
        last_msg_at: new Date().toISOString(),
      })
      .eq("room_id", currentRoom.room_id);

    if (updateError) {
      console.error("Error updating room:", updateError);
    }

    setNewMessage("");
    fetchMessages(currentRoom.room_id);
  };

  // ✅ Realtime listener for new rooms
  useEffect(() => {
    const subscription = supabase
      .channel("room-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room",
        },
        (payload) => {
          console.log("🆕 New room:", payload.new);
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRooms();
  }, []);



  // ✅ Real-time listeners
  useEffect(() => {
    // ✅ New Room INSERT Listener (shows alert)
    const roomInsertSub = supabase
      .channel("room-insert")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room",
        },
        (payload) => {
          const audio = new Audio('/assets/ringtone/ringtone.mp3');
          notify({ message: "New Message received", type: "info" })
          audio.play()
          fetchRooms();
        }
      )
      .subscribe();

    // ✅ Room UPDATE listener (refreshes list when last_msg or last_msg_at changes)
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
          fetchRooms(); // no alert, just update list
        }
      )
      .subscribe();

    // ✅ Realtime message listener for selected room
    const messageSub = supabase
      .channel("message-stream")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${currentRoom?.room_id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomInsertSub);
      supabase.removeChannel(roomUpdateSub);
      supabase.removeChannel(messageSub);
    };
  }, [currentRoom?.room_id]);


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
      setSelectedRoom(null);
      setSelectedName(null);
      fetchUniqueRooms();
    }
  };
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      {console.log("currentRoom", currentRoom)}
      {console.log("messages", messages)}
      {console.log("rooms", userRooms)}
      <div className="chat-main card">
        {currentRoom && (
          <div className="chat-sidebar-single active" onMouseEnter={()=>{setShowProfile(true)}} onMouseLeave={()=>{setShowProfile(false)}}>
            <div className="imgdiv" style={{ width: "40px", height: "40px" }}>
              {currentRoom.name.split("")[0]}
            </div>
         
            <div className="info" style={{display:'flex',flexDirection:"row",justifyContent:"start",alignItems:"center"}}>
              <h6 className="text-md mb-0" >{currentRoom.name}</h6> - 
              <h6 className="text-md mb-0" >{currentRoom.email}</h6>
              <div><MdContentCopy/></div>

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
                onClick={sendMessage}
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

