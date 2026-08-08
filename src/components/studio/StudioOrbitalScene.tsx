'use client';

import { useEffect, useRef } from 'react';

/**
 * A deliberately lightweight 3D scene for the Studio landing page.
 * It uses CSS 3D transforms rather than WebGL so the Studio shell remains
 * fast, works without a GPU, and respects reduced-motion preferences.
 */
export function StudioOrbitalScene() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (event: PointerEvent) => {
      const bounds = scene.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      scene.style.setProperty('--studio-tilt-x', `${y * -8}deg`);
      scene.style.setProperty('--studio-tilt-y', `${x * 10}deg`);
    };
    const onLeave = () => {
      scene.style.setProperty('--studio-tilt-x', '0deg');
      scene.style.setProperty('--studio-tilt-y', '0deg');
    };

    scene.addEventListener('pointermove', onMove);
    scene.addEventListener('pointerleave', onLeave);
    return () => {
      scene.removeEventListener('pointermove', onMove);
      scene.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={sceneRef} className="studio-orbit-scene" aria-hidden="true">
      <div className="studio-orbit-grid" />
      <div className="studio-orbit-ring studio-orbit-ring-one" />
      <div className="studio-orbit-ring studio-orbit-ring-two" />
      <div className="studio-orbit-ring studio-orbit-ring-three" />
      <div className="studio-orbit-core">
        <div className="studio-orbit-core-inner">
          <span>MAKE</span>
          <span>LOCAL</span>
        </div>
      </div>
      <div className="studio-orbit-satellite studio-orbit-satellite-one">✦</div>
      <div className="studio-orbit-satellite studio-orbit-satellite-two">⌁</div>
      <div className="studio-orbit-satellite studio-orbit-satellite-three">+</div>
      <div className="studio-orbit-label studio-orbit-label-one">BRIEF</div>
      <div className="studio-orbit-label studio-orbit-label-two">CUT</div>
      <div className="studio-orbit-label studio-orbit-label-three">CAPTION</div>
    </div>
  );
}
