import { useState, useCallback, useRef, useEffect } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";

interface SearchBarProps {
  onSelectPerson: (id: string) => void;
  fullWidth?: boolean;
}

export function SearchBar({ onSelectPerson, fullWidth }: SearchBarProps) {
  const { t } = useTranslation();
  const { people } = useTreeData();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter people by name
  const results =
    query.length >= 2
      ? people.filter((p) => {
          const fullName =
            `${p.first_name} ${p.last_name ?? ""} ${p.maiden_name ?? ""}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        })
      : [];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      onSelectPerson(id);
      setQuery("");
      setIsOpen(false);
    },
    [onSelectPerson],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[highlightIndex]) {
        handleSelect(results[highlightIndex].id);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [results, highlightIndex, handleSelect],
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: fullWidth ? "100%" : 280 }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightIndex(0);
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={t("search.placeholder")}
        style={{
          width: "100%",
          padding: "10px 14px",
          fontSize: 16,
          border: "2px solid #dfe6e9",
          borderRadius: 10,
          outline: "none",
          fontFamily: "inherit",
          boxSizing: "border-box",
          background: "#fff",
        }}
      />
      {isOpen && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "2px solid #dfe6e9",
            borderRadius: 10,
            marginTop: 4,
            maxHeight: 300,
            overflowY: "auto",
            zIndex: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {results.map((person, i) => (
            <div
              key={person.id}
              onClick={() => handleSelect(person.id)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                background: i === highlightIndex ? "#fff8f0" : "transparent",
                borderBottom:
                  i < results.length - 1 ? "1px solid #ecf0f1" : "none",
                fontSize: 15,
                color: "#2d3436",
              }}
            >
              <span style={{ fontWeight: 600, color: "#2d3436" }}>
                {person.first_name} {person.last_name ?? ""}
              </span>
              {person.birth_date && (
                <span style={{ color: "#7f8c8d", marginLeft: 8, fontSize: 13 }}>
                  ({person.birth_date})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "2px solid #dfe6e9",
            borderRadius: 10,
            marginTop: 4,
            padding: "12px 14px",
            fontSize: 14,
            color: "#b2bec3",
            zIndex: 200,
          }}
        >
          {t("search.noResults")}
        </div>
      )}
    </div>
  );
}
