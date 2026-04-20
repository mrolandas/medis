import { useMemo } from "react";
import dagre from "dagre";
import { type Node, type Edge, Position } from "@xyflow/react";
import type { Person, Marriage, ParentChild } from "../../types";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 80;
const SPOUSE_GAP = 40;

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

    // Create a map of marriages by sorted person-pair key
    const marriageMap = new Map<string, string[]>();
    for (const m of marriages) {
      const key = [m.person1_id, m.person2_id].sort().join("-");
      if (!marriageMap.has(key)) marriageMap.set(key, []);
      marriageMap.get(key)!.push(m.id);
    }

    // Build a lookup: child_id -> marriage id (if both parents are in a marriage)
    const childToMarriageId = new Map<string, string>();
    for (const pc of parentChild) {
      const otherParents = parentChild
        .filter(
          (other) =>
            other.child_id === pc.child_id && other.parent_id !== pc.parent_id,
        )
        .map((other) => other.parent_id);

      for (const otherParentId of otherParents) {
        const key = [pc.parent_id, otherParentId].sort().join("-");
        const marriageIds = marriageMap.get(key);
        if (marriageIds && marriageIds.length > 0) {
          childToMarriageId.set(pc.child_id, marriageIds[0]);
        }
      }
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

    // ── Post-process: align spouses side-by-side at the same Y ──
    for (const m of marriages) {
      const n1 = g.node(m.person1_id);
      const n2 = g.node(m.person2_id);
      if (n1 && n2) {
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
      }
    }

    // ── Post-process: center children under their parent couple ──
    // Group children by marriage
    const marriageChildren = new Map<string, string[]>();
    for (const [childId, mId] of childToMarriageId) {
      if (!marriageChildren.has(mId)) marriageChildren.set(mId, []);
      marriageChildren.get(mId)!.push(childId);
    }

    for (const [mId, childIds] of marriageChildren) {
      const marriage = marriages.find((m) => m.id === mId);
      if (!marriage) continue;
      const p1 = g.node(marriage.person1_id);
      const p2 = g.node(marriage.person2_id);
      if (!p1 || !p2) continue;

      const coupleMidX = (p1.x + p2.x) / 2;

      // Compute the current center of children and shift them
      const childNodes = childIds
        .map((id) => g.node(id))
        .filter((n): n is dagre.Node => !!n);
      if (childNodes.length === 0) continue;

      const childrenCenterX =
        childNodes.reduce((sum, n) => sum + n.x, 0) / childNodes.length;
      const shiftX = coupleMidX - childrenCenterX;

      for (const cn of childNodes) {
        cn.x += shiftX;
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
    const childEdgeAdded = new Set<string>();
    for (const pc of parentChild) {
      const marriageId = childToMarriageId.get(pc.child_id);
      if (marriageId && !childEdgeAdded.has(pc.child_id)) {
        childEdgeAdded.add(pc.child_id);
        const marriage = marriages.find((m) => m.id === marriageId);
        if (marriage) {
          const p1 = g.node(marriage.person1_id);
          const p2 = g.node(marriage.person2_id);
          const child = g.node(pc.child_id);
          if (p1 && p2 && child) {
            const midX = (p1.x + p2.x) / 2;
            // Marriage line is at center Y of parents
            const marriageLineY = (p1.y + p2.y) / 2;
            // Branch Y is below parent nodes with some spacing
            const branchY = Math.max(p1.y, p2.y) + NODE_HEIGHT / 2 + 20;
            const childTopY = child.y - NODE_HEIGHT / 2;

            edges.push({
              id: `pc-edge-family-${pc.child_id}`,
              source: marriage.person1_id,
              target: pc.child_id,
              type: "familyChild",
              data: {
                midX,
                startY: marriageLineY,
                branchY,
                childX: child.x,
                childY: childTopY,
              },
              style: { stroke: "#666", strokeWidth: 2 },
            });
          }
        }
      } else if (!marriageId) {
        edges.push({
          id: `pc-edge-${pc.id}`,
          source: pc.parent_id,
          target: pc.child_id,
          type: "parentChild",
          style: { stroke: "#666", strokeWidth: 2 },
        });
      }
    }

    return { nodes, edges };
  }, [people, marriages, parentChild, selectedPersonId]);
}

// Re-export constants for use in node components
export { NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP };
