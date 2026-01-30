---
name: supabase
description: "Supabase CLI."
metadata:
  moltbot:
    emoji: "⚡"
    category: "development"
    requires:
      bins: ["supabase"]
    install:
      - id: "brew"
        kind: "brew"
        formula: "supabase/tap/supabase"
        os: ["darwin", "linux"]
      - id: "scoop"
        kind: "scoop"
        formula: "supabase"
        os: ["win32"]
      - id: "node"
        kind: "node"
        package: "supabase"
---
