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

import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillNavItemProps {
  name: string;
  isSelected: boolean;
  status: 'synced' | 'unsynced' | 'conflict';
  onClick: () => void;
}

export function SkillNavItem({ name, isSelected, status, onClick }: SkillNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-150',
        'border-l-2',
        isSelected
          ? 'bg-slate-700 border-green-400 text-slate-100'
          : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      )}
    >
      <span className="flex-1 font-mono truncate text-left">{name}</span>
      <StatusIcon status={status} />
    </button>
  );
}

function StatusIcon({ status }: { status: 'synced' | 'unsynced' | 'conflict' }) {
  switch (status) {
    case 'synced':
      return <Check className="w-4 h-4 text-green-400" />;
    case 'conflict':
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    case 'unsynced':
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-slate-600" />;
  }
}
