import React, { useState } from 'react';

const Avatar = React.memo(({ url, name, username, className = "w-12 h-12" }) => {
  const [error, setError] = useState(false);
  
  const getInitial = () => {
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    if (username && username.length > 0) return username.charAt(0).toUpperCase();
    return '?';
  };

  if (!url || error) {
    return (
      <div className={`rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] border border-white/10 flex-shrink-0 ${className}`}>
        {getInitial()}
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={name || username || 'Avatar'}
      onError={() => setError(true)}
      className={`rounded-full object-cover border border-white/10 flex-shrink-0 bg-surface ${className}`}
    />
  );
});

export default Avatar;
