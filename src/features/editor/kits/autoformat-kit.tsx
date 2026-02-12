import type { AutoformatRule } from "@platejs/autoformat";
import {
  AutoformatPlugin,
  autoformatArrow,
  autoformatPunctuation,
  autoformatSmartQuotes,
} from "@platejs/autoformat";
import { toggleList } from "@platejs/list";
import { KEYS } from "platejs";

const autoformatMarks: AutoformatRule[] = [
  { match: "**", mode: "mark", type: KEYS.bold },
  { match: "__", mode: "mark", type: KEYS.underline },
  { match: "*", mode: "mark", type: KEYS.italic },
  { match: "~~", mode: "mark", type: KEYS.strikethrough },
  { match: "`", mode: "mark", type: KEYS.code },
];

const autoformatBlocks: AutoformatRule[] = [
  { match: "# ", mode: "block", type: KEYS.h1 },
  { match: "## ", mode: "block", type: KEYS.h2 },
  { match: "### ", mode: "block", type: KEYS.h3 },
  { match: "> ", mode: "block", type: KEYS.blockquote },
  { match: ["---", "—-", "___ "], mode: "block", type: KEYS.hr },
];

const autoformatLists: AutoformatRule[] = [
  {
    match: ["* ", "- "],
    mode: "block",
    type: "list",
    format: (editor) => toggleList(editor, { listStyleType: KEYS.ul }),
  },
  {
    match: [String.raw`^\d+\.$ `, String.raw`^\d+\)$ `],
    matchByRegex: true,
    mode: "block",
    type: "list",
    format: (editor) => toggleList(editor, { listStyleType: KEYS.ol }),
  },
];

export const AutoformatKit = [
  AutoformatPlugin.configure({
    options: {
      enableUndoOnDelete: true,
      rules: [
        ...autoformatBlocks,
        ...autoformatMarks,
        ...autoformatSmartQuotes,
        ...autoformatPunctuation,
        ...autoformatArrow,
        ...autoformatLists,
      ].map(
        (rule): AutoformatRule => ({
          ...rule,
          query: (editor) =>
            !editor.api.some({
              match: { type: editor.getType(KEYS.codeBlock) },
            }),
        }),
      ),
    },
  }),
];
