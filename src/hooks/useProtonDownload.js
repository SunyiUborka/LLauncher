import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export default function useProtonDownload(onComplete) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unlisteners = [];

    listen('proton://progress', (event) => {
      setProgress(event.payload);
    }).then((u) => unlisteners.push(u));

    listen('proton://complete', (event) => {
      setDownloading(false);
      setProgress(null);
      if (onComplete) onComplete(event.payload);
    }).then((u) => unlisteners.push(u));

    listen('proton://error', (event) => {
      setDownloading(false);
      setError(event.payload.message);
    }).then((u) => unlisteners.push(u));

    return () => {
      unlisteners.forEach((u) => u());
    };
  }, [onComplete]);

  const startDownload = useCallback(async (release) => {
    setDownloading(true);
    setError(null);
    setProgress(null);
    try {
      await invoke('download_dwproton', { release: release || null });
    } catch (e) {
      setDownloading(false);
      setError(typeof e === 'string' ? e : e.message || 'Proton download failed');
    }
  }, []);

  const cancelDownload = useCallback(async () => {
    try {
      await invoke('cancel_proton_download');
    } catch (e) {
      console.error('Failed to cancel proton download:', e);
    }
  }, []);

  return { downloading, progress, error, startDownload, cancelDownload };
}
