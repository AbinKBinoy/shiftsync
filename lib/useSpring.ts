'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './motion';

type SpringConfig = {
  stiffness?: number;
  damping?: number;
};

// A small, dependency-free damped-spring integrator (semi-implicit Euler).
// Used anywhere motion needs to continuously chase a moving target — cursor
// position, a toggling boolean's numeric target — rather than animate once
// between two fixed end states. A CSS transition can't do this: there's no
// single fixed "end" when the target itself keeps changing underneath it.
//
// Carrying velocity across target changes (rather than resetting to 0 each
// time) is what makes this interruptible: if the target flips again
// mid-flight — the user scrolls back past a section, or moves the cursor
// again before the tilt settles — motion continues smoothly from wherever
// it currently is instead of snapping or restarting from rest.
export function useSpring(
  target: number,
  { stiffness = 170, damping = 26 }: SpringConfig = {}
): number {
  const reducedMotion = useRef(prefersReducedMotion());
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const velocityRef = useRef(0);
  const targetRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Written here rather than during render — mutating a ref while
    // rendering is unsafe (React may re-run a render without committing
    // it), and this is only ever read from the rAF loop below anyway,
    // which already only runs after an effect has committed.
    targetRef.current = target;

    if (reducedMotion.current) {
      valueRef.current = target;
      setValue(target);
      return;
    }

    // Already animating — the running loop reads targetRef.current fresh
    // every frame, so it'll pick up this new target on its own without
    // needing a second loop started here.
    if (frameRef.current !== null) return;

    let lastTime = performance.now();

    function step(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const delta = targetRef.current - valueRef.current;
      const springForce = delta * stiffness;
      const dampingForce = velocityRef.current * damping;
      const acceleration = springForce - dampingForce;

      velocityRef.current += acceleration * dt;
      valueRef.current += velocityRef.current * dt;

      const atRest =
        Math.abs(targetRef.current - valueRef.current) < 0.001 &&
        Math.abs(velocityRef.current) < 0.001;

      if (atRest) {
        valueRef.current = targetRef.current;
        velocityRef.current = 0;
        setValue(valueRef.current);
        frameRef.current = null;
        return;
      }

      setValue(valueRef.current);
      frameRef.current = requestAnimationFrame(step);
    }

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [target, stiffness, damping]);

  return value;
}
