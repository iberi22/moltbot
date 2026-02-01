---
name: rust-infra
description: Build system and infrastructure management for Rust skills.
metadata: {"openclaw":{"emoji":"🏗️","requires":{"bins":["python"]}}}
---

# Rust Infrastructure

Manages the compilation and environment setup for Rust-based skills. It automatically detects the best build strategy (Docker, GitHub, or Local).

## Commands

### Build Project
```bash
python skills/rust-infra/scripts/build.py build --source <path_to_source> --output <path_to_output>
```
Compiles a Rust project.
- `--source`: Path to the directory containing Cargo.toml
- `--output`: (Optional) Path where the final binary should be placed. Defaults to `target/release`.
- `--strategy`: (Optional) Force specific strategy: `docker`, `github`, `local`.

### Check Environment
```bash
python skills/rust-infra/scripts/build.py check
```
Reports available build strategies on the host.

### Setup Environment
```bash
python skills/rust-infra/scripts/build.py setup --strategy <strategy>
```
Attempts to configure a build strategy (e.g. install rustup locally).
