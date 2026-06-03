"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";

/**
 * Hypothesis Tree View — Manual tree editor for M0.
 * §7.9: Governing hypothesis at root, MECE children, falsifiable leaves.
 * Each leaf carries prioritization_score = impact × ease × confidence_gap.
 */

interface HypothesisNode {
  id: string;
  claim: string;
  status: "untested" | "in_testing" | "supported" | "refuted" | "deprioritized";
  children: HypothesisNode[];
}

const STATUS_STYLES: Record<string, string> = {
  untested: "bg-gray-100 text-gray-600 border-gray-200",
  in_testing: "bg-blue-50 text-blue-700 border-blue-200",
  supported: "bg-green-50 text-green-700 border-green-200",
  refuted: "bg-red-50 text-red-700 border-red-200",
  deprioritized: "bg-gray-50 text-gray-400 border-gray-100",
};

const STATUS_ICONS: Record<string, string> = {
  untested: "○",
  in_testing: "◐",
  supported: "●",
  refuted: "✕",
  deprioritized: "—",
};

export function HypothesisTreeView() {
  const [governing, setGoverning] = useState("");
  const [children, setChildren] = useState<HypothesisNode[]>([]);

  const addChild = (parentChildren: HypothesisNode[], setFn: (nodes: HypothesisNode[]) => void) => {
    setFn([
      ...parentChildren,
      { id: uuid(), claim: "", status: "untested", children: [] },
    ]);
  };

  const updateNode = (
    nodes: HypothesisNode[],
    id: string,
    updates: Partial<HypothesisNode>
  ): HypothesisNode[] => {
    return nodes.map((node) => {
      if (node.id === id) return { ...node, ...updates };
      return { ...node, children: updateNode(node.children, id, updates) };
    });
  };

  const addChildToNode = (nodes: HypothesisNode[], parentId: string): HypothesisNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [
            ...node.children,
            { id: uuid(), claim: "", status: "untested" as const, children: [] },
          ],
        };
      }
      return { ...node, children: addChildToNode(node.children, parentId) };
    });
  };

  const removeNode = (nodes: HypothesisNode[], id: string): HypothesisNode[] => {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => ({ ...n, children: removeNode(n.children, id) }));
  };

  return (
    <div className="space-y-6">
      {/* Governing hypothesis */}
      <div className="card border-l-4 border-l-accent-500">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
            H₀
          </div>
          <div className="flex-1">
            <label className="label">Governing Hypothesis</label>
            <textarea
              className="input-field h-16 text-base font-medium"
              placeholder="e.g., We can restore 8% EBIT margin by FY27 through operational excellence and market repositioning"
              value={governing}
              onChange={(e) => setGoverning(e.target.value)}
            />
            <p className="text-xs text-navy-400 mt-1">
              This is the top-level answer to the strategic question. All
              sub-hypotheses must support or refute this.
            </p>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-navy-800">Sub-Hypotheses</h3>
          <div className="flex gap-2">
            <button
              onClick={() => addChild(children, setChildren)}
              className="btn-primary text-sm"
            >
              + Add Branch
            </button>
            <button className="btn-secondary text-sm">
              🤖 AI: Suggest MECE Breakdown
            </button>
          </div>
        </div>

        {children.length === 0 && (
          <div className="text-center py-12 card text-navy-300">
            <p className="text-lg mb-2">Build your hypothesis tree</p>
            <p className="text-sm">
              Break the governing hypothesis into MECE sub-hypotheses. Each leaf
              must be falsifiable.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {children.map((node, i) => (
            <HypothesisBranch
              key={node.id}
              node={node}
              depth={0}
              index={i}
              onUpdate={(id, updates) =>
                setChildren(updateNode(children, id, updates))
              }
              onAddChild={(parentId) =>
                setChildren(addChildToNode(children, parentId))
              }
              onRemove={(id) => setChildren(removeNode(children, id))}
            />
          ))}
        </div>
      </div>

      {/* MECE check */}
      <div className="card bg-navy-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-navy-800">MECE Validation</h4>
            <p className="text-xs text-navy-500 mt-0.5">
              Run the MECE linter to check for gaps and overlaps in your
              hypothesis tree.
            </p>
          </div>
          <button className="btn-primary text-sm">
            ✓ Run MECE Check
          </button>
        </div>
      </div>

      {/* Gate G3 */}
      <div className="card border-2 border-green-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-green-800">
              Gate G3: Hypothesis Tree Approval
            </h4>
            <p className="text-xs text-green-600 mt-0.5">
              The most important gate. Bad tree = wasted analysis.
            </p>
          </div>
          <button className="btn-primary bg-green-600 hover:bg-green-700 text-sm">
            ✓ Approve Tree
          </button>
        </div>
      </div>
    </div>
  );
}

function HypothesisBranch({
  node,
  depth,
  index,
  onUpdate,
  onAddChild,
  onRemove,
}: {
  node: HypothesisNode;
  depth: number;
  index: number;
  onUpdate: (id: string, updates: Partial<HypothesisNode>) => void;
  onAddChild: (parentId: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className={`card border-l-4 ${STATUS_STYLES[node.status]} group`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-center">
            <div className="text-lg">{STATUS_ICONS[node.status]}</div>
            <div className="text-xs text-navy-400 mt-0.5">H{depth + 1}.{index + 1}</div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              className="w-full bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0 placeholder:text-gray-400"
              placeholder="Enter sub-hypothesis..."
              value={node.claim}
              onChange={(e) => onUpdate(node.id, { claim: e.target.value })}
            />
            <div className="flex items-center gap-3 mt-1.5">
              <select
                value={node.status}
                onChange={(e) =>
                  onUpdate(node.id, { status: e.target.value as HypothesisNode["status"] })
                }
                className="text-xs border rounded px-2 py-1"
              >
                <option value="untested">Untested</option>
                <option value="in_testing">In Testing</option>
                <option value="supported">Supported</option>
                <option value="refuted">Refuted</option>
                <option value="deprioritized">Deprioritized</option>
              </select>
              <button
                onClick={() => onAddChild(node.id)}
                className="text-xs text-accent-600 hover:text-accent-700"
              >
                + Sub-hypothesis
              </button>
              <button
                onClick={() => onRemove(node.id)}
                className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
      {node.children.map((child, i) => (
        <HypothesisBranch
          key={child.id}
          node={child}
          depth={depth + 1}
          index={i}
          onUpdate={onUpdate}
          onAddChild={onAddChild}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
