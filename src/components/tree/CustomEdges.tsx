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
