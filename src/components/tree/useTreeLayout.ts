import { useMemo } from "react";
import calcTree from "relatives-tree";
import { type Node, type Edge, Position } from "@xyflow/react";
import type { Person, Marriage, ParentChild } from "../../types";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 80;
const BASE_GAP_X = 20;
const BASE_GAP_Y = 80;
const FAMILY_CLUSTER_PADDING = 24;
const INTER_FAMILY_GAP = 72;

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Converts people, marriages, and parent-child relations into
 * React Flow nodes and edges using relatives-tree for layout.
 */
export function useTreeLayout(
  people: Person[],
  marriages: Marriage[],
  parentChild: ParentChild[],
  selectedPersonId: string | null,
  focusedPersonId: string | null,
  activeHighlightIds: string[],
  dimNonHighlighted: boolean,
): LayoutResult {
  return useMemo(() => {
    if (people.length === 0) return { nodes: [], edges: [] };

    // ── Build siblings lookup ──
    // Two people are siblings if they share at least one parent
    const parentToChildren = new Map<string, Set<string>>();
    for (const pc of parentChild) {
      if (!parentToChildren.has(pc.parent_id))
        parentToChildren.set(pc.parent_id, new Set());
      parentToChildren.get(pc.parent_id)!.add(pc.child_id);
    }

    const personSiblings = new Map<string, Set<string>>();
    for (const person of people) {
      const siblings = new Set<string>();
      const myParents = parentChild
        .filter((pc) => pc.child_id === person.id)
        .map((pc) => pc.parent_id);
      for (const parentId of myParents) {
        const children = parentToChildren.get(parentId);
        if (children) {
          for (const childId of children) {
            if (childId !== person.id) siblings.add(childId);
          }
        }
      }
      personSiblings.set(person.id, siblings);
    }

    // ── Convert to relatives-tree input format ──
    const rtNodes = people.map((person) => ({
      id: person.id,
      gender: person.gender === "F" ? "female" : "male",
      parents: parentChild
        .filter((pc) => pc.child_id === person.id)
        .map((pc) => ({ id: pc.parent_id, type: "blood" as const })),
      children: parentChild
        .filter((pc) => pc.parent_id === person.id)
        .map((pc) => ({ id: pc.child_id, type: "blood" as const })),
      spouses: marriages
        .filter((m) => m.person1_id === person.id || m.person2_id === person.id)
        .map((m) => ({
          id: m.person1_id === person.id ? m.person2_id : m.person1_id,
          type: "married" as const,
        })),
      siblings: [...(personSiblings.get(person.id) ?? [])].map((id) => ({
        id,
        type: "blood" as const,
      })),
    }));

    // ── Main tree layout from strongest root ──
    const hasParent = new Set(parentChild.map((pc) => pc.child_id));
    const roots = people.filter((p) => !hasParent.has(p.id));

    function descCount(id: string, seen = new Set<string>()): number {
      if (seen.has(id)) return 0;
      seen.add(id);
      let c = 0;
      for (const pc of parentChild) {
        if (pc.parent_id === id) c += 1 + descCount(pc.child_id, seen);
      }
      return c;
    }

    roots.sort((a, b) => descCount(b.id) - descCount(a.id));
    const rootId = roots[0]?.id ?? people[0].id;

    const tree = calcTree(rtNodes as Parameters<typeof calcTree>[0], {
      rootId,
    });

    // Spacing: relatives-tree uses half-node grid (top/left increment by 2).
    const GAP_X = BASE_GAP_X;
    const GAP_Y = BASE_GAP_Y;
    const halfW = (NODE_WIDTH + GAP_X) / 2;
    const halfH = (NODE_HEIGHT + GAP_Y) / 2;
    const genStepY = NODE_HEIGHT + GAP_Y;

    const rawPos = (left: number, top: number) => ({
      x: left * halfW + NODE_WIDTH / 2,
      y: top * halfH + NODE_HEIGHT / 2,
    });

    // ── Build position map from the main tree first ──
    const positions = new Map<string, { x: number; y: number }>();
    const mainPlaced = new Set<string>();
    for (const extNode of tree.nodes) {
      if (extNode.placeholder) continue;
      positions.set(extNode.id, rawPos(extNode.left, extNode.top));
      mainPlaced.add(extNode.id);
    }

    // ── Place nodes missed by relatives-tree as anchored mini subtrees ──
    const missing = people.map((p) => p.id).filter((id) => !mainPlaced.has(id));

    if (missing.length > 0) {
      const missingSet = new Set(missing);

      const missAdj = new Map<string, Set<string>>();
      const addMissEdge = (a: string, b: string) => {
        if (!missingSet.has(a) || !missingSet.has(b)) return;
        if (!missAdj.has(a)) missAdj.set(a, new Set());
        if (!missAdj.has(b)) missAdj.set(b, new Set());
        missAdj.get(a)!.add(b);
        missAdj.get(b)!.add(a);
      };
      for (const pc of parentChild) addMissEdge(pc.parent_id, pc.child_id);
      for (const m of marriages) addMissEdge(m.person1_id, m.person2_id);
      for (const [pid, sibs] of personSiblings) {
        for (const s of sibs) addMissEdge(pid, s);
      }

      // Connected components among missing nodes
      const seen = new Set<string>();
      const missingComponents: string[][] = [];
      for (const start of missing) {
        if (seen.has(start)) continue;
        const comp: string[] = [];
        const q = [start];
        seen.add(start);
        while (q.length > 0) {
          const cur = q.shift()!;
          comp.push(cur);
          for (const nb of missAdj.get(cur) ?? []) {
            if (!seen.has(nb)) {
              seen.add(nb);
              q.push(nb);
            }
          }
        }
        missingComponents.push(comp);
      }

      type Bridge = {
        miniId: string;
        anchorId: string;
        direction: "above" | "below" | "side";
      };

      const rectsOverlap = (
        a: { x: number; y: number },
        b: { x: number; y: number },
      ) => {
        const padX = 30;
        const padY = 20;
        return (
          Math.abs(a.x - b.x) < NODE_WIDTH + padX &&
          Math.abs(a.y - b.y) < NODE_HEIGHT + padY
        );
      };

      for (const comp of missingComponents) {
        const compSet = new Set(comp);
        const compNodes = rtNodes
          .filter((n) => compSet.has(n.id))
          .map((n) => ({
            ...n,
            parents: n.parents.filter((r) => compSet.has(r.id)),
            children: n.children.filter((r) => compSet.has(r.id)),
            spouses: n.spouses.filter((r) => compSet.has(r.id)),
            siblings: n.siblings.filter((r) => compSet.has(r.id)),
          }));

        const compRoots = comp.filter((id) => !hasParent.has(id));
        compRoots.sort((a, b) => descCount(b) - descCount(a));
        const compRoot = compRoots[0] ?? comp[0];

        const miniTree = calcTree(compNodes as Parameters<typeof calcTree>[0], {
          rootId: compRoot,
        });

        const miniPositions = new Map<string, { x: number; y: number }>();
        for (const n of miniTree.nodes) {
          if (n.placeholder) continue;
          miniPositions.set(n.id, rawPos(n.left, n.top));
        }

        // Find how this component attaches to already placed nodes
        let bridge: Bridge | null = null;

        for (const pc of parentChild) {
          if (compSet.has(pc.parent_id) && positions.has(pc.child_id)) {
            bridge = {
              miniId: pc.parent_id,
              anchorId: pc.child_id,
              direction: "above",
            };
            break;
          }
          if (compSet.has(pc.child_id) && positions.has(pc.parent_id)) {
            bridge = {
              miniId: pc.child_id,
              anchorId: pc.parent_id,
              direction: "below",
            };
            break;
          }
        }

        if (!bridge) {
          for (const m of marriages) {
            if (compSet.has(m.person1_id) && positions.has(m.person2_id)) {
              bridge = {
                miniId: m.person1_id,
                anchorId: m.person2_id,
                direction: "side",
              };
              break;
            }
            if (compSet.has(m.person2_id) && positions.has(m.person1_id)) {
              bridge = {
                miniId: m.person2_id,
                anchorId: m.person1_id,
                direction: "side",
              };
              break;
            }
          }
        }

        let dx = 0;
        let dy = 0;

        if (bridge && miniPositions.has(bridge.miniId)) {
          const anchor = positions.get(bridge.anchorId)!;
          const pivot = miniPositions.get(bridge.miniId)!;
          let targetX = anchor.x;
          let targetY = anchor.y;

          if (bridge.direction === "above") targetY = anchor.y - genStepY;
          if (bridge.direction === "below") targetY = anchor.y + genStepY;
          if (bridge.direction === "side")
            targetX = anchor.x + NODE_WIDTH + GAP_X;

          dx = targetX - pivot.x;
          dy = targetY - pivot.y;
        } else {
          // No known anchor: place to the right of current layout
          let maxX = 0;
          for (const p of positions.values()) maxX = Math.max(maxX, p.x);
          const anyMini = [...miniPositions.values()][0];
          if (anyMini) {
            dx = maxX + NODE_WIDTH + GAP_X - anyMini.x;
            dy = 0;
          }
        }

        // Collision avoidance: shift right until mini subtree does not overlap.
        const shifted = (
          p: { x: number; y: number },
          sx: number,
          sy: number,
        ) => ({
          x: p.x + sx,
          y: p.y + sy,
        });

        const hasCollisionAt = (sx: number, sy: number) => {
          for (const p of miniPositions.values()) {
            const np = shifted(p, sx, sy);
            for (const ep of positions.values()) {
              if (rectsOverlap(np, ep)) return true;
            }
          }
          return false;
        };

        if (
          bridge &&
          (bridge.direction === "above" || bridge.direction === "below")
        ) {
          const verticalSign = bridge.direction === "above" ? -1 : 1;
          let placed = false;
          const horizStep = (NODE_WIDTH + GAP_X) / 2;

          // Prefer keeping subtree near anchor by moving vertically first,
          // with small left/right alternation.
          for (let v = 0; v < 10 && !placed; v++) {
            const baseY = dy + verticalSign * v * genStepY;
            const offsets = [
              0,
              -horizStep,
              horizStep,
              -2 * horizStep,
              2 * horizStep,
            ];
            for (const ox of offsets) {
              const tx = dx + ox;
              const ty = baseY;
              if (!hasCollisionAt(tx, ty)) {
                dx = tx;
                dy = ty;
                placed = true;
                break;
              }
            }
          }

          if (!placed) {
            let tries = 0;
            while (tries < 40 && hasCollisionAt(dx, dy)) {
              dx += NODE_WIDTH + GAP_X;
              tries += 1;
            }
          }
        } else {
          let tries = 0;
          while (tries < 40 && hasCollisionAt(dx, dy)) {
            dx += NODE_WIDTH + GAP_X;
            tries += 1;
          }
        }

        for (const [id, p] of miniPositions) {
          positions.set(id, shifted(p, dx, dy));
        }
      }
    }

    // ── Normalize Y by real generations (DB constraints) ──
    // This prevents visually impossible ancestry (e.g. child appearing above ancestor).
    const ufParent = new Map<string, string>();
    for (const p of people) ufParent.set(p.id, p.id);

    const ufFind = (id: string): string => {
      const parent = ufParent.get(id) ?? id;
      if (parent === id) return id;
      const root = ufFind(parent);
      ufParent.set(id, root);
      return root;
    };

    const ufUnion = (a: string, b: string) => {
      const ra = ufFind(a);
      const rb = ufFind(b);
      if (ra !== rb) ufParent.set(rb, ra);
    };

    // Spouses share a generation level.
    for (const m of marriages) ufUnion(m.person1_id, m.person2_id);

    const groupAdj = new Map<string, Set<string>>();
    const indegree = new Map<string, number>();

    const ensureGroup = (g: string) => {
      if (!groupAdj.has(g)) groupAdj.set(g, new Set());
      if (!indegree.has(g)) indegree.set(g, 0);
    };

    for (const p of people) ensureGroup(ufFind(p.id));

    // Parent -> child edges define generation ordering between spouse-groups.
    for (const pc of parentChild) {
      const gp = ufFind(pc.parent_id);
      const gc = ufFind(pc.child_id);
      if (gp === gc) continue;
      ensureGroup(gp);
      ensureGroup(gc);
      const out = groupAdj.get(gp)!;
      if (!out.has(gc)) {
        out.add(gc);
        indegree.set(gc, (indegree.get(gc) ?? 0) + 1);
      }
    }

    const groupLevel = new Map<string, number>();
    for (const g of indegree.keys()) groupLevel.set(g, 0);

    const queue: string[] = [];
    const topoOrder: string[] = [];
    for (const [g, deg] of indegree) {
      if (deg === 0) queue.push(g);
    }

    while (queue.length > 0) {
      const g = queue.shift()!;
      topoOrder.push(g);
      const base = groupLevel.get(g) ?? 0;
      for (const ch of groupAdj.get(g) ?? []) {
        groupLevel.set(ch, Math.max(groupLevel.get(ch) ?? 0, base + 1));
        indegree.set(ch, (indegree.get(ch) ?? 0) - 1);
        if ((indegree.get(ch) ?? 0) === 0) queue.push(ch);
      }
    }

    // Reverse relaxation: if a child's generation is already known from another
    // branch, its parents must sit exactly one generation above it. This keeps
    // incomplete ancestor branches aligned with complete ones.
    for (let index = topoOrder.length - 1; index >= 0; index -= 1) {
      const g = topoOrder[index];
      let desired = groupLevel.get(g) ?? 0;
      for (const ch of groupAdj.get(g) ?? []) {
        desired = Math.max(desired, (groupLevel.get(ch) ?? 0) - 1);
      }
      groupLevel.set(g, desired);
    }

    // Apply normalized generation Y while preserving X from relatives-tree layout.
    const TOP_MARGIN = 40;
    for (const p of people) {
      const pos = positions.get(p.id);
      if (!pos) continue;
      const level = groupLevel.get(ufFind(p.id)) ?? 0;
      positions.set(p.id, {
        x: pos.x,
        y: TOP_MARGIN + level * genStepY + NODE_HEIGHT / 2,
      });
    }

    // Resolve horizontal overlaps inside each generation row.
    // This prevents hidden nodes like Greta/Lukne or ancestor rows stacking.
    const MIN_CENTER_GAP = NODE_WIDTH + GAP_X;
    const rowBuckets = new Map<number, string[]>();

    for (const p of people) {
      const pos = positions.get(p.id);
      if (!pos) continue;
      const rowKey = Math.round(pos.y);
      if (!rowBuckets.has(rowKey)) rowBuckets.set(rowKey, []);
      rowBuckets.get(rowKey)!.push(p.id);
    }

    for (const ids of rowBuckets.values()) {
      const rowSet = new Set(ids);
      const spouseParent = new Map<string, string>();
      for (const id of ids) spouseParent.set(id, id);

      const spouseFind = (id: string): string => {
        const parent = spouseParent.get(id) ?? id;
        if (parent === id) return id;
        const root = spouseFind(parent);
        spouseParent.set(id, root);
        return root;
      };

      const spouseUnion = (a: string, b: string) => {
        const ra = spouseFind(a);
        const rb = spouseFind(b);
        if (ra !== rb) spouseParent.set(rb, ra);
      };

      for (const m of marriages) {
        if (rowSet.has(m.person1_id) && rowSet.has(m.person2_id)) {
          spouseUnion(m.person1_id, m.person2_id);
        }
      }

      const groups = new Map<string, string[]>();
      for (const id of ids) {
        const root = spouseFind(id);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root)!.push(id);
      }

      const groupList = [...groups.values()].map((members) => {
        members.sort(
          (a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0),
        );
        const memberSet = new Set(members);
        const parentIds = [
          ...new Set(
            members.flatMap((id) =>
              parentChild
                .filter((pc) => pc.child_id === id)
                .map((pc) => pc.parent_id)
                .filter((parentId) => positions.has(parentId)),
            ),
          ),
        ].sort();

        const avgX =
          members.reduce((sum, id) => sum + (positions.get(id)?.x ?? 0), 0) /
          members.length;
        const anchorX =
          parentIds.length > 0
            ? parentIds.reduce(
                (sum, id) => sum + (positions.get(id)?.x ?? 0),
                0,
              ) / parentIds.length
            : avgX;

        const directChildIds = [
          ...new Set(
            parentChild
              .filter(
                (pc) =>
                  memberSet.has(pc.parent_id) && positions.has(pc.child_id),
              )
              .map((pc) => pc.child_id),
          ),
        ];
        const ownSpan = (members.length - 1) * MIN_CENTER_GAP;
        const childSpan = Math.max(
          0,
          (directChildIds.length - 1) * MIN_CENTER_GAP,
        );

        return {
          members,
          avgX,
          anchorX,
          preferredCenterX: parentIds.length > 0 ? anchorX : avgX,
          effectiveSpan:
            Math.max(ownSpan, childSpan) +
            (parentIds.length > 0 || directChildIds.length > 0
              ? FAMILY_CLUSTER_PADDING
              : 0),
          familyKey:
            parentIds.length > 0
              ? `parents:${parentIds.join("|")}`
              : `group:${members.join("|")}`,
        };
      });

      groupList.sort((a, b) => {
        if (a.anchorX !== b.anchorX) return a.anchorX - b.anchorX;
        return a.avgX - b.avgX;
      });

      const familyClusters: Array<{
        familyKey: string;
        preferredCenterX: number;
        effectiveSpan: number;
        groups: typeof groupList;
      }> = [];

      for (const group of groupList) {
        const lastCluster = familyClusters[familyClusters.length - 1];
        if (lastCluster && lastCluster.familyKey === group.familyKey) {
          lastCluster.groups.push(group);
          lastCluster.effectiveSpan = Math.max(
            lastCluster.effectiveSpan,
            (lastCluster.groups.reduce(
              (sum, item) => sum + item.members.length,
              0,
            ) -
              1) *
              MIN_CENTER_GAP,
            group.effectiveSpan,
          );
          continue;
        }

        familyClusters.push({
          familyKey: group.familyKey,
          preferredCenterX: group.preferredCenterX,
          effectiveSpan: group.effectiveSpan,
          groups: [group],
        });
      }

      let lastOccupied = -Infinity;
      let previousFamilyKey: string | null = null;
      for (const cluster of familyClusters) {
        const memberCount = cluster.groups.reduce(
          (sum, group) => sum + group.members.length,
          0,
        );
        const ownSpan = (memberCount - 1) * MIN_CENTER_GAP;
        const clusterSpan = Math.max(ownSpan, cluster.effectiveSpan);
        const desiredFirst = cluster.preferredCenterX - clusterSpan / 2;
        const familyGap =
          previousFamilyKey && previousFamilyKey !== cluster.familyKey
            ? INTER_FAMILY_GAP
            : 0;
        const firstCenter = Math.max(
          desiredFirst,
          Number.isFinite(lastOccupied)
            ? lastOccupied + MIN_CENTER_GAP + familyGap
            : desiredFirst,
        );
        const firstMemberCenter = firstCenter + (clusterSpan - ownSpan) / 2;

        let clusterIndex = 0;
        for (const group of cluster.groups) {
          for (const id of group.members) {
            const pos = positions.get(id);
            if (!pos) continue;
            const x = firstMemberCenter + clusterIndex * MIN_CENTER_GAP;
            positions.set(id, { x, y: pos.y });
            clusterIndex += 1;
          }
        }

        lastOccupied = firstCenter + clusterSpan;
        previousFamilyKey = cluster.familyKey;
      }
    }

    // ── Build React Flow nodes ──
    const activeHighlightSet = new Set(activeHighlightIds);
    const nodes: Node[] = [];
    for (const person of people) {
      const pos = positions.get(person.id);
      if (!pos) continue;
      nodes.push({
        id: person.id,
        type: "person",
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
        data: {
          person,
          isSelected: person.id === selectedPersonId,
          isFocused: person.id === focusedPersonId,
          isHighlighted: activeHighlightSet.has(person.id),
          isDimmed:
            dimNonHighlighted &&
            activeHighlightSet.size > 0 &&
            !activeHighlightSet.has(person.id),
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }

    // ── Build edges ──
    const edges: Edge[] = [];

    // Helper lookups for edge building
    const childToMarriageId = new Map<string, string>();
    for (const m of marriages) {
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
    const marriageChildren = new Map<string, string[]>();
    for (const [childId, mId] of childToMarriageId) {
      if (!marriageChildren.has(mId)) marriageChildren.set(mId, []);
      marriageChildren.get(mId)!.push(childId);
    }
    const marriageChildSet = new Set([...marriageChildren.values()].flat());

    const rowFamilyLane = new Map<string, number>();
    const familiesByRow = new Map<number, { key: string; midX: number }[]>();

    for (const [mId] of marriageChildren) {
      const marriage = marriages.find((m) => m.id === mId);
      if (!marriage) continue;
      const p1 = positions.get(marriage.person1_id);
      const p2 = positions.get(marriage.person2_id);
      if (!p1 || !p2) continue;
      const rowKey = Math.round((p1.y + p2.y) / 2);
      if (!familiesByRow.has(rowKey)) familiesByRow.set(rowKey, []);
      familiesByRow.get(rowKey)!.push({
        key: `marriage:${mId}`,
        midX: (p1.x + p2.x) / 2,
      });
    }

    for (const pc of parentChild) {
      if (marriageChildSet.has(pc.child_id)) continue;
      const parentPos = positions.get(pc.parent_id);
      if (!parentPos) continue;
      const rowKey = Math.round(parentPos.y);
      if (!familiesByRow.has(rowKey)) familiesByRow.set(rowKey, []);
      familiesByRow.get(rowKey)!.push({
        key: `single:${pc.id}`,
        midX: parentPos.x,
      });
    }

    for (const families of familiesByRow.values()) {
      families.sort((a, b) => a.midX - b.midX);
      for (let index = 0; index < families.length; index += 1) {
        rowFamilyLane.set(families[index].key, index % 3);
      }
    }

    // Marriage edges: horizontal dashed line between spouses
    for (const m of marriages) {
      const p1 = positions.get(m.person1_id);
      const p2 = positions.get(m.person2_id);
      if (!p1 || !p2) continue;

      const leftX = Math.min(p1.x, p2.x) + NODE_WIDTH / 2;
      const rightX = Math.max(p1.x, p2.x) - NODE_WIDTH / 2;
      const lineY = (p1.y + p2.y) / 2;
      const midX = (p1.x + p2.x) / 2;

      edges.push({
        id: `marriage-edge-${m.id}`,
        source: m.person1_id,
        target: m.person2_id,
        type: "marriage",
        data: { leftX, rightX, lineY, midX },
        style: { stroke: "#e8915c", strokeWidth: 2 },
      });
    }

    // Family fork edges (children of married couples)
    const marriageForkAdded = new Set<string>();
    for (const [mId, childIds] of marriageChildren) {
      if (marriageForkAdded.has(mId)) continue;
      marriageForkAdded.add(mId);

      const marriage = marriages.find((m) => m.id === mId);
      if (!marriage) continue;
      const p1 = positions.get(marriage.person1_id);
      const p2 = positions.get(marriage.person2_id);
      if (!p1 || !p2) continue;

      const midX = (p1.x + p2.x) / 2;
      const marriageLineY = (p1.y + p2.y) / 2;
      const lane = rowFamilyLane.get(`marriage:${mId}`) ?? 0;
      const branchY = Math.max(p1.y, p2.y) + NODE_HEIGHT / 2 + 18 + lane * 16;

      const childPositions: { x: number; topY: number }[] = [];
      for (const cId of childIds) {
        const cp = positions.get(cId);
        if (cp) {
          childPositions.push({ x: cp.x, topY: cp.y - NODE_HEIGHT / 2 });
        }
      }
      if (childPositions.length === 0) continue;
      childPositions.sort((a, b) => a.x - b.x);

      edges.push({
        id: `pc-fork-${mId}`,
        source: marriage.person1_id,
        target: childIds[0],
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

    // Single-parent edges
    for (const pc of parentChild) {
      if (marriageChildSet.has(pc.child_id)) continue;
      const parentPos = positions.get(pc.parent_id);
      const lane = rowFamilyLane.get(`single:${pc.id}`) ?? 0;
      edges.push({
        id: `pc-edge-${pc.id}`,
        source: pc.parent_id,
        target: pc.child_id,
        type: "parentChild",
        data: parentPos
          ? { branchY: parentPos.y + NODE_HEIGHT / 2 + 18 + lane * 16 }
          : undefined,
        style: { stroke: "#666", strokeWidth: 2 },
      });
    }

    return { nodes, edges };
  }, [
    people,
    marriages,
    parentChild,
    selectedPersonId,
    focusedPersonId,
    activeHighlightIds,
    dimNonHighlighted,
  ]);
}

// Re-export constants for use in node components
export { NODE_WIDTH, NODE_HEIGHT };
