import { useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient' // Ensure this is correctly configured
import { AppContext } from '../context/AppContext';
import axios from 'axios'
const ChatRequestNotification = () => {
    const [pendingRequest, setPendingRequest] = useState(null)
    const [pendingRequests, setPendingRequests] = useState([]) // State to store all pending requests
  const {makeNotify,setMakeNotify} = useContext(AppContext)
    // Fetch initial pending requests from Supabase when component mounts
    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                const { data, error } = await supabase
                    .from('room') // Table name: 'room'
                    .select('*')
                    .eq('status', 'pending'); // Filter for pending requests

                if (error) {
                    console.error('Error fetching pending requests from Supabase:', error.message);
                } else {
                    setPendingRequests(data); // Update state with fetched data
                setMakeNotify(true)

                }
            } catch (error) {
                console.error('Error fetching pending requests:', error.message);
            }
        };

        // Fetch pending requests initially when component mounts
        fetchPendingRequests();

        // Subscribe to real-time changes via Supabase for new requests
        const channel = supabase
          .channel('room_status_channel')
          .on(
            'postgres_changes',
            {
              event: 'INSERT', // Trigger on new INSERT events
              schema: 'public',
              table: 'room',
            },
            (payload) => {
              console.log('📥 INSERT EVENT PAYLOAD:', payload)
      
              const newRoom = payload.new;
              if (newRoom.status === 'pending') {
                console.log('🚀 New pending room:', newRoom);
                setMakeNotify(true)

                
                // Push new room to the existing requests
                setPendingRequests((prevRequests) => [...prevRequests, newRoom]);

                const audio = new Audio('/assets/ringtone/ringtone.mp3');
                audio.play()
              }
            }
          )
          .subscribe((status) => {
            console.log('🔔 Subscribed to channel:', status);
          });

        // Clean up the channel when the component unmounts
        return () => {
          supabase.removeChannel(channel);
        };
    }, []); // Empty dependency array to run on mount only

    const sendAutoMessage = async (roomId) => {
      const { error } = await supabase.from('messages').insert([
        {
          room_id: roomId,
          sender_type: 'agent', // or agentId if you store specific agent
          content: 'Hello! How can I assist you today?', // Your auto-message
          created_at: new Date().toISOString(),
        },
      ]);
    
      if (error) {
        console.error('Error sending auto-message:', error.message);
      }
    };
    
    
    
    const handleAccept = async (roomId) => {
        if (!roomId) return;

        try {
         const response =  await axios.post('https://smvserver.vercel.app/api/accept-chat', {
            room_id: roomId,
            action: 'accept',
          });
          sendAutoMessage(roomId)
          console.log('✅ Chat accepted response:', response.data);
          // Remove accepted request from the list
          setPendingRequests((prevRequests) => prevRequests.filter(request => request.room_id !== roomId));
         
        } catch (error) {

          console.error('Error accepting chat:', error?.response?.data || error.message);
        }
    };

    const handleDecline = async (roomId) => {
        if (!roomId) return;

        try {
          await axios.post('https://smvserver.vercel.app/api/accept-chat', {
            room_id: roomId,
            action: 'decline',
          });

          // Remove declined request from the list
          setPendingRequests((prevRequests) => prevRequests.filter(request => request.room_id !== roomId));
        } catch (error) {
          console.error('Error declining chat:', error?.response?.data || error.message);
        }
    };

    return (
      <div>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <div className="crn_main" key={request.room_id}>
              <p className="para">New Request</p>
              <p className="paraa">Email: {request.email}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleAccept(request.room_id)} className="crn_button accept">Accept</button>
                <button onClick={() => handleDecline(request.room_id)} className="crn_button decline">Decline</button>
              </div>
            </div>
          ))
        ) : (
          <p>No pending requests</p>
        )}
      </div>
    );
};

export default ChatRequestNotification;
