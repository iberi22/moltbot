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
      - id: "scoop"
        kind: "scoop"
        formula: "supabase"
      - id: "node"
        kind: "node"
        package: "supabase"
---
