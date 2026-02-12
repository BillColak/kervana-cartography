#!/bin/bash
# Wait for Phase 3 frontend to finish (check for its commit)
echo "Waiting for Phase 3 frontend commit..."
while ! git log --oneline -1 | grep -q "Phase 3 frontend"; do
  sleep 10
done
echo "Phase 3 frontend detected. Starting Phase 4..."
git pull --rebase 2>/dev/null

claude --dangerously-skip-permissions -p "Read PHASE4_TASK.md and CLAUDE.md. Execute ALL tasks. You have full permissions. Install dagre with 'bun add @dagrejs/dagre'. Create auto-layout, export, dark mode, keyboard shortcuts. After all work: run 'bun run build' to verify zero errors, run './node_modules/.bin/biome check --write src/', git add -A && git commit -m 'feat: Phase 4 - auto-layout, export, dark mode, keyboard shortcuts', git push. When finished run: openclaw system event --text 'Done: Phase 4 - auto-layout, export, dark mode, shortcuts' --mode now"
