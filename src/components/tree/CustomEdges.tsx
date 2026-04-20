import { type EdgeProps } from "@xyflow/react";

/** Horizontal dashed edge connecting spouses — drawn in the gap between nodes */
export function MarriageEdge({ id, data }: EdgeProps) {
  const { leftX, rightX, lineY } = data as {
    leftX: number;
    rightX: number;
    lineY: number;
    midX: number;
  };

  return (
    <path
      id={id}
      d={`M ${leftX} ${lineY} L ${rightX} ${lineY}`}
      stroke="#cf7d47"
      strokeWidth={2.5}
      strokeDasharray="7 4"
      strokeLinecap="round"
      fill="none"
    />
  );
}

/** Edge from single parent to child.
 *  Uses data.branchY when available (to match sibling fork bends),
 *  otherwise bends 30px below parent. */
export function ParentChildEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const { branchY } = (data ?? {}) as { branchY?: number };
  const by = branchY ?? sourceY + 30;

  const d =
    Math.abs(sourceX - targetX) < 2
      ? `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
      : `M ${sourceX} ${sourceY} L ${sourceX} ${by} L ${targetX} ${by} L ${targetX} ${targetY}`;

  return (
    <path
      id={id}
      d={d}
      stroke="#6d7d8c"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

/** Single edge for an entire family fork: stem from couple bottom,
 *  horizontal bar across all children, vertical drops to each child */
export function FamilyForkEdge({ id, data }: EdgeProps) {
  const { stemX, stemTopY, branchY, children } = data as {
    stemX: number;
    stemTopY: number;
    branchY: number;
    children: { x: number; topY: number }[];
  };

  // Build a single SVG path:
  // 1. Vertical stem from parent bottom down to branch Y
  let d = `M ${stemX} ${stemTopY} L ${stemX} ${branchY}`;

  if (children.length === 1) {
    // Single child: continue straight down
    const c = children[0];
    d += ` L ${c.x} ${branchY} L ${c.x} ${c.topY}`;
  } else {
    // Multiple children: horizontal bar from leftmost to rightmost
    const leftX = children[0].x;
    const rightX = children[children.length - 1].x;
    d += ` M ${leftX} ${branchY} L ${rightX} ${branchY}`;

    // Vertical drop from bar to each child
    for (const c of children) {
      d += ` M ${c.x} ${branchY} L ${c.x} ${c.topY}`;
    }
  }

  return (
    <path
      id={id}
      d={d}
      stroke="#5f6368"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}
