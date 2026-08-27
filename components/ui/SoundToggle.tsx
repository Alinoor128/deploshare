'use client';

import React, { useState } from 'react';
import { isSoundEnabled, toggleSoundEnabled } from '@/lib/audio/sound-effects';
import { Volume2, VolumeX } from 'lucide-react';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(() => isSoundEnabled());

  const handleToggle = () => {
    const next = toggleSoundEnabled();
    setEnabled(next);
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 bg-white shadow-2xs"
      title={enabled ? 'Mute sound effects' : 'Enable sound effects'}
      aria-label="Toggle sound effects"
    >
      {enabled ? (
        <Volume2 className="w-4 h-4 text-blue-600" />
      ) : (
        <VolumeX className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );
}
