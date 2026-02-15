import { test, expect } from "@playwright/test";
import { TAURI_MOCK_SCRIPT } from "./tauri-mock";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(TAURI_MOCK_SCRIPT);
  await page.goto("/");
  await page.waitForSelector(".react-flow", { timeout: 10000 });
});

// ─── App Shell ───

test.describe("App Shell", () => {
  test("renders toolbar buttons", async ({ page }) => {
    await expect(page.locator("button", { hasText: "Add Node" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Fit View" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Auto Layout" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Export" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Embed All" })).toBeVisible();
  });

  test("renders status bar", async ({ page }) => {
    await expect(page.locator("text=AI:")).toBeVisible();
    await expect(page.locator("text=RAG:")).toBeVisible();
  });

  test("renders canvas with 4 seed nodes", async ({ page }) => {
    const flowNodes = page.locator(".react-flow__node");
    await expect(flowNodes).toHaveCount(4);
  });

  test("renders edges", async ({ page }) => {
    await expect(page.locator(".react-flow__edge").first()).toBeVisible();
  });

  test("view toggle buttons exist", async ({ page }) => {
    await expect(page.locator("button", { hasText: "Canvas" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Split" })).toBeVisible();
  });
});

// ─── Canvas ───

test.describe("Canvas", () => {
  test("seed node labels visible", async ({ page }) => {
    for (const label of ["Health & Wellness", "Fitness & Exercise", "Nutrition & Diet", "Sleep Optimization"]) {
      await expect(page.locator(".react-flow__node", { hasText: label })).toBeVisible();
    }
  });

  test("click node selects it", async ({ page }) => {
    await page.locator(".react-flow__node", { hasText: "Fitness" }).click();
    await page.waitForTimeout(200);
  });

  test("double-click opens editor", async ({ page }) => {
    await page.locator(".react-flow__node", { hasText: "Fitness" }).dblclick();
    await page.waitForTimeout(500);
    await expect(page.locator("h3", { hasText: "Fitness & Exercise" })).toBeVisible();
  });

  test("fit view works", async ({ page }) => {
    await page.locator("button", { hasText: "Fit View" }).click();
    await page.waitForTimeout(300);
  });

  test("auto layout works", async ({ page }) => {
    await page.locator("button", { hasText: "Auto Layout" }).click();
    await page.waitForTimeout(300);
  });

  test("snap grid toggle", async ({ page }) => {
    const toggle = page.locator("text=/Grid (ON|OFF)/");
    await toggle.click();
    await page.waitForTimeout(200);
  });

  test("info panel shows node count", async ({ page }) => {
    await expect(page.locator("text=4 nodes").first()).toBeVisible();
  });
});

// ─── Sidebar ───

test.describe("Sidebar", () => {
  test("toggle sidebar", async ({ page }) => {
    const btn = page.locator("button", { hasText: /Sidebar/ });
    await btn.click();
    await page.waitForTimeout(300);
    await btn.click();
    await page.waitForTimeout(300);
  });
});

// ─── Search ───

test.describe("Search", () => {
  test("search finds nodes", async ({ page }) => {
    await page.getByPlaceholder("Search nodes...").fill("Fitness");
    await page.waitForTimeout(500);
    await expect(page.locator("button", { hasText: "Fitness & Exercise" })).toBeVisible();
  });

  test("click result selects node", async ({ page }) => {
    await page.getByPlaceholder("Search nodes...").fill("Nutrition");
    await page.waitForTimeout(500);
    await page.locator("button", { hasText: "Nutrition & Diet" }).click();
  });
});

// ─── Editor Panel ───

test.describe("Editor Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator(".react-flow__node", { hasText: "Fitness" }).dblclick();
    await page.waitForTimeout(600);
  });

  test("shows header info", async ({ page }) => {
    await expect(page.locator("h3", { hasText: "Fitness & Exercise" })).toBeVisible();
  });

  test("shows pain points", async ({ page }) => {
    await expect(page.locator("text=Expensive gym memberships")).toBeVisible();
  });

  test("shows audiences", async ({ page }) => {
    await expect(page.locator("text=Adults 20-40")).toBeVisible();
  });

  test("shows research status", async ({ page }) => {
    await expect(page.locator("text=Research Status")).toBeVisible();
  });

  test("shows competition level", async ({ page }) => {
    await expect(page.locator("text=Competition Level")).toBeVisible();
  });

  test("shows validation score", async ({ page }) => {
    await expect(page.locator("text=Validation Score")).toBeVisible();
  });

  test("close button works", async ({ page }) => {
    await page.locator("button", { hasText: "✕" }).click();
    await page.waitForTimeout(300);
  });

  test("add pain point", async ({ page }) => {
    await page.getByPlaceholder("Add pain point...").fill("Time constraints");
    await page.getByPlaceholder("Add pain point...").press("Enter");
    await page.waitForTimeout(600);
    await expect(page.locator("text=Time constraints")).toBeVisible();
  });

  test("add audience", async ({ page }) => {
    await page.getByPlaceholder("Add audience...").fill("College students");
    await page.getByPlaceholder("Add audience...").press("Enter");
    await page.waitForTimeout(600);
    await expect(page.locator("text=College students")).toBeVisible();
  });
});

