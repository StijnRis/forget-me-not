'use client';

import { useCallback, useEffect, useState } from 'react';

export function useStoryFullscreen() {
  const [needsGesture, setNeedsGesture] = useState(false);

  const enterFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      setNeedsGesture(false);
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
      setNeedsGesture(false);
    } catch {
      setNeedsGesture(true);
    }
  }, []);

  useEffect(() => {
    void enterFullscreen();
  }, [enterFullscreen]);

  return { needsGesture, enterFullscreen };
}
