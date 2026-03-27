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

export interface Skill {
  name: string;
  path: string;
  size: number;
  modified_at: string;
  hash: string;
}

export interface Agent {
  id: string;
  name: string;
  skills_path: string;
  is_discovered: boolean;
}

export type SyncStatus = 'synced' | 'missing' | 'conflict' | 'new';

export interface AgentSkillStatus {
  agent_id: string;
  skill_name: string;
  status: SyncStatus;
  is_symlink: boolean;
  target_path?: string;
}

export type Theme = 'light' | 'dark';
export type Locale = 'zh-CN' | 'en';

export interface AppConfig {
  central_hub_path: string;
  agents: Agent[];
  window_width: number;
  window_height: number;
  theme?: Theme;
  locale?: Locale;
}

export interface SyncMatrix {
  skills: string[];
  agents: string[];
  cells: Record<string, Record<string, SyncStatus>>;
}

export interface Conflict {
  skill_name: string;
  agent_ids: string[];
  message: string;
}

export type PendingChange = 
  | { type: 'add_to_hub'; skill_name: string; source_agent: string }
  | { type: 'sync_to_agent'; skill_name: string; target_agent: string };

export interface ScanResult {
  skills: Skill[];
  agent_statuses: AgentSkillStatus[];
  pending_changes: PendingChange[];
  conflicts: Conflict[];
}

export interface SyncResult {
  success: boolean;
  message: string;
}

export interface SkillVersion {
  agent_id: string;
  agent_name: string;
  size: number;
  modified_at: string;
  path: string;
  hash: string;
}
