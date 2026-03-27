use skilltoon::modules::file_operations::*;
use std::fs;
use tempfile::TempDir;

#[test]
fn test_create_and_verify_symlink() {
    let temp_dir = TempDir::new().unwrap();
    let target = temp_dir.path().join("target_dir");
    let link = temp_dir.path().join("link_dir");
    
    fs::create_dir(&target).unwrap();
    fs::write(target.join("test.txt"), "hello").unwrap();
    
    create_symlink(&target, &link).unwrap();
    
    assert!(is_symlink(&link).unwrap());
    
    let resolved = get_symlink_target(&link).unwrap();
    assert!(resolved.contains("target_dir"));
}

#[test]
fn test_calculate_directory_hash() {
    let temp_dir = TempDir::new().unwrap();
    let test_dir = temp_dir.path().join("test_skill");
    fs::create_dir(&test_dir).unwrap();
    fs::write(test_dir.join("file1.txt"), "content1").unwrap();
    fs::write(test_dir.join("file2.txt"), "content2").unwrap();
    
    let hash1 = calculate_directory_hash(&test_dir).unwrap();
    let hash2 = calculate_directory_hash(&test_dir).unwrap();
    assert_eq!(hash1, hash2);
    
    // Modify file should change hash
    fs::write(test_dir.join("file1.txt"), "modified").unwrap();
    let hash3 = calculate_directory_hash(&test_dir).unwrap();
    assert_ne!(hash1, hash3);
}

#[test]
fn test_copy_and_delete_directory() {
    let temp_dir = TempDir::new().unwrap();
    let src = temp_dir.path().join("src");
    let dest = temp_dir.path().join("dest");
    
    fs::create_dir(&src).unwrap();
    fs::create_dir(src.join("subdir")).unwrap();
    fs::write(src.join("file.txt"), "content").unwrap();
    fs::write(src.join("subdir/nested.txt"), "nested").unwrap();
    
    copy_directory(&src, &dest).unwrap();
    
    assert!(dest.join("file.txt").exists());
    assert!(dest.join("subdir/nested.txt").exists());
    
    delete_directory(&dest).unwrap();
    assert!(!dest.exists());
}
