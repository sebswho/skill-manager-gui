// Copyright (C) 2024 sebswho
// This file is part of Skilltoon.
// Skilltoon is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Skilltoon is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with Skilltoon.  If not, see <https://www.gnu.org/licenses/>.

use sha2::{Digest, Sha256};
use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
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
/// Works for both existing and non-existing paths
/// IMPORTANT: This checks the literal path location, NOT where a symlink points to
pub fn is_path_inside(child: &Path, parent: &Path) -> bool {
    // Always use normalized paths for comparison
    // This prevents traversal attacks without resolving symlinks
    // (we want to check if the symlink is located in the parent, not where it points)
    match normalize_path(child) {
        Some(child_norm) => match normalize_path(parent) {
            Some(parent_norm) => child_norm.starts_with(&parent_norm),
            None => false,
        },
        None => false,
    }
}

/// Check if path is inside another path, resolving symlinks for existing paths
/// This is more secure but requires paths to exist
/// Use this when you need to verify the actual target of a symlink
pub fn is_path_inside_resolved(child: &Path, parent: &Path) -> bool {
    // Try to resolve both paths if they exist
    let child_resolved = if child.exists() {
        match child.canonicalize() {
            Ok(c) => c,
            Err(_) => return false,
        }
    } else {
        match normalize_path(child) {
            Some(c) => c,
            None => return false,
        }
    };

    let parent_resolved = if parent.exists() {
        match parent.canonicalize() {
            Ok(p) => p,
            Err(_) => return false,
        }
    } else {
        match normalize_path(parent) {
            Some(p) => p,
            None => return false,
        }
    };

    child_resolved.starts_with(&parent_resolved)
}

/// Validate that a path is safe to operate on
/// This combines both literal and resolved checks for maximum security
pub fn validate_path_safety(child: &Path, parent: &Path) -> Result<()> {
    // First check literal path (fast, no filesystem access)
    if !is_path_inside(child, parent) {
        // If literal check fails, check resolved (for symlink cases)
        if !is_path_inside_resolved(child, parent) {
            return Err(FileError::Io(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "Path traversal detected: path is outside allowed directory"
            )));
        }
    }
    Ok(())
}

/// Check if a path component is suspicious (contains escape sequences)
pub fn is_suspicious_path_component(name: &std::ffi::OsStr) -> bool {
    let name_str = name.to_string_lossy();
    
    // Check for common path traversal patterns
    let suspicious_patterns = [
        "..",
        "~",
        "$HOME",
        "${HOME}",
        "%HOME%",
        "%USERPROFILE%",
    ];
    
    for pattern in suspicious_patterns.iter() {
        if name_str.contains(pattern) {
            return true;
        }
    }
    
    // Check for null bytes (potential null byte injection)
    if name_str.contains('\0') {
        return true;
    }
    
    false
}

/// Normalize a path without requiring it to exist
/// Resolves . and .. components, and checks for traversal sequences
fn normalize_path(path: &Path) -> Option<PathBuf> {
    let mut normalized = PathBuf::new();
    
    for component in path.components() {
        match component {
            std::path::Component::Prefix(_) => normalized.push(component),
            std::path::Component::RootDir => normalized.push(component),
            std::path::Component::CurDir => {}, // Skip .
            std::path::Component::ParentDir => {
                // Check if we would escape the root
                if !normalized.pop() {
                    return None; // Attempted to go above root
                }
            }
            std::path::Component::Normal(name) => {
                normalized.push(name);
            }
        }
    }
    
    Some(normalized)
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

    #[test]
    fn test_is_path_inside_basic() {
        let parent = Path::new("/home/user/skills");
        let child = Path::new("/home/user/skills/my-skill");
        assert!(is_path_inside(child, parent));

        let outside = Path::new("/etc/passwd");
        assert!(!is_path_inside(outside, parent));
    }

    #[test]
    fn test_is_path_inside_traversal() {
        let parent = Path::new("/home/user/skills");
        let traversal = Path::new("/home/user/skills/../../../etc/passwd");
        
        // normalize_path should handle this
        assert!(!is_path_inside(traversal, parent));
    }

    #[test]
    fn test_is_path_inside_resolved() {
        let temp_dir = TempDir::new().unwrap();
        let parent = temp_dir.path().join("skills");
        let child = temp_dir.path().join("skills/my-skill");
        let outside = temp_dir.path().join("outside");
        
        fs::create_dir_all(&parent).unwrap();
        fs::create_dir_all(&child).unwrap();
        fs::create_dir_all(&outside).unwrap();
        
        // Both exist - should resolve canonical paths
        assert!(is_path_inside_resolved(&child, &parent));
        assert!(!is_path_inside_resolved(&outside, &parent));
    }

    #[test]
    fn test_is_path_inside_resolved_symlink() {
        let temp_dir = TempDir::new().unwrap();
        let real_parent = temp_dir.path().join("real-skills");
        let link_parent = temp_dir.path().join("linked-skills");
        let child = link_parent.join("my-skill");
        
        fs::create_dir_all(&real_parent).unwrap();
        
        // Create symlink
        #[cfg(unix)]
        std::os::unix::fs::symlink(&real_parent, &link_parent).unwrap();
        #[cfg(windows)]
        std::os::windows::fs::symlink_dir(&real_parent, &link_parent).unwrap();
        
        // The symlink parent should resolve to the real parent
        // Note: child doesn't exist, so we test the symlink resolution of the parent
        // When we resolve link_parent, it should point to real_parent
        assert!(is_path_inside_resolved(&link_parent, &real_parent));
        
        // Also test that a file inside the linked parent is considered inside real parent
        // when we use the link path
        let real_child = real_parent.join("real-skill");
        fs::create_dir_all(&real_child).unwrap();
        let linked_child = link_parent.join("real-skill");
        assert!(is_path_inside_resolved(&linked_child, &real_parent));
    }

    #[test]
    fn test_validate_path_safety() {
        let temp_dir = TempDir::new().unwrap();
        let parent = temp_dir.path().join("skills");
        let child = temp_dir.path().join("skills/safe-skill");
        let outside = temp_dir.path().join("outside");
        
        fs::create_dir_all(&parent).unwrap();
        fs::create_dir_all(&child).unwrap();
        fs::create_dir_all(&outside).unwrap();
        
        // Safe path should pass
        assert!(validate_path_safety(&child, &parent).is_ok());
        
        // Outside path should fail
        assert!(validate_path_safety(&outside, &parent).is_err());
    }

    #[test]
    fn test_is_suspicious_path_component() {
        // Normal names should be fine
        assert!(!is_suspicious_path_component(std::ffi::OsStr::new("my-skill")));
        assert!(!is_suspicious_path_component(std::ffi::OsStr::new("skill_v1")));
        
        // Suspicious patterns should be caught
        assert!(is_suspicious_path_component(std::ffi::OsStr::new("..")));
        assert!(is_suspicious_path_component(std::ffi::OsStr::new("skill/../other")));
        assert!(is_suspicious_path_component(std::ffi::OsStr::new("~")));
        assert!(is_suspicious_path_component(std::ffi::OsStr::new("$HOME/skill")));
    }
}
