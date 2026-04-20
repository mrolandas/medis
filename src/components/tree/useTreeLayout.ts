import { useMemo } from "react";
import dagre from "dagre";
import { type Node, type Edge, Position } from "@xyflow/react";
import type { Person, Marriage, ParentChild } from "../../types";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 80;
const SPOUSE_GAP = 80;

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Converts people, marriages, and parent-child relations into
 * React Flow nodes and edges with dagre-computed positions.
 *
 * Layout rules:
 * - Each person is a node
 * - Spouses are placed side-by-side (same rank) with a horizontal marriage edge
 * - Parent-child connections are vertical edges
 * - Multiple marriages: person appears once, with edges to each spouse
 */
export function useTreeLayout(
  people: Person[],
  marriages: Marriage[],
  parentChild: ParentChild[],
  selectedPersonId: string | null,
): LayoutResult {
  return useMemo(() => {
    if (people.length === 0) return { nodes: [], edges: [] };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: "TB",
      nodesep: 60,
      ranksep: 120,
      marginx: 40,
      marginy: 40,
    });

    // Add all person nodes
    for (const person of people) {
      g.setNode(person.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }

    // ── Assign children to marriage forks ──
    // A child belongs to a marriage fork only if BOTH parents are spouses
    // in that marriage (biological/adopted children of the couple).
    const childToMarriageId = new Map<string, string>();
    for (const m of marriages) {
      // Find children who have BOTH spouses as parents
      const children1 = new Set(
        parentChild
          .filter((pc) => pc.parent_id === m.person1_id)
          .map((pc) => pc.child_id),
      );
      for (const pc of parentChild) {
        if (pc.parent_id === m.person2_id && children1.has(pc.child_id)) {
          childToMarriageId.set(pc.child_id, m.id);
        }
      }
    }

    // Build helper lookups
    const personMarriages = new Map<string, Marriage[]>();
    for (const m of marriages) {
      if (!personMarriages.has(m.person1_id))
        personMarriages.set(m.person1_id, []);
      if (!personMarriages.has(m.person2_id))
        personMarriages.set(m.person2_id, []);
      personMarriages.get(m.person1_id)!.push(m);
      personMarriages.get(m.person2_id)!.push(m);
    }

    const marriageChildren = new Map<string, string[]>();
    for (const [childId, mId] of childToMarriageId) {
      if (!marriageChildren.has(mId)) marriageChildren.set(mId, []);
      marriageChildren.get(mId)!.push(childId);
    }

    // Add ALL parent→child edges so dagre naturally places both parents
    // at the same rank (both are parents of the same child)
    for (const pc of parentChild) {
      g.setEdge(pc.parent_id, pc.child_id, { weight: 1 });
    }

    // For childless marriages, add a lightweight invisible link so dagre
    // keeps them at the same rank
    for (const m of marriages) {
      const hasSharedChild = parentChild.some(
        (pc) =>
          (pc.parent_id === m.person1_id &&
            parentChild.some(
              (pc2) =>
                pc2.child_id === pc.child_id && pc2.parent_id === m.person2_id,
            )) ||
          (pc.parent_id === m.person2_id &&
            parentChild.some(
              (pc2) =>
                pc2.child_id === pc.child_id && pc2.parent_id === m.person1_id,
            )),
      );
      if (!hasSharedChild) {
        // Invisible bidirectional hint for same-rank placement
        g.setEdge(m.person1_id, m.person2_id, { weight: 0, minlen: 0 });
        g.setEdge(m.person2_id, m.person1_id, { weight: 0, minlen: 0 });
      }
    }

    dagre.layout(g);

    // ── Post-process layout: top-down family alignment ──
    // Sort marriages by Y so parent generations are processed before children
    const sortedMarriages = [...marriages].sort((a, b) => {
      const ya = Math.min(
        g.node(a.person1_id)?.y ?? 0,
        g.node(a.person2_id)?.y ?? 0,
      );
      const yb = Math.min(
        g.node(b.person1_id)?.y ?? 0,
        g.node(b.person2_id)?.y ?? 0,
      );
      return ya - yb;
    });

    for (const m of sortedMarriages) {
      const n1 = g.node(m.person1_id);
      const n2 = g.node(m.person2_id);
      if (!n1 || !n2) continue;

      // Step 1: Align spouses at same Y, side-by-side with proper spacing
      const sharedY = Math.min(n1.y, n2.y);
      n1.y = sharedY;
      n2.y = sharedY;

      const midX = (n1.x + n2.x) / 2;
      const spacing = NODE_WIDTH / 2 + SPOUSE_GAP / 2;
      if (n1.x <= n2.x) {
        n1.x = midX - spacing;
        n2.x = midX + spacing;
      } else {
        n2.x = midX - spacing;
        n1.x = midX + spacing;
      }

      // Step 2: Center ALL children of either spouse under this couple,
      // including single-parent children. Treat married children as
      // couple units so we shift child + spouse together.
      const allChildIds = new Set<string>();
      for (const pc of parentChild) {
        if (pc.parent_id === m.person1_id || pc.parent_id === m.person2_id) {
          // Don't include the spouses themselves
          if (pc.child_id !== m.person1_id && pc.child_id !== m.person2_id) {
            allChildIds.add(pc.child_id);
          }
        }
      }
      if (allChildIds.size === 0) continue;

      const coupleMidX = (n1.x + n2.x) / 2;
      const shiftNodeIds = new Set<string>();
      let totalCenterX = 0;
      let unitCount = 0;
      const counted = new Set<string>();

      for (const childId of allChildIds) {
        if (counted.has(childId)) continue;
        counted.add(childId);
        const cn = g.node(childId);
        if (!cn) continue;

        shiftNodeIds.add(childId);

        // If this child is married, treat child+spouse as one unit
        const childMarriage = personMarriages.get(childId)?.[0];
        if (childMarriage) {
          const spouseId =
            childMarriage.person1_id === childId
              ? childMarriage.person2_id
              : childMarriage.person1_id;
          const sn = g.node(spouseId);
          if (sn) {
            shiftNodeIds.add(spouseId);
            counted.add(spouseId);
            totalCenterX += (cn.x + sn.x) / 2;
            unitCount++;
            continue;
          }
        }

        totalCenterX += cn.x;
        unitCount++;
      }

      if (unitCount === 0) continue;
      const overallCenterX = totalCenterX / unitCount;
      const shiftX = coupleMidX - overallCenterX;

      for (const nodeId of shiftNodeIds) {
        const node = g.node(nodeId);
        if (node) node.x += shiftX;
      }
    }

    // ── Post-process: resolve node overlaps at same Y level ──
    const marriageChildSet = new Set([...marriageChildren.values()].flat());
    const nodesByY = new Map<number, dagre.Node[]>();
    for (const person of people) {
      const n = g.node(person.id);
      if (!n) continue;
      const yKey = Math.round(n.y);
      if (!nodesByY.has(yKey)) nodesByY.set(yKey, []);
      nodesByY.get(yKey)!.push(n);
    }
    const MIN_GAP = 60;
    for (const row of nodesByY.values()) {
      if (row.length < 2) continue;
      row.sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i++) {
        const prev = row[i - 1];
        const curr = row[i];
        const minDist = NODE_WIDTH + MIN_GAP;
        const actualDist = curr.x - prev.x;
        if (actualDist < minDist) {
          curr.x = prev.x + minDist;
        }
      }
    }

    // ── Build React Flow nodes from final positions ──
    const nodes: Node[] = [];
    for (const person of people) {
      const nodeData = g.node(person.id);
      if (!nodeData) continue;
      nodes.push({
        id: person.id,
        type: "person",
        position: {
          x: nodeData.x - NODE_WIDTH / 2,
          y: nodeData.y - NODE_HEIGHT / 2,
        },
        data: {
          person,
          isSelected: person.id === selectedPersonId,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    }

    // ── Build edges ──
    const edges: Edge[] = [];

    // Marriage edges: horizontal dashed line in the gap between spouses
    for (const m of marriages) {
      const n1 = g.node(m.person1_id);
      const n2 = g.node(m.person2_id);
      if (!n1 || !n2) continue;

      const leftX = Math.min(n1.x, n2.x) + NODE_WIDTH / 2;
      const rightX = Math.max(n1.x, n2.x) - NODE_WIDTH / 2;
      const lineY = (n1.y + n2.y) / 2; // center Y (equal after post-process)
      const midX = (n1.x + n2.x) / 2;

      edges.push({
        id: `marriage-edge-${m.id}`,
        source: m.person1_id,
        target: m.person2_id,
        type: "marriage",
        data: { leftX, rightX, lineY, midX },
        style: { stroke: "#e8915c", strokeWidth: 2 },
      });
    }

    // Parent-child edges
    // For married couples: one "family fork" edge per marriage that draws
    // the complete fork (stem + bar + drops) as a single path.
    // For single parents: individual step-style edges.
    const marriageForkAdded = new Set<string>();
    for (const [mId, childIds] of marriageChildren) {
      if (marriageForkAdded.has(mId)) continue;
      marriageForkAdded.add(mId);

      const marriage = marriages.find((m) => m.id === mId);
      if (!marriage) continue;
      const p1 = g.node(marriage.person1_id);
      const p2 = g.node(marriage.person2_id);
      if (!p1 || !p2) continue;

      const midX = (p1.x + p2.x) / 2;
      const marriageLineY = (p1.y + p2.y) / 2;
      const branchY = Math.max(p1.y, p2.y) + NODE_HEIGHT / 2 + 30;

      // Collect child positions
      const childPositions: { x: number; topY: number }[] = [];
      for (const cId of childIds) {
        const cn = g.node(cId);
        if (cn) {
          childPositions.push({ x: cn.x, topY: cn.y - NODE_HEIGHT / 2 });
        }
      }
      if (childPositions.length === 0) continue;

      // Sort children left-to-right
      childPositions.sort((a, b) => a.x - b.x);

      edges.push({
        id: `pc-fork-${mId}`,
        source: marriage.person1_id,
        target: childIds[0], // React Flow requires source/target
        type: "familyFork",
        data: {
          stemX: midX,
          stemTopY: marriageLineY,
          branchY,
          children: childPositions,
        },
        style: { stroke: "#666", strokeWidth: 2 },
      });
    }

    // Single-parent edges (child has no married parents)
    // Compute branchY per marriage so single-parent bends match fork bends
    const marriageBranchY = new Map<string, number>();
    for (const m of marriages) {
      const p1 = g.node(m.person1_id);
      const p2 = g.node(m.person2_id);
      if (p1 && p2) {
        marriageBranchY.set(m.id, Math.max(p1.y, p2.y) + NODE_HEIGHT / 2 + 30);
      }
    }
    for (const pc of parentChild) {
      if (marriageChildSet.has(pc.child_id)) continue;
      // Find the marriage this parent belongs to, so we can match branchY
      const parentMarriage = marriages.find(
        (m) => m.person1_id === pc.parent_id || m.person2_id === pc.parent_id,
      );
      const branchY = parentMarriage
        ? marriageBranchY.get(parentMarriage.id)
        : undefined;
      const parentNode = g.node(pc.parent_id);
      const childNode = g.node(pc.child_id);
      edges.push({
        id: `pc-edge-${pc.id}`,
        source: pc.parent_id,
        target: pc.child_id,
        type: "parentChild",
        data: {
          branchY,
          parentX: parentNode?.x,
          childX: childNode?.x,
          parentBottomY: parentNode
            ? parentNode.y + NODE_HEIGHT / 2
            : undefined,
          childTopY: childNode ? childNode.y - NODE_HEIGHT / 2 : undefined,
        },
        style: { stroke: "#666", strokeWidth: 2 },
      });
    }

    return { nodes, edges };
  }, [people, marriages, parentChild, selectedPersonId]);
}

// Re-export constants for use in node components
export { NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP };
