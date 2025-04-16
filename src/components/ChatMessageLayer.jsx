import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { useEffect, useRef, useState } from "react";
import ChatRequestNotification from "./ChatRequestNotification";

const ChatMessageLayer = () => {
  const [userRooms, setUserRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMsg, setReplyMsg] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch distinct rooms (user-wise)
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('messages')
        .select('room_id')
        .neq('sender_type', 'agent')
        .order('created_at', { ascending: false });
      const uniqueRooms = [...new Set(data.map((d) => d.room_id))];
      setUserRooms(uniqueRooms);
    };
    fetchRooms();
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  // Subscribe to new chats for all users
  useEffect(() => {
    const channel = supabase
      .channel('agent-room-listener')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const room = payload.new.room_id;
        setUserRooms((prev) => (prev.includes(room) ? prev : [...prev, room]));

        // If viewing this room, update messages live
        if (room === selectedRoom) {
          setMessages((prev) => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedRoom]);

  const loadMessages = async (roomId) => {
    setSelectedRoom(roomId);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages(data);
  };

  const sendReply = async () => {
    if (!replyMsg.trim()) return;
    await supabase.from('messages').insert({
      content: replyMsg,
      sender_type: 'agent',
      room_id: selectedRoom,
    });
    setReplyMsg('');
  };
  const deleteChat = async (chatId) => {
    if (!selectedRoom) return alert("No chat ID provided");

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', selectedRoom);

    if (error) {
      console.error('❌ Delete failed:', error.message);
      alert('Failed to delete chat');
    } else {
      alert('✅ Chat deleted');
    }
  };
  console.log(selectedRoom)
  return (
    <div className='chat-wrapper'>
      
        
     <ChatRequestNotification/>
      <div className='chat-sidebar card'>


        <div className='chat-all-list'>
          {userRooms.map((room) => (

            <div className='chat-sidebar-single active' key={room} onClick={() => loadMessages(room)}>
              <div className='img' >
                <img  style={{borderRadius:"50%"}}  src='https://img.freepik.com/free-vector/young-man-orange-hoodie_1308-175788.jpg' alt='image_icon' />
              </div>
              <div className='info'>
                <h6 className='text-sm mb-1'>{room}</h6>
                {/* <p className='mb-0 text-xs'>hey! there I am...</p> */}
              </div>
              <div className='action text-end'>
                <p className='mb-0 text-neutral-400 text-xs lh-1'>12:30 PM</p>
                <span className='w-16-px h-16-px text-xs rounded-circle bg-warning-main text-white d-inline-flex align-items-center justify-content-center'>
                  
                </span>
              </div>
            </div>
          ))}

        </div>
      </div>
      <div className='chat-main card'>
        <div className='chat-sidebar-single active'>
          <div className='img'>
            <img style={{borderRadius:"50%"}} src='https://img.freepik.com/free-vector/young-man-orange-hoodie_1308-175788.jpg' alt='image_icon' />
          </div>
          <div className='info'>
            <h6 className='text-md mb-0'>{selectedRoom}</h6>
            {/* <p className='mb-0'>Available</p> */}
          </div>
          <div className='action d-inline-flex align-items-center gap-3'>
            
            <div className='btn-group'>
              <button
                type='button'
                className='text-primary-light text-xl'
                data-bs-toggle='dropdown'
                data-bs-display='static'
                aria-expanded='false'
              >
                <Icon icon='tabler:dots-vertical' />
              </button>
              <ul className='dropdown-menu dropdown-menu-lg-end border'>
                <li>
                  <button  onClick={()=>{deleteChat(selectedRoom)}}
                    className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'
                    type='button'
                  >
                    <Icon icon='mdi:clear-circle-outline'/>
                    Clear All
                  </button>
                </li>
                <li>
                  <button
                    className='dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2'
                    type='button'
                  >
                    <Icon icon='ic:baseline-block' />
                    Block
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* chat-sidebar-single end */}
        <div className='chat-message-list'>






          {selectedRoom ? (
            <>
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-single-message ${msg.sender_type == 'agent'?'right':'left'}`}>
                    
                    <div className='chat-message-content'>
                      <p className='mb-3'>
                        {msg.content}
                      </p>
                      <p className='chat-time mb-0'>
                        <span>{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                      </p>
                    </div>
                  </div>
                ))}
                           <div ref={messagesEndRef} />

            </>
          ) : (
            <p>Select a user to start chat</p>
          )}





        </div>
        <div className='chat-message-box'>
          <input type='text' name='chatMessage' placeholder='Write message'  value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} />
          <div className='chat-message-box-action'>
            
          
            <button
              onClick={sendReply}
              className='btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1'
            >
              Send
              <Icon icon='f7:paperplane' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageLayer;
