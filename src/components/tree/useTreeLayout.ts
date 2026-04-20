import { useMemo } from "react";
import dagre from "dagre";
import { type Node, type Edge, Position } from "@xyflow/react";
import type { Person, Marriage, ParentChild } from "../../types";

const NODE_WIDTH = 200;
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
      // Create a virtual "marriage" node to connect spouses and children
      const mNodeId = `marriage-${m.id}`;
      g.setNode(mNodeId, { width: 1, height: 1 });
      g.setEdge(m.person1_id, mNodeId, { weight: 2 });
      g.setEdge(m.person2_id, mNodeId, { weight: 2 });

      // Track which marriage nodes exist for each person pair
      const key = [m.person1_id, m.person2_id].sort().join("-");
      if (!marriageMap.has(key)) marriageMap.set(key, []);
      marriageMap.get(key)!.push(m.id);
    }

    // Build a lookup: child_id -> marriage node (if both parents are in a marriage)
    const childToMarriageNode = new Map<string, string>();
    for (const pc of parentChild) {
      // Find if this child's parents have a marriage
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
          childToMarriageNode.set(pc.child_id, `marriage-${marriageIds[0]}`);
        }
      }
    }

    // Add parent-child edges
    const childrenAdded = new Set<string>();
    for (const pc of parentChild) {
      const mNode = childToMarriageNode.get(pc.child_id);
      if (mNode && !childrenAdded.has(pc.child_id)) {
        // Connect child to the marriage node (so child appears below both parents)
        g.setEdge(mNode, pc.child_id, { weight: 1 });
        childrenAdded.add(pc.child_id);
      } else if (!mNode) {
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
      const mNodeId = childToMarriageNode.get(pc.child_id);
      if (mNodeId && !childEdgeAdded.has(pc.child_id)) {
        childEdgeAdded.add(pc.child_id);
        // Find the marriage to get both spouse IDs
        const marriageId = mNodeId.replace("marriage-", "");
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
      } else if (!mNodeId) {
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
