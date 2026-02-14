/**
 * Mock Tauri IPC for E2E tests running in browser (no Tauri backend).
 * Injected via page.addInitScript() before each test.
 */

// Seed data
const SEED_NODES = [
  {
    id: "root",
    label: "Health & Wellness",
    level: "core-market",
    color: "#3b82f6",
    markdown: "# Health & Wellness\n\nA broad market covering physical and mental wellbeing.",
    tags: ["health", "wellness", "lifestyle"],
    painPoints: ["Information overload", "Expensive solutions"],
    audiences: ["Adults 25-55", "Health-conscious consumers"],
    marketSize: null,
    competition: "high",
    validationScore: 72,
    parentId: null,
    researchStatus: "complete",
    x: 400,
    y: 50,
    width: 200,
    height: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fitness",
    label: "Fitness & Exercise",
    level: "sub-market",
    color: "#10b981",
    markdown: "## Fitness\n\nHome workouts, gym memberships, personal training.",
    tags: ["fitness", "exercise", "gym"],
    painPoints: ["Expensive gym memberships", "Lack of motivation"],
    audiences: ["Adults 20-40", "Remote workers"],
    marketSize: null,
    competition: "medium",
    validationScore: 65,
    parentId: "root",
    researchStatus: "in-progress",
    x: 200,
    y: 250,
    width: 200,
    height: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "nutrition",
    label: "Nutrition & Diet",
    level: "sub-market",
    color: "#eab308",
    markdown: "## Nutrition\n\nMeal planning, supplements, dietary guidance.",
    tags: ["nutrition", "diet", "food"],
    painPoints: ["Conflicting dietary advice", "Expensive organic food"],
    audiences: ["Health enthusiasts", "Parents"],
    marketSize: null,
    competition: "medium",
    validationScore: 58,
    parentId: "root",
    researchStatus: "not-started",
    x: 600,
    y: 250,
    width: 200,
    height: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "sleep",
    label: "Sleep Optimization",
    level: "niche",
    color: "#a855f7",
    markdown: "",
    tags: ["sleep"],
    painPoints: [],
    audiences: [],
    marketSize: null,
    competition: null,
    validationScore: null,
    parentId: "fitness",
    researchStatus: "not-started",
    x: 100,
    y: 450,
    width: 200,
    height: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const SEED_EDGES = [
  { id: "e1", sourceId: "root", targetId: "fitness", color: "#10b981" },
  { id: "e2", sourceId: "root", targetId: "nutrition", color: "#eab308" },
  { id: "e3", sourceId: "fitness", targetId: "sleep", color: "#a855f7" },
];

// In-memory state
let nodes = JSON.parse(JSON.stringify(SEED_NODES));
let edges = JSON.parse(JSON.stringify(SEED_EDGES));
let nodeCounter = 100;

// Mock IPC handler
function handleInvoke(cmd: string, args: any): any {
  switch (cmd) {
    case "get_all_nodes":
      return nodes;

    case "get_node":
      return nodes.find((n: any) => n.id === args.id) || null;

    case "create_node": {
      const input = args.input;
      const newNode = {
        id: `node_${++nodeCounter}`,
        label: input.label,
        level: input.level || "niche",
        color: input.color || "#6b7280",
        markdown: "",
        tags: [],
        painPoints: [],
        audiences: [],
        marketSize: null,
        competition: null,
        validationScore: null,
        parentId: input.parentId || null,
        researchStatus: "not-started",
        x: input.x || 0,
        y: input.y || 0,
        width: 200,
        height: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      nodes.push(newNode);
      return newNode;
    }

    case "update_node": {
      const idx = nodes.findIndex((n: any) => n.id === args.id);
      if (idx >= 0) {
        nodes[idx] = { ...nodes[idx], ...args.input, updatedAt: Date.now() };
        return nodes[idx];
      }
      throw new Error("Node not found");
    }

    case "delete_node":
      nodes = nodes.filter((n: any) => n.id !== args.id);
      edges = edges.filter((e: any) => e.sourceId !== args.id && e.targetId !== args.id);
      return null;

    case "get_edges":
      return edges;

    case "create_edge": {
      const newEdge = {
        id: `edge_${++nodeCounter}`,
        sourceId: args.sourceId,
        targetId: args.targetId,
        color: args.color || "#6b7280",
      };
      edges.push(newEdge);
      return newEdge;
    }

    case "delete_edge":
      edges = edges.filter((e: any) => e.id !== args.id);
      return null;

    case "search_nodes": {
      const q = (args.query || "").toLowerCase();
      return nodes.filter((n: any) => n.label.toLowerCase().includes(q));
    }

    case "get_ai_provider":
      return { provider: "mock", available: true };

    case "get_embedding_status":
      return { embeddedNodes: nodes.length, totalNodes: nodes.length, coverage: 100, providerAvailable: true };

    case "embed_node":
      return { status: "embedded", node_id: args.nodeId, dimensions: 768 };

    case "embed_all_nodes":
      return { total: nodes.length, embedded: nodes.length, skipped: 0, errors: 0 };

    case "find_similar_nodes":
      return nodes
        .filter((n: any) => n.id !== args.nodeId)
        .slice(0, args.topK || 3)
        .map((n: any) => ({ nodeId: n.id, label: n.label, level: n.level, similarity: 0.85 }));

    case "start_research":
      return {
        id: `job_${Date.now()}`,
        nodeId: args.nodeId,
        jobType: args.jobType,
        status: "COMPLETED",
        resultJson: JSON.stringify({
          suggestions: [
            {
              label: "Test Sub-Niche",
              description: "A test suggestion",
              pain_points: ["Test pain"],
              audiences: ["Test audience"],
              competition_level: "low",
              keywords: ["test"],
            },
          ],
        }),
        errorMessage: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

    case "get_research_status":
      return { id: args.jobId, status: "COMPLETED" };

    case "get_research_results":
      return [];

    case "cancel_research":
      return null;

    case "import_obsidian_canvas":
      return { nodesCreated: 0, edgesCreated: 0, errors: [] };

    default:
      console.warn(`[tauri-mock] Unknown command: ${cmd}`);
      return null;
  }
}

export const TAURI_MOCK_SCRIPT = `
  // Mock Tauri IPC
  const SEED_NODES = ${JSON.stringify(SEED_NODES)};
  const SEED_EDGES = ${JSON.stringify(SEED_EDGES)};
  let _nodes = JSON.parse(JSON.stringify(SEED_NODES));
  let _edges = JSON.parse(JSON.stringify(SEED_EDGES));
  let _nc = 100;

  window.__TAURI_INTERNALS__ = {
    invoke: function(cmd, args) {
      args = args || {};
      return new Promise(function(resolve, reject) {
        try {
          let result;
          switch(cmd) {
            case "get_all_nodes": result = _nodes; break;
            case "get_node": result = _nodes.find(n => n.id === args.id); break;
            case "create_node": {
              const i = args.input;
              const n = { id: "node_" + (++_nc), label: i.label, level: i.level || "niche", color: i.color || "#6b7280", markdown: "", tags: [], painPoints: [], audiences: [], marketSize: null, competition: null, validationScore: null, parentId: i.parentId || null, researchStatus: "not-started", x: i.x || 0, y: i.y || 0, width: 200, height: 100, createdAt: Date.now(), updatedAt: Date.now() };
              _nodes.push(n);
              result = n;
              break;
            }
            case "update_node": {
              const idx = _nodes.findIndex(n => n.id === args.id);
              if (idx >= 0) { _nodes[idx] = Object.assign({}, _nodes[idx], args.input, { updatedAt: Date.now() }); result = _nodes[idx]; }
              else reject("Node not found");
              break;
            }
            case "delete_node":
              _nodes = _nodes.filter(n => n.id !== args.id);
              _edges = _edges.filter(e => e.sourceId !== args.id && e.targetId !== args.id);
              result = null; break;
            case "get_edges": result = _edges; break;
            case "create_edge": {
              const e = { id: "edge_" + (++_nc), sourceId: args.sourceId, targetId: args.targetId, color: args.color || "#6b7280" };
              _edges.push(e);
              result = e; break;
            }
            case "delete_edge":
              _edges = _edges.filter(e => e.id !== args.id);
              result = null; break;
            case "search_nodes":
              result = _nodes.filter(n => n.label.toLowerCase().includes((args.query||"").toLowerCase())); break;
            case "get_ai_provider":
              result = { provider: "mock", available: true }; break;
            case "get_embedding_status":
              result = { embeddedNodes: _nodes.length, totalNodes: _nodes.length, coverage: 100, providerAvailable: true }; break;
            case "embed_node":
              result = { status: "embedded", node_id: args.nodeId, dimensions: 768 }; break;
            case "embed_all_nodes":
              result = { total: _nodes.length, embedded: _nodes.length, skipped: 0, errors: 0 }; break;
            case "find_similar_nodes":
              result = _nodes.filter(n => n.id !== args.nodeId).slice(0, args.topK || 3).map(n => ({ nodeId: n.id, label: n.label, level: n.level, similarity: 0.85 })); break;
            case "start_research":
              result = { id: "job_" + Date.now(), nodeId: args.nodeId, jobType: args.jobType, status: "COMPLETED", resultJson: '{"suggestions":[{"label":"Test Niche","description":"test","pain_points":["pain"],"audiences":["aud"],"competition_level":"low","keywords":["kw"]}]}', errorMessage: null, createdAt: Date.now(), updatedAt: Date.now() }; break;
            case "get_research_status":
              result = { id: args.jobId, status: "COMPLETED" }; break;
            case "get_research_results":
              result = []; break;
            case "cancel_research":
              result = null; break;
            case "import_obsidian_canvas":
              result = { nodesCreated: 0, edgesCreated: 0, errors: [] }; break;
            default:
              console.warn("[mock] Unknown: " + cmd);
              result = null;
          }
          resolve(result);
        } catch(e) { reject(e); }
      });
    },
    metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
  };
`;
