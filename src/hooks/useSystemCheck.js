import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function useSystemCheck() {
  const [systemCheck, setSystemCheck] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    invoke('check_system_requirements')
      .then(setSystemCheck)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { systemCheck, loading, refresh };
}
