// Copyright (C) 2024 sebswho
// This file is part of Agent Skills Manager.
// Agent Skills Manager is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Agent Skills Manager is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with Agent Skills Manager.  If not, see <https://www.gnu.org/licenses/>.

use tauri_plugin_dialog::DialogExt;

/// Open a directory picker dialog
#[tauri::command]
pub async fn pick_directory(window: tauri::Window) -> Result<Option<String>, String> {
    let result = window
        .dialog()
        .file()
        .set_title("Select Agent Skills Directory")
        .set_directory("~")
        .blocking_pick_folder();

    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Open a directory picker dialog with a default path
#[tauri::command]
pub async fn pick_directory_with_default(
    window: tauri::Window,
    default_path: String,
) -> Result<Option<String>, String> {
    let default_path_buf = std::path::PathBuf::from(&default_path);
    
    let result = window
        .dialog()
        .file()
        .set_title("Select Agent Skills Directory")
        .set_directory(default_path_buf)
        .blocking_pick_folder();

    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}
