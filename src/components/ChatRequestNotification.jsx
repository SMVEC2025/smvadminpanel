import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import axios from 'axios';

const ChatRequestNotification = () => {
    const [pendingRequest, setPendingRequest] = useState(null)

    useEffect(() => {
        const channel = supabase
          .channel('room_status_channel')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'room',
            },
            (payload) => {
              console.log('📥 INSERT EVENT PAYLOAD:', payload)
      
              const newRoom = payload.new
              if (newRoom.status === 'pending') {
                console.log('🚀 New pending room:', newRoom)
                setPendingRequest(newRoom)
      
                const audio = new Audio('/notify.mp3')
                audio.play().catch((e) => console.warn('Audio play error:', e))
              }
            }
          )
          .subscribe((status) => {
            console.log('🔔 Subscribed to channel:', status)
          })
      
        return () => {
          supabase.removeChannel(channel)
        }
      }, [])
    console.log(pendingRequest)

    const handleAccept = async () => {
        if (!pendingRequest) return;
      
        try {
          await axios.post('http://localhost:3000/api/accept-chat', {
            room_id: pendingRequest.room_id,
            action: 'accept',
          });
      
          setPendingRequest(null);
        } catch (error) {
          console.error('Error accepting chat:', error?.response?.data || error.message);
        }
      };
    const handleDecline = async () => {
        if (!pendingRequest) return;
      
        try {
          await axios.post('http://localhost:3000/api/accept-chat', {
            room_id: pendingRequest.room_id,
            action: 'decline',
          });
      
          setPendingRequest(null);
        } catch (error) {
          console.error('Error accepting chat:', error?.response?.data || error.message);
        }
      };
  
    return (
      <div>
        {pendingRequest && (
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded shadow-lg">
            <h3 className="text-lg font-semibold">New Chat Request</h3>
            <p>User Email: {pendingRequest.email}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={handleAccept} className="bg-green-500 text-white px-3 py-1 rounded">Accept</button>
              <button onClick={handleDecline} className="bg-red-500 text-white px-3 py-1 rounded">Decline</button>
            </div>
          </div>
        )}
      </div>
    )
  }
  
export default ChatRequestNotification