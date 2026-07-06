import React from 'react';

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Avatar({ src, name, size = 'md', className = '', style, ...props }: AvatarProps) {
  const sizeMap: Record<string, number> = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };
  const px = sizeMap[size] || 48;

  if (!src) {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return (
      <div 
        className={className}
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--accent-fg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: px * 0.4,
          flexShrink: 0,
          ...style,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name || 'Avatar'} 
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}
