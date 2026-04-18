import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function useLauncherContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    invoke('get_launcher_content')
      .then(setContent)
      .catch((e) => {
        console.error('Failed to get launcher content:', e);
        setError(e);
      })
      .finally(() => setLoading(false));
  }, []);

  return { content, loading, error };
}
