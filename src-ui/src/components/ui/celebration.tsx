/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 * Agent Skills Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Agent Skills Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Agent Skills Manager.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface CelebrationProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const VIBRANT_COLORS = [
  '#E11D48', // Vibrant rose
  '#2563EB', // Engagement blue
  '#10B981', // Success green
  '#F59E0B', // Amber
  '#A78BFA', // Purple
  '#FB7185', // Pink
];

export function Celebration({
  isActive,
  duration = 2000,
  particleCount = 50,
  onComplete,
}: CelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Generate particles
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: 50, // Center of screen (percentage)
      y: 50,
      color: VIBRANT_COLORS[Math.floor(Math.random() * VIBRANT_COLORS.length)],
      size: Math.random() * 10 + 5,
      velocityX: (Math.random() - 0.5) * 20,
      velocityY: (Math.random() - 0.5) * 20 - 10,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    setParticles(newParticles);

    // Animate particles
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        setParticles([]);
        onComplete?.();
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.velocityX * 0.1,
          y: p.y + p.velocityY * 0.1 + progress * 20, // Gravity
          rotation: p.rotation + p.rotationSpeed,
          opacity: 1 - progress,
          velocityY: p.velocityY + 0.5, // Acceleration
        }))
      );

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isActive, duration, particleCount, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: '2px',
            transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            opacity: particle.opacity,
            boxShadow: `0 0 10px ${particle.color}`,
          }}
        />
      ))}
    </div>,
    document.body
  );
}

// Sparkle effect for smaller celebrations
interface SparkleProps {
  isActive: boolean;
  duration?: number;
}

export function Sparkle({ isActive, duration = 800 }: SparkleProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (!isActive) {
      setSparkles([]);
      return;
    }

    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 200,
    }));

    setSparkles(newSparkles);

    const timer = setTimeout(() => {
      setSparkles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, duration]);

  if (!isActive || sparkles.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute w-2 h-2 bg-vibrant-amber rounded-full animate-bounce-in"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}ms`,
            boxShadow: '0 0 10px #F59E0B, 0 0 20px #F59E0B',
          }}
        />
      ))}
    </div>,
    document.body
  );
}
