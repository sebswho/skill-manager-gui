# Performance Testing

## Benchmarks

### Running Benchmarks

```bash
cd src-tauri
cargo bench
```

### Current Benchmarks

| Benchmark | Description | Target |
|-----------|-------------|--------|
| calculate_directory_hash_100_files | Hash 100 files in a skill | < 100ms |
| copy_directory_50_subdirs | Copy 50 subdirectories | < 500ms |

## Performance Guidelines

### Skill Scanning

- **Target:** Scan 100 skills in < 1 second
- **Measured:** ~0.5s for 100 skills (varies by size)

### Sync Operations

- **Target:** Sync single skill in < 500ms
- **Batch:** Sync 10 skills in < 3 seconds

### UI Performance

- **Target:** UI remains responsive during sync
- **Strategy:** Use async operations with loading indicators

## Large-Scale Testing

Tested scenarios:

| Skills | Agents | Sync Time | Status |
|--------|--------|-----------|--------|
| 10 | 3 | ~2s | ✅ PASS |
| 50 | 5 | ~8s | ✅ PASS |
| 100 | 5 | ~15s | ✅ PASS |

## Optimization Tips

1. **Directory Hashing:** Uses SHA256 with sorted entries for consistency
2. **Batch Operations:** Sync multiple skills in parallel where possible
3. **Lazy Loading:** UI components load data on demand
4. **Caching:** Config and scan results cached in memory

## Profiling

To profile the application:

```bash
# Rust profiling
cd src-tauri
cargo build --release
# Use perf, flamegraph, or other Rust profilers

# Frontend profiling
# Use Chrome DevTools Performance tab
```
