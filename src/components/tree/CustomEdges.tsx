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

  // Build a single SVG path.
  // When all children share the same row, draw a single horizontal bar
  // connecting them for a clean visual. When children span multiple rows
  // (e.g. a sibling who married into a deeper generation), draw individual
  // elbow arms from the stem hub so lines never cross ambiguously.
  const allSameRow = children.every((c) => c.topY === children[0].topY);

  let d = `M ${stemX} ${stemTopY} L ${stemX} ${branchY}`;

  if (children.length === 1) {
    const c = children[0];
    d += ` L ${c.x} ${branchY} L ${c.x} ${c.topY}`;
  } else if (allSameRow) {
    // All children on the same row: horizontal bar + vertical drops.
    // The bar must extend to stemX so the stem is never left floating.
    const leftX = Math.min(stemX, children[0].x);
    const rightX = Math.max(stemX, children[children.length - 1].x);
    d += ` M ${leftX} ${branchY} L ${rightX} ${branchY}`;
    for (const c of children) {
      d += ` M ${c.x} ${branchY} L ${c.x} ${c.topY}`;
    }
  } else {
    // Children on different rows: individual elbow arms from the stem hub
    for (const c of children) {
      d += ` M ${stemX} ${branchY} L ${c.x} ${branchY} L ${c.x} ${c.topY}`;
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
