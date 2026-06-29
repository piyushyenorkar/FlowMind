import React from 'react';
import { useApp } from '../context/AppContext';
import { User } from 'lucide-react';

interface AvatarProps {
  name: string;
  size?: number;
  style?: React.CSSProperties;
  showTooltip?: boolean;
  photoUrl?: string;
}

export default function Avatar({ name, size = 24, style = {}, showTooltip = true, photoUrl }: AvatarProps) {
  const { memberProfiles } = useApp();

  // Try localStorage as fallback for global profiles
  let localPhoto: string | null = null;
  try {
    const allMembers = JSON.parse(localStorage.getItem('flowmind_team_members') || '{}');
    localPhoto = allMembers[name]?.photoUrl || null;
  } catch (e) {}

  const profileUrl = photoUrl || memberProfiles?.[name]?.photoUrl || localPhoto;

  const defaultStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
    ...style
  };

  if (profileUrl) {
    return (
      <div style={defaultStyle} title={showTooltip ? name : undefined}>
        <img src={profileUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  // Fallback to initial
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div style={{ ...defaultStyle, fontSize: `${size * 0.45}px`, fontWeight: 600, color: 'var(--text)' }} title={showTooltip ? name : undefined}>
      {initial}
    </div>
  );
}
