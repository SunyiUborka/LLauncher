import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

export default function useLaunchEvents() {
  const [failure, setFailure] = useState(null);

  useEffect(() => {
    let unlisten;
    listen('launch://failed', (event) => {
      setFailure(event.payload);
    }).then((u) => {
      unlisten = u;
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const dismiss = () => setFailure(null);

  return { failure, dismiss };
}
