import { useMemo, type CSSProperties } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";
import { useIsMobile } from "../../hooks/useIsMobile";

interface FamilyMembersModalProps {
  onClose: () => void;
  onEditPerson: (id: string) => void;
}

interface MemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  parentNames: string[];
  childNames: string[];
}

function fullName(firstName: string, lastName: string | null): string {
  return `${firstName} ${lastName ?? ""}`.trim();
}

export function FamilyMembersModal({
  onClose,
  onEditPerson,
}: FamilyMembersModalProps) {
  const { t } = useTranslation();
  const { people, parentChild } = useTreeData();
  const isMobile = useIsMobile();

  const members = useMemo((): MemberSummary[] => {
    const peopleById = new Map(people.map((person) => [person.id, person]));

    const parentNamesByChild = new Map<string, string[]>();
    const childNamesByParent = new Map<string, string[]>();

    for (const relation of parentChild) {
      const parent = peopleById.get(relation.parent_id);
      const child = peopleById.get(relation.child_id);

      if (parent && child) {
        if (!parentNamesByChild.has(child.id)) {
          parentNamesByChild.set(child.id, []);
        }
        if (!childNamesByParent.has(parent.id)) {
          childNamesByParent.set(parent.id, []);
        }

        parentNamesByChild
          .get(child.id)!
          .push(fullName(parent.first_name, parent.last_name));
        childNamesByParent
          .get(parent.id)!
          .push(fullName(child.first_name, child.last_name));
      }
    }

    return [...people]
      .sort((a, b) => {
        const lastCmp = (a.last_name ?? "").localeCompare(
          b.last_name ?? "",
          "lt",
        );
        if (lastCmp !== 0) return lastCmp;
        const firstCmp = a.first_name.localeCompare(b.first_name, "lt");
        if (firstCmp !== 0) return firstCmp;
        return a.created_at.localeCompare(b.created_at);
      })
      .map((person) => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name ?? "",
        parentNames: parentNamesByChild.get(person.id) ?? [],
        childNames: childNamesByParent.get(person.id) ?? [],
      }));
  }, [people, parentChild]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.48)",
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "center",
        zIndex: 400,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: isMobile ? "100%" : "min(1040px, 94vw)",
          height: isMobile ? "100%" : "min(82vh, 820px)",
          background: "#fff",
          borderRadius: isMobile ? 0 : 14,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #ecf0f1",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: "#2d3436" }}>
            {t("familyMembers.title")}
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: 28,
              color: "#636e72",
              cursor: "pointer",
              lineHeight: 1,
            }}
            title={t("action.close")}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: isMobile ? 0 : 820,
            }}
          >
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={thStyle}>{t("person.firstName")}</th>
                <th style={thStyle}>{t("person.lastName")}</th>
                <th style={thStyle}>{t("relation.parents")}</th>
                <th style={thStyle}>{t("relation.children")}</th>
                <th style={{ ...thStyle, textAlign: "right" }}>
                  {t("action.edit")}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  style={{ borderBottom: "1px solid #ecf0f1" }}
                >
                  <td style={tdStyle}>{member.firstName || "-"}</td>
                  <td style={tdStyle}>{member.lastName || "-"}</td>
                  <td style={tdStyle}>
                    {member.parentNames.length > 0
                      ? member.parentNames.join(", ")
                      : t("familyMembers.none")}
                  </td>
                  <td style={tdStyle}>
                    {member.childNames.length > 0
                      ? member.childNames.join(", ")
                      : t("familyMembers.none")}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button
                      onClick={() => onEditPerson(member.id)}
                      style={{
                        border: "none",
                        background: "#4a7c59",
                        color: "#fff",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 13,
                        padding: "8px 12px",
                        cursor: "pointer",
                      }}
                    >
                      {t("action.edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  color: "#2d3436",
  fontSize: 14,
};

const tdStyle: CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  color: "#2d3436",
  verticalAlign: "top",
};
