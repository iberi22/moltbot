import argparse
import subprocess
import shutil
import sys
import os
import json

def check_command(cmd):
    return shutil.which(cmd) is not None

def get_available_strategies():
    strategies = {}

    # Check Docker
    if check_command("docker"):
        try:
            res = subprocess.run(["docker", "--version"], capture_output=True, text=True)
            if res.returncode == 0:
                strategies["docker"] = True
        except:
            pass

    # Check GitHub CLI
    if check_command("gh"):
        strategies["github"] = True # Basic check, auth might be needed

    # Check Local Cargo
    if check_command("cargo"):
        strategies["local"] = True

    return strategies

def build_local(source_dir):
    print(f"Building locally in {source_dir}...")
    try:
        subprocess.check_call(["cargo", "build", "--release"], cwd=source_dir)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Local build failed: {e}")
        return False

def build_docker(source_dir):
    print(f"Building with Docker in {source_dir}...")
    abs_source = os.path.abspath(source_dir)
    # Using rust:latest image
    # Mounting source dir to /usr/src/myapp
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{abs_source}:/usr/src/myapp",
        "-w", "/usr/src/myapp",
        # Cache for cargo registry to speed up subsequent builds?
        # For simplicity, just build.
        "rust:latest",
        "cargo", "build", "--release"
    ]
    try:
        subprocess.check_call(cmd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Docker build failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Rust Infrastructure Manager")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Check command
    parser_check = subparsers.add_parser("check")

    # Build command
    parser_build = subparsers.add_parser("build")
    parser_build.add_argument("--source", required=True, help="Path to Cargo.toml directory")
    parser_build.add_argument("--output", help="Destination for the binary")
    parser_build.add_argument("--strategy", choices=["docker", "github", "local"], help="Force strategy")

    args = parser.parse_args()

    if args.command == "check":
        strategies = get_available_strategies()
        print(json.dumps(strategies, indent=2))
        return

    if args.command == "build":
        available = get_available_strategies()
        strategy = args.strategy

        if not strategy:
            # Priority: Docker > Local (faster than GH usually) > GitHub
            if available.get("docker"):
                strategy = "docker"
            elif available.get("local"):
                strategy = "local"
            elif available.get("github"):
                strategy = "github"
            else:
                print(json.dumps({"error": "No build capability found. Please install Docker or Rust."}))
                sys.exit(1)

        print(f"Selected strategy: {strategy}")

        success = False
        if strategy == "docker":
            success = build_docker(args.source)
        elif strategy == "local":
            success = build_local(args.source)
        elif strategy == "github":
            print("GitHub strategy not yet implemented")
            sys.exit(1)

        if success:
            # If output is specified, copy the binary there.
            # Binary name inference is tricky without parsing Cargo.toml,
            # so for now we rely on the skill providing the right output path or default location.
            # Assuming standard cargo layout: target/release/<project_name>.exe

            # Simple heuristic: find the newest executable in target/release
            target_release = os.path.join(args.source, "target", "release")
            if args.output and os.path.exists(target_release):
                # Find .exe or binary files
                files = [os.path.join(target_release, f) for f in os.listdir(target_release)
                         if os.path.isfile(os.path.join(target_release, f)) and
                         (f.endswith(".exe") or "." not in f)] # Valid for windows/linux

                if files:
                    # Get most recently modified
                    newest = max(files, key=os.path.getmtime)
                    print(f"Found binary: {newest}")
                    shutil.copy2(newest, args.output)
                    print(f"Copied to {args.output}")
                else:
                    print("Build successful but could not auto-locate binary to copy.")

            print(json.dumps({"status": "success", "strategy": strategy}))
        else:
            print(json.dumps({"status": "error", "message": "Build failed"}))
            sys.exit(1)

if __name__ == "__main__":
    main()
