use criterion::{black_box, criterion_group, criterion_main, Criterion};
use std::fs;
use tempfile::TempDir;

fn benchmark_calculate_directory_hash(c: &mut Criterion) {
    let temp_dir = TempDir::new().unwrap();
    let test_dir = temp_dir.path().join("test_skill");
    fs::create_dir(&test_dir).unwrap();
    
    // Create test files
    for i in 0..100 {
        fs::write(test_dir.join(format!("file{}.txt", i)), format!("content {}", i)).unwrap();
    }
    
    c.bench_function("calculate_directory_hash_100_files", |b| {
        b.iter(|| {
            agent_skills_manager::modules::file_operations::calculate_directory_hash(
                black_box(&test_dir)
            )
        });
    });
}

fn benchmark_copy_directory(c: &mut Criterion) {
    let temp_dir = TempDir::new().unwrap();
    let src = temp_dir.path().join("src");
    let dest = temp_dir.path().join("dest");
    fs::create_dir(&src).unwrap();
    
    // Create nested structure
    for i in 0..50 {
        let subdir = src.join(format!("subdir{}", i));
        fs::create_dir(&subdir).unwrap();
        fs::write(subdir.join("file.txt"), "content").unwrap();
    }
    
    c.bench_function("copy_directory_50_subdirs", |b| {
        b.iter(|| {
            let _ = fs::remove_dir_all(&dest);
            agent_skills_manager::modules::file_operations::copy_directory(
                black_box(&src),
                black_box(&dest)
            )
        });
    });
}

criterion_group!(benches, benchmark_calculate_directory_hash, benchmark_copy_directory);
criterion_main!(benches);
