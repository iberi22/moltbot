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
      - id: "scoop"
        kind: "scoop"
        formula: "git"
      - id: "choco"
        kind: "choco"
        package: "git"
      - id: "apt"
        kind: "apt"
        package: "git"
---