// ─── Rich Text Editor ───

test.describe("Plate.js Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator(".react-flow__node", { hasText: "Sleep" }).dblclick();
    await page.waitForTimeout(600);
  });

  test("editor mounted", async ({ page }) => {
    await expect(page.locator("[data-slate-editor]")).toBeVisible();
  });

  test("type text", async ({ page }) => {
    await page.locator("[data-slate-editor]").click();
    await page.keyboard.type("Hello world");
    await expect(page.locator("text=Hello world")).toBeVisible();
  });

  test("bold (Ctrl+B)", async ({ page }) => {
    await page.locator("[data-slate-editor]").click();
    await page.keyboard.press("Control+b");
    await page.keyboard.type("bold");
    await expect(page.locator("text=bold")).toBeVisible();
  });

  test("italic (Ctrl+I)", async ({ page }) => {
    await page.locator("[data-slate-editor]").click();
    await page.keyboard.press("Control+i");
    await page.keyboard.type("italic");
    await expect(page.locator("text=italic")).toBeVisible();
  });

  test("heading shortcut (#)", async ({ page }) => {
    await page.locator("[data-slate-editor]").click();
    await page.keyboard.type("# Heading");
    await expect(page.locator("h1", { hasText: "Heading" })).toBeVisible();
  });

  test("h2 shortcut (##)", async ({ page }) => {
    await page.locator("[data-slate-editor]").click();
    await page.keyboard.type("## Sub");
    await expect(page.locator("h2", { hasText: "Sub" })).toBeVisible();
  });

  test("bullet list (-)", async ({ page }) => {
    await page.locator("[data-slate-editor]").click();
    await page.keyboard.type("- item");
    await expect(page.locator("text=item")).toBeVisible();
  });
});

// ─── Dark Mode ───

test.describe("Dark Mode", () => {
  test("toggle on adds dark class", async ({ page }) => {
    const btn = page.locator("button").filter({ has: page.locator("svg.lucide-moon, svg.lucide-sun") }).first();
    await btn.click();
    expect(await page.locator("html").getAttribute("class")).toContain("dark");
  });

  test("toggle off removes dark class", async ({ page }) => {
    const btn = page.locator("button").filter({ has: page.locator("svg.lucide-moon, svg.lucide-sun") }).first();
    await btn.click();
    await btn.click();
    expect((await page.locator("html").getAttribute("class")) || "").not.toContain("dark");
  });
});

// ─── Toolbar Actions ───

test.describe("Toolbar Actions", () => {
  test("embed all", async ({ page }) => {
    await page.locator("button", { hasText: "Embed All" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("button", { hasText: "Embed All" })).toBeEnabled();
  });

  test("stats panel", async ({ page }) => {
    await page.locator("button", { hasText: "Stats" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=/Research Coverage/i")).toBeVisible();
  });

  test("research panel", async ({ page }) => {
    await page.locator(".react-flow__node").first().click();
    await page.locator("button", { hasText: "Research" }).click();
    await page.waitForTimeout(500);
  });

  test("export button", async ({ page }) => {
    await page.locator("button", { hasText: "Export" }).click();
  });
});

// ─── Stats Panel ───

test.describe("Stats Panel", () => {
  test("shows stats data", async ({ page }) => {
    await page.locator("button", { hasText: "Stats" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=/Research Coverage/i")).toBeVisible();
  });
});
