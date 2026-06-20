import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Shield } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatWindow({ chatId, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [chatDetails, setChatDetails] = useState(null);

  useEffect(() => {
    if (!chatId) return;

    fetchChatDetails();
    fetchMessages();

    // Subscribe to new messages for this specific chat
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const fetchChatDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id, type,
          chat_members!inner(user_id, profiles(id, username, full_name, avatar_url, is_online))
        `)
        .eq('id', chatId)
        .single();
      
      if (error) throw error;
      
      const otherMember = data.chat_members.find(m => m.user_id !== user.id)?.profiles;
      setChatDetails({ ...data, otherMember });
    } catch (err) {
      console.error('Error fetching chat details', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      // Optimistic UI update could go here, but Realtime is fast enough
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          sender_id: user.id,
          content: content,
          message_type: 'text'
        }]);

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message', err);
      alert('Failed to send message.');
    }
  };

  if (!chatId) return null;

  return (
    <div className="flex-1 flex flex-col h-full app-bg relative w-full overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(to top right, var(--theme-primary), var(--theme-secondary))', opacity: 0.05 }} />

      <ChatHeader chatDetails={chatDetails} onBack={onBack} />
      
      {/* Encryption Banner */}
      <div className="w-full flex justify-center pt-2 pb-1 relative z-10">
        <div className="app-surface border app-border backdrop-blur-sm px-3 py-1 rounded-full text-[10px] app-muted flex items-center space-x-1.5 shadow-[var(--theme-shadow)]">
          <Shield className="w-3 h-3" style={{ color: 'var(--theme-primary)' }} />
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      <MessageList messages={messages} user={user} />
      
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}
