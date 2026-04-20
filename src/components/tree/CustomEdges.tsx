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

/** Edge from single parent to child — straight if aligned, step-style otherwise.
 *  Bend is 30px below parent (matching family fork branchY). */
export function ParentChildEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps) {
  const bendY = sourceY + 30;
  const d =
    Math.abs(sourceX - targetX) < 2
      ? `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
      : `M ${sourceX} ${sourceY} L ${sourceX} ${bendY} L ${targetX} ${bendY} L ${targetX} ${targetY}`;

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
