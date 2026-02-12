# Phase 2: Rich Text Editor with Plate.js

## Context
Kervana-cartography is a Tauri v2 desktop app for market research. Phase 1 (Core Canvas MVP) is complete. The editor panel currently uses a plain textarea. We need to upgrade to Plate.js for rich text editing.

**IMPORTANT**: We're NOT porting the full plate-notebook-desktop editor (141 files). We need a minimal but functional Plate.js setup for market research notes.

## Reference
The plate-notebook-desktop project at `~/projects/plate-notebook-desktop` has a full Plate.js setup. Use it as reference for patterns, but build a lean version.

## Tasks

### 1. Install Plate.js Dependencies
```bash
bun add platejs @platejs/basic-nodes @platejs/basic-styles @platejs/list @platejs/link @platejs/markdown @platejs/autoformat @platejs/indent @platejs/heading
```

### 2. Create Minimal Plate Editor
Create `src/features/editor/plate-editor.tsx`:
- Basic text editing (paragraphs, headings h1-h3)
- Bold, italic, underline, strikethrough, code
- Bulleted and numbered lists
- Links
- Markdown shortcuts (# for heading, - for list, **bold**, etc.)
- Auto-format support

### 3. Markdown Serialization
- Nodes store markdown in SQLite (the `markdown` field)
- On load: deserialize markdown → Plate.js value
- On save: serialize Plate.js value → markdown string
- Use `@platejs/markdown` for serialization

### 4. Replace Textarea in NoteEditor
- Replace the `<textarea>` in `src/features/editor/note-editor.tsx` with the new PlateEditor component
- Keep all the metadata editing (tags, pain points, etc.) above/below the editor
- Keep debounced auto-save working — serialize to markdown on change, debounce, then save

### 5. Editor Toolbar
Create `src/features/editor/editor-toolbar.tsx`:
- Floating toolbar on text selection (bold, italic, underline, strikethrough, code, link)
- Use Plate.js floating toolbar pattern
- Keep it minimal — no need for block-level toolbar yet

### 6. Wiki-Links (Stretch Goal)
- Support `[[Node Name]]` syntax in the editor
- Render as clickable links that navigate to the referenced node
- Auto-complete node names when typing `[[`
- This can be a follow-up task if time is limited

## Technical Notes
- Use `bun` not npm
- Path alias `@/` maps to `src/`
- Plate.js components should go in `src/features/editor/`
- Shared Plate primitives can go in `src/components/plate/` if needed
- Reference `~/projects/plate-notebook-desktop/src/features/editor/` for patterns
- After changes: `bun run build` must pass with zero errors
- Run `./node_modules/.bin/biome check --write src/` for linting
- Git commit with descriptive message
- Push to origin/master

## Definition of Done
- Rich text editor with headings, lists, bold/italic/underline, links
- Markdown serialization (load/save from SQLite)
- Floating selection toolbar
- Auto-save still works
- `bun run build` passes
- Biome lint passes
- Committed and pushed
