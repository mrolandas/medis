import { type EdgeProps, BaseEdge, getStraightPath } from "@xyflow/react";

/** Horizontal dashed edge connecting spouses */
export function MarriageEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  ...props
}: EdgeProps) {
  // Use midpoint Y for a straight horizontal line
  const midY = (sourceY + targetY) / 2;
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY: midY,
    targetX,
    targetY: midY,
  });

  return (
    <BaseEdge
      {...props}
      path={edgePath}
      style={{
        stroke: "#e8915c",
        strokeWidth: 2,
        strokeDasharray: "6 3",
      }}
    />
  );
}

/** Vertical solid edge connecting parent to child */
export function ParentChildEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  ...props
}: EdgeProps) {
  // Step-style path: go down from source, then across, then down to target
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

/** Edge from the midpoint of a marriage line down to a child */
export function FamilyChildEdge({ data, ...props }: EdgeProps) {
  const { midX, midY, childX, childY } = data as {
    midX: number;
    midY: number;
    childX: number;
    childY: number;
  };

  // Vertical drop from marriage midpoint, then across to child, then down
  const dropY = midY + 30;
  const path = `M ${midX} ${midY} L ${midX} ${dropY} L ${childX} ${dropY} L ${childX} ${childY}`;

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
