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
