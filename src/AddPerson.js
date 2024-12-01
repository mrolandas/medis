import { useState } from "react";

export default function AddPerson({
  onSelectedPerson,
  selectedPerson,
  tree,
  onTreeUpdate,
}) {
  const defaultPerson = {
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
  };

  const [newPerson, setNewPerson] = useState({ ...defaultPerson });
  // const [error, setError] = useState("");

  // function validateForm() {
  //   if (!newPerson.firstname.trim()) {
  //     setError("First Name is required");
  //     return false;
  //   }
  //   setError("");
  //   return true;
  // }
  function createPerson(action) {
    if (action === true) {
      const newPersonId = Math.max(...tree.map((person) => person.id), 0) + 1;
      console.log(newPersonId);

      setNewPerson({ ...defaultPerson, id: newPersonId });
      renderNewPersonForm();
    }
    if (action === false) {
      // handle exit form
      setNewPerson({ ...defaultPerson });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
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

  function renderNewPersonForm() {
    return (
      <div
        className={`add-person-container ${
          newPerson.id === null ? "hidden" : ""
        }`}
      >
        <form onSubmit={handleSubmit}>
          <h3>Add a new person</h3>

          <label>First Name:</label>
          <input
            type="text"
            value={newPerson.firstname}
            onChange={(e) =>
              setNewPerson({ ...newPerson, firstname: e.target.value })
            }
          />

          <label>Last Name:</label>
          <input
            type="text"
            value={newPerson.lastname}
            onChange={(e) =>
              setNewPerson({ ...newPerson, lastname: e.target.value })
            }
          />

          <label>Birth Date:</label>
          <input
            type="date"
            value={newPerson.birth}
            onChange={(e) =>
              setNewPerson({ ...newPerson, birth: e.target.value })
            }
          />

          <label>Death Date:</label>
          <input
            type="date"
            value={newPerson.death}
            onChange={(e) =>
              setNewPerson({ ...newPerson, death: e.target.value })
            }
          />

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

          <label>Deceased:</label>
          <input
            type="checkbox"
            checked={newPerson.deceased}
            onChange={(e) =>
              setNewPerson({ ...newPerson, deceased: e.target.checked })
            }
          />

          <label>Father:</label>
          <select
            value={newPerson.parents[0] || ""}
            onChange={(e) =>
              setNewPerson({
                ...newPerson,
                parents: [Number(e.target.value), newPerson.parents[1]].filter(
                  Boolean
                ),
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

          <label>Mother:</label>
          <select
            value={newPerson.parents[1] || ""}
            onChange={(e) =>
              setNewPerson({
                ...newPerson,
                parents: [newPerson.parents[0], Number(e.target.value)].filter(
                  Boolean
                ),
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

          {/* <label>Spouse:</label>
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
          </select> */}

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
