"use client";

import { useState } from 'react';
import ViewMode from '@/components/ViewMode';

export default function ShareViewClient({ id }) {
  const [theme, setTheme] = useState('dark');

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ViewMode shareId={id} theme={theme} />
    </div>
  );
}