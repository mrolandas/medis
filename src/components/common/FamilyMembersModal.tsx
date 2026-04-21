import { useMemo, useState, type CSSProperties } from "react";
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
  spouseNames: string[];
  parentNames: string[];
  childNames: string[];
  birthDate: string | null;
  deathDate: string | null;
  isDeceased: boolean;
}

type SortKey =
  | "firstName"
  | "lastName"
  | "spouses"
  | "parents"
  | "children"
  | "lifespan"
  | "isDeceased";

type SortDirection = "asc" | "desc";

function fullName(firstName: string, lastName: string | null): string {
  return `${firstName} ${lastName ?? ""}`.trim();
}

export function FamilyMembersModal({
  onClose,
  onEditPerson,
}: FamilyMembersModalProps) {
  const { t } = useTranslation();
  const { people, marriages, parentChild } = useTreeData();
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<SortKey>("lastName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const collator = useMemo(
    () =>
      new Intl.Collator("lt", {
        sensitivity: "base",
        numeric: true,
      }),
    [],
  );

  const members = useMemo((): MemberSummary[] => {
    const peopleById = new Map(people.map((person) => [person.id, person]));

    const spouseNamesByPerson = new Map<string, string[]>();
    const parentNamesByChild = new Map<string, string[]>();
    const childNamesByParent = new Map<string, string[]>();

    for (const marriage of marriages) {
      const person1 = peopleById.get(marriage.person1_id);
      const person2 = peopleById.get(marriage.person2_id);
      if (!person1 || !person2) continue;

      if (!spouseNamesByPerson.has(person1.id)) {
        spouseNamesByPerson.set(person1.id, []);
      }
      if (!spouseNamesByPerson.has(person2.id)) {
        spouseNamesByPerson.set(person2.id, []);
      }

      spouseNamesByPerson
        .get(person1.id)!
        .push(fullName(person2.first_name, person2.last_name));
      spouseNamesByPerson
        .get(person2.id)!
        .push(fullName(person1.first_name, person1.last_name));
    }

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

    return people.map((person) => ({
      id: person.id,
      firstName: person.first_name,
      lastName: person.last_name ?? "",
      spouseNames: [...(spouseNamesByPerson.get(person.id) ?? [])].sort(
        collator.compare,
      ),
      parentNames: [...(parentNamesByChild.get(person.id) ?? [])].sort(
        collator.compare,
      ),
      childNames: [...(childNamesByParent.get(person.id) ?? [])].sort(
        collator.compare,
      ),
      birthDate: person.birth_date,
      deathDate: person.death_date,
      isDeceased: person.is_deceased,
    }));
  }, [people, marriages, parentChild, collator]);

  const sortedMembers = useMemo(() => {
    const normalized = (value: string) => value.trim().toLocaleLowerCase();
    const listValue = (values: string[]) => values.join(", ");
    const compareDate = (left: string | null, right: string | null) => {
      const a = left ?? "";
      const b = right ?? "";
      if (a === b) return 0;
      return a < b ? -1 : 1;
    };

    const sorted = [...members].sort((a, b) => {
      let result = 0;

      switch (sortKey) {
        case "firstName":
          result = collator.compare(
            normalized(a.firstName),
            normalized(b.firstName),
          );
          break;
        case "lastName":
          result = collator.compare(
            normalized(a.lastName),
            normalized(b.lastName),
          );
          break;
        case "spouses":
          result = collator.compare(
            normalized(listValue(a.spouseNames)),
            normalized(listValue(b.spouseNames)),
          );
          break;
        case "parents":
          result = collator.compare(
            normalized(listValue(a.parentNames)),
            normalized(listValue(b.parentNames)),
          );
          break;
        case "children":
          result = collator.compare(
            normalized(listValue(a.childNames)),
            normalized(listValue(b.childNames)),
          );
          break;
        case "lifespan":
          result =
            compareDate(a.birthDate, b.birthDate) ||
            compareDate(a.deathDate, b.deathDate);
          break;
        case "isDeceased":
          result = Number(a.isDeceased) - Number(b.isDeceased);
          break;
      }

      if (result === 0) {
        result = collator.compare(
          normalized(a.lastName),
          normalized(b.lastName),
        );
      }
      if (result === 0) {
        result = collator.compare(
          normalized(a.firstName),
          normalized(b.firstName),
        );
      }

      return sortDirection === "asc" ? result : result * -1;
    });

    return sorted;
  }, [members, sortKey, sortDirection, collator]);

  const setSorting = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const formatLifespan = (
    birthDate: string | null,
    deathDate: string | null,
  ) => {
    const birth = birthDate ?? "";
    const death = deathDate ?? "";
    if (!birth && !death) return "";
    return `${birth} - ${death}`.trim();
  };

  const formatList = (values: string[]) =>
    values.length > 0 ? values.join(", ") : "";

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
              tableLayout: isMobile ? "auto" : "fixed",
              minWidth: isMobile ? 960 : 0,
            }}
          >
            {!isMobile && (
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
            )}
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={thStyle}>
                  <button
                    onClick={() => setSorting("firstName")}
                    style={thButtonStyle}
                  >
                    {t("person.firstName")}
                    {sortIndicator("firstName")}
                  </button>
                </th>
                <th style={thStyle}>
                  <button
                    onClick={() => setSorting("lastName")}
                    style={thButtonStyle}
                  >
                    {t("person.lastName")}
                    {sortIndicator("lastName")}
                  </button>
                </th>
                <th style={thStyle}>
                  <button
                    onClick={() => setSorting("spouses")}
                    style={thButtonStyle}
                  >
                    {t("relation.spouses")}
                    {sortIndicator("spouses")}
                  </button>
                </th>
                <th style={thStyle}>
                  <button
                    onClick={() => setSorting("parents")}
                    style={thButtonStyle}
                  >
                    {t("relation.parents")}
                    {sortIndicator("parents")}
                  </button>
                </th>
                <th style={thStyle}>
                  <button
                    onClick={() => setSorting("children")}
                    style={thButtonStyle}
                  >
                    {t("relation.children")}
                    {sortIndicator("children")}
                  </button>
                </th>
                <th style={thStyle}>
                  <button
                    onClick={() => setSorting("lifespan")}
                    style={thButtonStyle}
                  >
                    {t("person.lifespan")}
                    {sortIndicator("lifespan")}
                  </button>
                </th>
                <th style={thStyle}>
                  <button
                    onClick={() => setSorting("isDeceased")}
                    style={thButtonStyle}
                  >
                    {t("person.isDeceased")}
                    {sortIndicator("isDeceased")}
                  </button>
                </th>
                <th
                  style={{
                    ...thStyle,
                    ...stickyRightHeaderStyle,
                    textAlign: "right",
                  }}
                >
                  {t("action.edit")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => (
                <tr
                  key={member.id}
                  style={{ borderBottom: "1px solid #ecf0f1" }}
                >
                  <td style={tdStyle}>{member.firstName || "-"}</td>
                  <td style={tdStyle}>{member.lastName || "-"}</td>
                  <td style={wrappedTdStyle}>
                    {formatList(member.spouseNames) || "-"}
                  </td>
                  <td style={wrappedTdStyle}>
                    {formatList(member.parentNames) || "-"}
                  </td>
                  <td style={wrappedTdStyle}>
                    {formatList(member.childNames) || "-"}
                  </td>
                  <td style={tdStyle}>
                    {formatLifespan(member.birthDate, member.deathDate) || "-"}
                  </td>
                  <td
                    style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}
                  >
                    {member.isDeceased ? "✓" : ""}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      ...stickyRightCellStyle,
                      textAlign: "right",
                    }}
                  >
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
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: "#f8f9fa",
  whiteSpace: "nowrap",
  textAlign: "left",
  padding: "12px 14px",
  color: "#2d3436",
  fontSize: 14,
};

const thButtonStyle: CSSProperties = {
  border: "none",
  background: "none",
  padding: 0,
  margin: 0,
  color: "inherit",
  fontSize: "inherit",
  fontWeight: 700,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const tdStyle: CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  color: "#2d3436",
  verticalAlign: "top",
};

const wrappedTdStyle: CSSProperties = {
  ...tdStyle,
  whiteSpace: "normal",
  overflowWrap: "anywhere",
};

const stickyRightHeaderStyle: CSSProperties = {
  position: "sticky",
  right: 0,
  zIndex: 3,
  background: "#f8f9fa",
};

const stickyRightCellStyle: CSSProperties = {
  position: "sticky",
  right: 0,
  zIndex: 1,
  background: "#fff",
};
