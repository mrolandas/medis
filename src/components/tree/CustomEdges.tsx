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

/** Edge from center of marriage line down to a child */
export function FamilyChildEdge({ data, ...props }: EdgeProps) {
  const { midX, startY, branchY, childX, childY } = data as {
    midX: number;
    startY: number;
    branchY: number;
    childX: number;
    childY: number;
  };

  // From marriage line center → drop below parents → horizontal to child → down to child
  const path = `M ${midX} ${startY} L ${midX} ${branchY} L ${childX} ${branchY} L ${childX} ${childY}`;

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
