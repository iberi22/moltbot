---
description: Build and test a Rust-based skill
---
To build a Rust skill, follow these steps:

1.  Navigate to the skill's source directory (where Cargo.toml is located).
    For example: `cd skills/my-rust-skill`

2.  Run the release build command:
    ```bash
    cargo build --release
    ```

3.  Verify the binary was created:
    - Windows: `target/release/my-rust-skill.exe`
    - Linux/Mac: `target/release/my-rust-skill`

4.  (Optional) Run tests if available:
    ```bash
    cargo test
    ```

5.  Copy the binary to the root `bin` folder (or where SKILL.md expects it) if necessary, or update SKILL.md to point to `target/release/...`.
