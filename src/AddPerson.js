import { useMemo, useState, useEffect, useCallback, useRef } from "react";

export default function AddPerson({ tree, onTreeUpdate }) {
  const containerRef = useRef(null);
  const defaultPerson = useMemo(
    () => ({
      id: null,
      firstname: "",
      lastname: "",
      birth: "",
      death: "",
      spouse: [],
      parents: [],
      gender: "M",
      deleted: false,
      deceased: false,
    }),
    []
  ); // Empty dependency array since values never change

  const [newPerson, setNewPerson] = useState({ ...defaultPerson });
  const [error, setError] = useState("");

  function validateForm() {
    if (!newPerson.firstname.trim()) {
      setError("First Name is required");
      return false;
    }
    setError("");
    return true;
  }

  // Memoize createPerson with useCallback
  const createPerson = useCallback(
    (action) => {
      if (action === true) {
        const newPersonId = Math.max(...tree.map((person) => person.id), 0) + 1;
        setNewPerson({ ...defaultPerson, id: newPersonId });
      }
      if (action === false) {
        setNewPerson({ ...defaultPerson });
      }
    },
    [tree, defaultPerson]
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    const personToAdd = {
      ...newPerson,
      spouse: Array.isArray(newPerson.spouse) ? newPerson.spouse : [],
      parents: Array.isArray(newPerson.parents) ? newPerson.parents : [],
      deleted: false,
      deceased: false,
    };
    onTreeUpdate(personToAdd, "addPerson");
    createPerson(false);
  }

  // Add createPerson to dependencies
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        createPerson(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        createPerson(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [createPerson]);

  function renderNewPersonForm() {
    return (
      <div
        ref={containerRef}
        className={`add-person-container ${
          newPerson.id === null ? "hidden" : ""
        }`}
      >
        <form onSubmit={handleSubmit}>
          <h3>Add a new person</h3>
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              value={newPerson.firstname}
              onChange={(e) =>
                setNewPerson({ ...newPerson, firstname: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={newPerson.lastname}
              onChange={(e) =>
                setNewPerson({ ...newPerson, lastname: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Birth Date:</label>
            <input
              type="date"
              value={newPerson.birth}
              onChange={(e) =>
                setNewPerson({ ...newPerson, birth: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Deceased:</label>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={newPerson.deceased}
                onChange={(e) => {
                  setNewPerson({
                    ...newPerson,
                    death: "",
                    deceased: e.target.checked,
                  });
                }}
              />
            </div>
            {/* death date  shown only if deceased is checked */}
            <div className={`${newPerson.deceased ? "" : "hidden"}`}>
              <input
                className="deceased-date"
                type="date"
                value={newPerson.death}
                onChange={(e) =>
                  setNewPerson({ ...newPerson, death: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-group">
            <label>Gender:</label>
            <select
              value={newPerson.gender}
              onChange={(e) =>
                setNewPerson({ ...newPerson, gender: e.target.value })
              }
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label>Father:</label>
            <select
              value={newPerson.parents[0] || ""}
              onChange={(e) =>
                setNewPerson({
                  ...newPerson,
                  parents: [
                    Number(e.target.value),
                    newPerson.parents[1],
                  ].filter(Boolean),
                })
              }
            >
              <option value="">Select father</option>
              {tree
                .filter((person) => person.gender === "M" && !person.deleted)
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.firstname} {person.lastname}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label>Mother:</label>
            <select
              value={newPerson.parents[1] || ""}
              onChange={(e) =>
                setNewPerson({
                  ...newPerson,
                  parents: [
                    newPerson.parents[0],
                    Number(e.target.value),
                  ].filter(Boolean),
                })
              }
            >
              <option value="">Select mother</option>
              {tree
                .filter((person) => person.gender === "F" && !person.deleted)
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.firstname} {person.lastname}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label>Spouse:</label>
            <select
              value={newPerson.spouse[0] || ""}
              onChange={(e) =>
                setNewPerson({
                  ...newPerson,
                  spouse: e.target.value ? [Number(e.target.value)] : [],
                })
              }
            >
              <option value="">Select spouse</option>
              {tree
                .filter((person) => !person.deleted)
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.firstname} {person.lastname}
                  </option>
                ))}
            </select>
          </div>
          {error && <div className="error">{`Error: ${error}`}</div>}
          <button type="submit">Add Person</button>
          <button type="button" onClick={() => createPerson(false)}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => createPerson(true)}
        className="add-person-button"
      >
        Add Person
      </button>
      {newPerson.id !== null && renderNewPersonForm()}
    </>
  );
}
