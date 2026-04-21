import { type EdgeProps } from "@xyflow/react";

/** Horizontal dashed edge connecting spouses — drawn in the gap between nodes */
export function MarriageEdge({ id, data }: EdgeProps) {
  const { leftX, rightX, lineY, midX, status } = data as {
    leftX: number;
    rightX: number;
    lineY: number;
    midX: number;
    status?: "married" | "divorced" | "widowed";
  };

  const isFormer = status === "divorced" || status === "widowed";
  const stroke = isFormer ? "#9aa3ab" : "#cf7d47";
  const strokeWidth = isFormer ? 1.5 : 2.5;
  const opacity = isFormer ? 0.55 : 1;
  const dash = isFormer ? "2 5" : "7 4";

  return (
    <g opacity={opacity}>
      <path
        id={id}
        d={`M ${leftX} ${lineY} L ${rightX} ${lineY}`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        strokeLinecap="round"
        fill="none"
      />
      {isFormer && (
        <>
          <circle
            cx={midX}
            cy={lineY}
            r={7}
            fill="#ffffff"
            stroke="#9aa3ab"
            strokeWidth={1.2}
          />
          <path
            d={`M ${midX - 3} ${lineY - 3} L ${midX + 3} ${lineY + 3} M ${midX - 3} ${lineY + 3} L ${midX + 3} ${lineY - 3}`}
            stroke="#7c878f"
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </g>
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
