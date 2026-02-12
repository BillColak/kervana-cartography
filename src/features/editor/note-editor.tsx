import { updateNode } from "@/actions/nodes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import type { CompetitionLevel, ResearchStatus } from "@/types/market";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function NoteEditor() {
  const { nodes, selectedNodeId, selectNode, updateNode: updateStoreNode } = useStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const [markdown, setMarkdown] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus>("not-started");
  const [competition, setCompetition] = useState<CompetitionLevel>("medium");
  const [validationScore, setValidationScore] = useState(0);

  const [newTag, setNewTag] = useState("");
  const [newPainPoint, setNewPainPoint] = useState("");
  const [newAudience, setNewAudience] = useState("");

  // Load node data when selected
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally sync only on node id change
  useEffect(() => {
    if (selectedNode) {
      setMarkdown(selectedNode.markdown);
      setTags(selectedNode.tags);
      setPainPoints(selectedNode.painPoints);
      setAudiences(selectedNode.audiences);
      setResearchStatus(selectedNode.researchStatus);
      setCompetition(selectedNode.competition || "medium");
      setValidationScore(selectedNode.validationScore || 0);
    }
  }, [selectedNode?.id]);

  // Debounced auto-save
  const debouncedMarkdown = useDebounce(markdown, 500);
  const debouncedTags = useDebounce(tags, 500);
  const debouncedPainPoints = useDebounce(painPoints, 500);
  const debouncedAudiences = useDebounce(audiences, 500);
  const debouncedResearchStatus = useDebounce(researchStatus, 500);
  const debouncedCompetition = useDebounce(competition, 500);
  const debouncedValidationScore = useDebounce(validationScore, 500);

  // biome-ignore lint/correctness/useExhaustiveDependencies: auto-save only triggers on debounced value changes
  useEffect(() => {
    if (selectedNode) {
      const updates = {
        markdown: debouncedMarkdown,
        tags: debouncedTags,
        painPoints: debouncedPainPoints,
        audiences: debouncedAudiences,
        researchStatus: debouncedResearchStatus,
        competition: debouncedCompetition,
        validationScore: debouncedValidationScore,
      };

      updateNode(selectedNode.id, updates)
        .then((updatedNode) => {
          updateStoreNode(selectedNode.id, updatedNode);
        })
        .catch(console.error);
    }
  }, [
    debouncedMarkdown,
    debouncedTags,
    debouncedPainPoints,
    debouncedAudiences,
    debouncedResearchStatus,
    debouncedCompetition,
    debouncedValidationScore,
  ]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addPainPoint = () => {
    if (newPainPoint.trim() && !painPoints.includes(newPainPoint.trim())) {
      setPainPoints([...painPoints, newPainPoint.trim()]);
      setNewPainPoint("");
    }
  };

  const removePainPoint = (point: string) => {
    setPainPoints(painPoints.filter((p) => p !== point));
  };

  const addAudience = () => {
    if (newAudience.trim() && !audiences.includes(newAudience.trim())) {
      setAudiences([...audiences, newAudience.trim()]);
      setNewAudience("");
    }
  };

  const removeAudience = (audience: string) => {
    setAudiences(audiences.filter((a) => a !== audience));
  };

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a node to edit
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{selectedNode.label}</h3>
          <p className="text-sm text-gray-500 capitalize">{selectedNode.level}</p>
        </div>
        <Button onClick={() => selectNode(null)} variant="outline" size="sm">
          Close
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Metadata Section */}
        <div className="p-4 space-y-4 border-b border-gray-200 bg-gray-50">
          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag..."
                className="flex-1"
              />
              <Button size="sm" onClick={addTag} disabled={!newTag.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Pain Points */}
          <div className="space-y-2">
            <Label>Pain Points</Label>
            <ul className="space-y-1 mb-2">
              {painPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <span className="flex-1">{point}</span>
                  <button
                    type="button"
                    onClick={() => removePainPoint(point)}
                    className="hover:bg-gray-200 rounded p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={newPainPoint}
                onChange={(e) => setNewPainPoint(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPainPoint()}
                placeholder="Add pain point..."
                className="flex-1"
              />
              <Button size="sm" onClick={addPainPoint} disabled={!newPainPoint.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Audiences */}
          <div className="space-y-2">
            <Label>Target Audiences</Label>
            <ul className="space-y-1 mb-2">
              {audiences.map((audience) => (
                <li key={audience} className="flex items-start gap-2 text-sm">
                  <span className="flex-1">{audience}</span>
                  <button
                    type="button"
                    onClick={() => removeAudience(audience)}
                    className="hover:bg-gray-200 rounded p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAudience()}
                placeholder="Add audience..."
                className="flex-1"
              />
              <Button size="sm" onClick={addAudience} disabled={!newAudience.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Research Status */}
          <div className="space-y-2">
            <Label>Research Status</Label>
            <Select
              value={researchStatus}
              onValueChange={(v) => setResearchStatus(v as ResearchStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Competition Level */}
          <div className="space-y-2">
            <Label>Competition Level</Label>
            <Select
              value={competition}
              onValueChange={(v) => setCompetition(v as CompetitionLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validation Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Validation Score</Label>
              <span className="text-sm font-medium">{validationScore}/100</span>
            </div>
            <Slider
              value={[validationScore]}
              onValueChange={(vals) => setValidationScore(vals[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Markdown Editor */}
        <div className="p-4 flex-1">
          <Label className="mb-2 block">Notes (Markdown)</Label>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-[400px] p-4 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter markdown notes..."
          />
          <p className="text-xs text-gray-500 mt-2">Auto-saves after 500ms</p>
        </div>
      </div>
    </div>
  );
}
