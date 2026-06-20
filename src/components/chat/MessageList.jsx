import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, user }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scroll-smooth pb-20">
      {messages.map((msg) => (
        <MessageBubble 
          key={msg.id} 
          msg={msg} 
          isMe={msg.sender_id === user.id} 
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
