import { useRef, useEffect, useCallback } from 'react';

export function useAudio(muted) {
  const ctxRef = useRef(null);
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const tone = useCallback((f, type='sine', d=.12, v=.11) => {
    if (mutedRef.current) return;
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const c = ctxRef.current;
      if (c.state === 'suspended') c.resume();
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.type = type;
      o.frequency.setValueAtTime(f, c.currentTime);
      g.gain.setValueAtTime(v, c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d);
      o.start(); o.stop(c.currentTime + d);
    } catch {}
  }, []);

  return {
    flip:  () => tone(440,'sine',.08,.07),
    match: () => { tone(580,'sine',.1,.1); setTimeout(() => tone(880,'sine',.14,.1), 90); },
    miss:  () => tone(160,'sawtooth',.18,.09),
    combo: () => { tone(680,'sine',.08); setTimeout(() => tone(880,'sine',.08),58); setTimeout(() => tone(1080,'sine',.12),116); },
    pu:    () => { tone(780,'square',.1,.09); setTimeout(() => tone(980,'sine',.1),78); },
    win:   () => { [480,640,780,980,1180].forEach((f,i) => setTimeout(() => tone(f,'sine',.28,.1), i*78)); },
    lose:  () => { [260,210,155].forEach((f,i) => setTimeout(() => tone(f,'sawtooth',.2,.1), i*92)); },
    tick:  () => tone(860,'square',.06,.07),
    click: () => tone(320,'sine',.06,.06),
  };
}