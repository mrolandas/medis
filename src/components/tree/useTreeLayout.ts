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

    // Create a map of marriages for grouping spouses at the same rank
    const marriageMap = new Map<string, string[]>();
    for (const m of marriages) {
      // Use a same-rank constraint: add edges both ways with minlen 0
      // so dagre places spouses at the same rank
      g.setEdge(m.person1_id, m.person2_id, { weight: 2, minlen: 0 });

      // Track which marriage nodes exist for each person pair
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

    // Add parent-child edges — connect directly to ONE parent for dagre ranking
    // (avoids the extra rank that a virtual marriage node creates)
    const childrenAdded = new Set<string>();
    for (const pc of parentChild) {
      if (childToMarriageId.has(pc.child_id)) {
        if (!childrenAdded.has(pc.child_id)) {
          // Connect child to the first parent for layout purposes
          g.setEdge(pc.parent_id, pc.child_id, { weight: 1 });
          childrenAdded.add(pc.child_id);
        }
      } else {
        // Single parent — connect directly
        g.setEdge(pc.parent_id, pc.child_id, { weight: 1 });
      }
    }

    dagre.layout(g);

    // Convert dagre output to React Flow nodes
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

    // Convert to React Flow edges
    const edges: Edge[] = [];

    // Marriage edges (horizontal between spouses)
    for (const m of marriages) {
      edges.push({
        id: `marriage-edge-${m.id}`,
        source: m.person1_id,
        target: m.person2_id,
        type: "marriage",
        data: { marriage: m },
        style: { stroke: "#e8915c", strokeWidth: 2 },
      });
    }

    // Parent-child edges
    // When both parents are married, draw from marriage midpoint to child.
    // When single parent, draw directly from parent to child.
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
            // Midpoint between the two spouses
            const midX = (p1.x + p2.x) / 2;
            const midY = Math.max(
              p1.y + NODE_HEIGHT / 2,
              p2.y + NODE_HEIGHT / 2,
            );
            edges.push({
              id: `pc-edge-family-${pc.child_id}`,
              source: marriage.person1_id,
              target: pc.child_id,
              type: "familyChild",
              data: {
                midX,
                midY,
                childX: child.x,
                childY: child.y - NODE_HEIGHT / 2,
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
