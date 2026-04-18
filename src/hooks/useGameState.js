import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function useGameState() {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const state = await invoke('check_game_state');
      setGameState(state);
    } catch (e) {
      console.error('Failed to check game state:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { gameState, loading, error, refresh };
}
