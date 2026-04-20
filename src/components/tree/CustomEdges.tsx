import { type EdgeProps, BaseEdge } from "@xyflow/react";

/** Horizontal dashed edge connecting spouses — drawn in the gap between nodes */
export function MarriageEdge({ data, ...props }: EdgeProps) {
  const { leftX, rightX, lineY } = data as {
    leftX: number;
    rightX: number;
    lineY: number;
    midX: number;
  };

  const path = `M ${leftX} ${lineY} L ${rightX} ${lineY}`;

  return (
    <BaseEdge
      {...props}
      path={path}
      style={{
        stroke: "#e8915c",
        strokeWidth: 2,
        strokeDasharray: "6 3",
      }}
    />
  );
}

/** Step-style edge from single parent to child */
export function ParentChildEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  ...props
}: EdgeProps) {
  const midY = (sourceY + targetY) / 2;
  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;

  return (
    <BaseEdge
      {...props}
      path={path}
      style={{
        stroke: "#666",
        strokeWidth: 2,
      }}
    />
  );
}

/** Single edge for an entire family fork: stem from marriage midpoint,
 *  horizontal bar across all children, vertical drops to each child */
export function FamilyForkEdge({ data, ...props }: EdgeProps) {
  const { stemX, stemTopY, branchY, children } = data as {
    stemX: number;
    stemTopY: number;
    branchY: number;
    children: { x: number; topY: number }[];
  };

  // Build a single SVG path:
  // 1. Vertical stem from marriage line center down to branch Y
  let path = `M ${stemX} ${stemTopY} L ${stemX} ${branchY}`;

  if (children.length === 1) {
    // Single child: continue straight down
    const c = children[0];
    path += ` L ${c.x} ${branchY} L ${c.x} ${c.topY}`;
  } else {
    // Multiple children: horizontal bar from leftmost to rightmost
    const leftX = children[0].x;
    const rightX = children[children.length - 1].x;
    path += ` M ${leftX} ${branchY} L ${rightX} ${branchY}`;

    // Vertical drop from bar to each child
    for (const c of children) {
      path += ` M ${c.x} ${branchY} L ${c.x} ${c.topY}`;
    }
  }

  return (
    <BaseEdge
      {...props}
      path={path}
      style={{
        stroke: "#666",
        strokeWidth: 2,
      }}
    />
  );
}
