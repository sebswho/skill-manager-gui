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

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface MascotProps {
  message: string;
  emotion?: 'happy' | 'excited' | 'thinking' | 'celebrating';
  position?: 'bottom-right' | 'bottom-left' | 'center';
  dismissible?: boolean;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function Mascot({
  message,
  emotion = 'happy',
  position = 'bottom-right',
  dismissible = true,
  onDismiss,
  actionLabel,
  onAction,
  className,
}: MascotProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [emotion]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  const emotionColors = {
    happy: 'from-vibrant-rose to-vibrant-pink',
    excited: 'from-vibrant-amber to-vibrant-rose',
    thinking: 'from-vibrant-blue to-vibrant-purple',
    celebrating: 'from-vibrant-green to-vibrant-blue',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex items-end gap-3',
        positionClasses[position],
        isAnimating && 'animate-bounce-in',
        className
      )}
    >
      {/* Message Bubble */}
      <div
        className={cn(
          'relative max-w-sm p-4 rounded-3xl shadow-clay-lg',
          'bg-card border-2 border-primary/10',
          'animate-float'
        )}
      >
        {/* Close button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Message */}
        <p className="text-sm font-body text-foreground pr-6 mb-3">{message}</p>

        {/* Action Button */}
        {actionLabel && onAction && (
          <Button
            size="sm"
            onClick={onAction}
            className="bg-gradient-to-r from-vibrant-rose to-vibrant-pink hover:opacity-90"
          >
            {actionLabel}
          </Button>
        )}

        {/* Bubble pointer */}
        <div
          className={cn(
            'absolute -bottom-2 right-8 w-0 h-0',
            'border-l-8 border-l-transparent',
            'border-r-8 border-r-transparent',
            'border-t-8 border-t-card'
          )}
        />
      </div>

      {/* Mascot Avatar */}
      <div className="relative">
        {/* Glow effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-lg opacity-50',
            `bg-gradient-to-br ${emotionColors[emotion]}`
          )}
        />

        {/* Avatar */}
        <div
          className={cn(
            'relative w-16 h-16 rounded-full',
            'bg-gradient-to-br',
            emotionColors[emotion],
            'flex items-center justify-center',
            'shadow-clay',
            'animate-wiggle cursor-pointer',
            'hover:scale-110 transition-transform'
          )}
        >
          {/* Robot face */}
          <div className="relative">
            {/* Eyes */}
            <div className="flex gap-2 mb-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            {/* Mouth */}
            <div
              className={cn(
                'w-4 h-1 bg-white rounded-full',
                emotion === 'happy' && 'rounded-b-full',
                emotion === 'excited' && 'rounded-full h-2',
                emotion === 'thinking' && 'rounded-r-full',
                emotion === 'celebrating' && 'rounded-full w-5'
              )}
            />
          </div>

          {/* Sparkle decoration for celebrating */}
          {emotion === 'celebrating' && (
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-vibrant-amber animate-spin-slow" />
          )}
        </div>
      </div>
    </div>
  );
}

// Mini mascot for inline use
interface MiniMascotProps {
  size?: 'sm' | 'md' | 'lg';
  emotion?: 'happy' | 'thinking';
  className?: string;
}

export function MiniMascot({ size = 'md', emotion = 'happy', className }: MiniMascotProps) {
  const sizeConfig = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const emotionColors = {
    happy: 'from-vibrant-rose to-vibrant-pink',
    thinking: 'from-vibrant-blue to-vibrant-purple',
  };

  return (
    <div
      className={cn(
        'relative rounded-full',
        sizeConfig[size],
        'bg-gradient-to-br',
        emotionColors[emotion],
        'flex items-center justify-center',
        'shadow-clay-sm',
        className
      )}
    >
      {/* Robot face - simplified */}
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
      </div>
    </div>
  );
}
