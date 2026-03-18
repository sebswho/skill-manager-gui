use sha2::{Digest, Sha256};
use std::fs;
use std::io::{self, Read};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, thiserror::Error)]
pub enum FileError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    #[error("WalkDir error: {0}")]
    WalkDir(#[from] walkdir::Error),
    #[error("Path is not a valid symlink")]
    NotASymlink,
    #[error("Target path does not exist")]
    TargetNotExists,
}

pub type Result<T> = std::result::Result<T, FileError>;

/// Create a symbolic link from `link_path` pointing to `target_path`
pub fn create_symlink(target_path: &Path, link_path: &Path) -> Result<()> {
    if !target_path.exists() {
        return Err(FileError::TargetNotExists);
    }
    
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(target_path, link_path)?;
    }
    
    #[cfg(windows)]
    {
        if target_path.is_dir() {
            std::os::windows::fs::symlink_dir(target_path, link_path)?;
        } else {
            std::os::windows::fs::symlink_file(target_path, link_path)?;
        }
    }
    
    Ok(())
}

/// Remove a symbolic link (does not delete the target)
pub fn remove_symlink(link_path: &Path) -> Result<()> {
    if !is_symlink(link_path)? {
        return Err(FileError::NotASymlink);
    }
    fs::remove_file(link_path)?;
    Ok(())
}

/// Check if path is a symbolic link
pub fn is_symlink(path: &Path) -> Result<bool> {
    let metadata = fs::symlink_metadata(path)?;
    Ok(metadata.file_type().is_symlink())
}

/// Get the target of a symbolic link
pub fn get_symlink_target(link_path: &Path) -> Result<String> {
    if !is_symlink(link_path)? {
        return Err(FileError::NotASymlink);
    }
    let target = fs::read_link(link_path)?;
    Ok(target.to_string_lossy().to_string())
}

/// Copy directory recursively
pub fn copy_directory(src: &Path, dest: &Path) -> Result<()> {
    fs::create_dir_all(dest)?;
    
    for entry in WalkDir::new(src).min_depth(1) {
        let entry = entry?;
        let path = entry.path();
        let relative_path = path.strip_prefix(src).unwrap();
        let dest_path = dest.join(relative_path);
        
        if entry.file_type().is_dir() {
            fs::create_dir_all(&dest_path)?;
        } else {
            if let Some(parent) = dest_path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(path, dest_path)?;
        }
    }
    
    Ok(())
}

/// Delete directory recursively
pub fn delete_directory(path: &Path) -> Result<()> {
    if path.exists() {
        fs::remove_dir_all(path)?;
    }
    Ok(())
}

/// Calculate a hash of directory contents for comparison
pub fn calculate_directory_hash(path: &Path) -> Result<String> {
    let mut hasher = Sha256::new();
    
    let mut entries: Vec<_> = WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .collect();
    
    // Sort for consistent hashing
    entries.sort_by(|a, b| a.path().cmp(b.path()));
    
    for entry in entries {
        let relative_path = entry.path().strip_prefix(path).unwrap();
        hasher.update(relative_path.to_string_lossy().as_bytes());
        
        let mut file = fs::File::open(entry.path())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        hasher.update(&buffer);
    }
    
    Ok(format!("{:x}", hasher.finalize()))
}

/// Check if path is inside another path (prevents escaping)
pub fn is_path_inside(child: &Path, parent: &Path) -> bool {
    match child.canonicalize() {
        Ok(child_canon) => match parent.canonicalize() {
            Ok(parent_canon) => child_canon.starts_with(&parent_canon),
            Err(_) => false,
        },
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_copy_directory() {
        let temp_dir = TempDir::new().unwrap();
        let src = temp_dir.path().join("src");
        let dest = temp_dir.path().join("dest");

        fs::create_dir(&src).unwrap();
        fs::write(src.join("file.txt"), "hello world").unwrap();

        copy_directory(&src, &dest).unwrap();

        assert!(dest.exists());
        assert!(dest.join("file.txt").exists());
        assert_eq!(fs::read_to_string(dest.join("file.txt")).unwrap(), "hello world");
    }

    #[test]
    fn test_delete_directory() {
        let temp_dir = TempDir::new().unwrap();
        let dir = temp_dir.path().join("test_dir");

        fs::create_dir(&dir).unwrap();
        fs::write(dir.join("file.txt"), "content").unwrap();

        assert!(dir.exists());

        delete_directory(&dir).unwrap();

        assert!(!dir.exists());
    }

    #[test]
    fn test_calculate_directory_hash() {
        let temp_dir = TempDir::new().unwrap();
        let dir = temp_dir.path().join("hash_test");

        fs::create_dir(&dir).unwrap();
        fs::write(dir.join("a.txt"), "hello").unwrap();
        fs::write(dir.join("b.txt"), "world").unwrap();

        let hash = calculate_directory_hash(&dir).unwrap();

        // Hash should be deterministic
        let hash2 = calculate_directory_hash(&dir).unwrap();
        assert_eq!(hash, hash2);

        // Changing content should change hash
        fs::write(dir.join("a.txt"), "modified").unwrap();
        let hash3 = calculate_directory_hash(&dir).unwrap();
        assert_ne!(hash, hash3);
    }
}
