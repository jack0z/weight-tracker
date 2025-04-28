"use client";

import { useEffect, useState } from 'react';
import ViewMode from '@/components/ViewMode';

export default function SharePage({ params }) {
  const { id } = params;
  const [theme, setTheme] = useState('dark');

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ViewMode shareId={id} theme={theme} />
    </div>
  );
}