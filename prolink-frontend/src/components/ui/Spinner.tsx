import React from 'react';

export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: { width: 16, height: 16, borderWidth: 2 },
    md: { width: 24, height: 24, borderWidth: 3 },
    lg: { width: 36, height: 36, borderWidth: 4 },
  };
  const dims = sizeMap[size];

  return (
    <div 
      className="pl-spinner" 
      style={{ 
        width: dims.width, 
        height: dims.height, 
        borderWidth: dims.borderWidth 
      }} 
    />
  );
}
