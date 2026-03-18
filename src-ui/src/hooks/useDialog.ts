import { invoke } from '@tauri-apps/api/core';

export function useDialog() {
  const pickDirectory = async (): Promise<string | null> => {
    try {
      const result = await invoke<string | null>('pick_directory');
      return result;
    } catch (error) {
      console.error('Failed to pick directory:', error);
      return null;
    }
  };

  const pickDirectoryWithDefault = async (defaultPath: string): Promise<string | null> => {
    try {
      const result = await invoke<string | null>('pick_directory_with_default', {
        defaultPath,
      });
      return result;
    } catch (error) {
      console.error('Failed to pick directory:', error);
      return null;
    }
  };

  return {
    pickDirectory,
    pickDirectoryWithDefault,
  };
}
