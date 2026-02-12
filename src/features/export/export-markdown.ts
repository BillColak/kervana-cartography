import type { MarketNodeData } from "@/types/market";

const LEVEL_HEADING: Record<string, string> = {
  root: "#",
  "core-market": "##",
  submarket: "###",
  niche: "####",
  "sub-niche": "#####",
};

export function exportTreeAsMarkdown(
  nodes: MarketNodeData[],
  rootNodes?: MarketNodeData[],
): string {
  const roots = rootNodes || nodes.filter((n) => n.parentId === null);
  const lines: string[] = [];

  lines.push("# Market Research Tree");
  lines.push("");
  lines.push(`*Exported on ${new Date().toLocaleDateString()}*`);
  lines.push("");

  function renderNode(node: MarketNodeData, depth: number) {
    const heading = LEVEL_HEADING[node.level] || "#####";
    lines.push(`${heading} ${node.label}`);
    lines.push("");

    // Metadata
    if (node.tags.length > 0) {
      lines.push(`**Tags:** ${node.tags.join(", ")}`);
    }
    if (node.painPoints.length > 0) {
      lines.push("**Pain Points:**");
      for (const pp of node.painPoints) {
        lines.push(`- ${pp}`);
      }
    }
    if (node.audiences.length > 0) {
      lines.push("**Audiences:**");
      for (const a of node.audiences) {
        lines.push(`- ${a}`);
      }
    }
    if (node.competition) {
      lines.push(`**Competition:** ${node.competition}`);
    }
    if (node.validationScore != null && node.validationScore > 0) {
      lines.push(`**Validation Score:** ${node.validationScore}/100`);
    }
    lines.push(`**Research Status:** ${node.researchStatus}`);
    lines.push("");

    // Node markdown content
    if (node.markdown.trim()) {
      lines.push(node.markdown.trim());
      lines.push("");
    }

    lines.push("---");
    lines.push("");

    // Children
    const children = nodes.filter((n) => n.parentId === node.id);
    for (const child of children) {
      renderNode(child, depth + 1);
    }
  }

  for (const root of roots) {
    renderNode(root, 0);
  }

  return lines.join("\n");
}

export function exportTreeAsJson(nodes: MarketNodeData[]): string {
  return JSON.stringify(nodes, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
