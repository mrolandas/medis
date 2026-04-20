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
      stroke="#e8915c"
      strokeWidth={2}
      strokeDasharray="6 3"
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
  const { branchY, parentX, childX, parentBottomY, childTopY } = (data ??
    {}) as {
    branchY?: number;
    parentX?: number;
    childX?: number;
    parentBottomY?: number;
    childTopY?: number;
  };

  // Use precise coordinates from layout when available
  const sx = parentX ?? sourceX;
  const sy = parentBottomY ?? sourceY;
  const tx = childX ?? targetX;
  const ty = childTopY ?? targetY;
  const by = branchY ?? sy + 30;

  const d =
    Math.abs(sx - tx) < 2
      ? `M ${sx} ${sy} L ${tx} ${ty}`
      : `M ${sx} ${sy} L ${sx} ${by} L ${tx} ${by} L ${tx} ${ty}`;

  return <path id={id} d={d} stroke="#666" strokeWidth={2} fill="none" />;
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

  return <path id={id} d={d} stroke="#666" strokeWidth={2} fill="none" />;
}
