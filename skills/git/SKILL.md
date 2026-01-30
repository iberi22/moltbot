---
name: git
description: "Distributed version control system."
metadata:
  moltbot:
    emoji: "🌲"
    category: "development"
    mandatory: true
    requires:
      bins: ["git"]
    install:
      - id: "brew"
        kind: "brew"
        formula: "git"
        os: ["darwin", "linux"]
      - id: "scoop"
        kind: "scoop"
        formula: "git"
        os: ["win32"]
      - id: "choco"
        kind: "choco"
        package: "git"
        os: ["win32"]
      - id: "apt"
        kind: "apt"
        package: "git"
        os: ["linux"]
---
