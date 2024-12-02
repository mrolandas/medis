import { useEffect, useState } from "react";

export default function EditRelationships({
  selectedPerson,
  tree,
  onTreeUpdate,
  editPersonEnabled,
}) {
  const [EditRelationships, setEditRelationships] = useState(false);
  const [selectedSpouse, setSelectedSpouse] = useState(selectedPerson.spouse);
  const [selectedFather, setSelectedFather] = useState(selectedPerson.father);
  const [selectedMother, setSelectedMother] = useState(selectedPerson.mother);

  useEffect(() => {
    if (!editPersonEnabled) {
      setEditRelationships(false);
    }
  }, [editPersonEnabled]);

  const oldSpouse = tree[selectedPerson.spouse];
  const oldFather =
    tree.filter(
      (person) =>
        selectedPerson.parents.includes(person.id) && person.gender === "M"
    )[0] || {};
  const oldMother =
    tree.filter(
      (person) =>
        selectedPerson.parents.includes(person.id) && person.gender === "F"
    )[0] || {};

  function handleSubmit(e, type) {
    e.preventDefault();
    type === "spouse" && handleSpouseChange();
    type === "father" && handleFatherChange();
    type === "mother" && handleMotherChange();

    function handleSpouseChange() {
      const newSpouse = tree[selectedSpouse];

      oldSpouse && onTreeUpdate({ ...oldSpouse, spouse: [] });
      newSpouse && onTreeUpdate({ ...newSpouse, spouse: selectedPerson.id });
      onTreeUpdate({ ...selectedPerson, spouse: selectedSpouse });
    }

    function handleFatherChange() {
      const newFather = tree[selectedFather];

      const newParentsArray = !newFather
        ? selectedPerson.parents.filter((id) => id !== oldFather.id)
        : oldFather.id
        ? selectedPerson.parents.map((id) =>
            id === oldFather.id ? newFather.id : id
          )
        : [...selectedPerson.parents, newFather.id];

      onTreeUpdate({
        ...selectedPerson,
        parents: newParentsArray,
      });
    }

    function handleMotherChange() {
      const newMother = tree[selectedMother];

      const newParentsArray = !newMother
        ? selectedPerson.parents.filter((id) => id !== oldMother.id)
        : oldMother.id
        ? selectedPerson.parents.map((id) =>
            id === oldMother.id ? newMother.id : id
          )
        : [...selectedPerson.parents, newMother.id];

      onTreeUpdate({
        ...selectedPerson,
        parents: newParentsArray,
      });
    }
  }

  function handleEditRelationships() {
    setEditRelationships(!EditRelationships);
  }

  return !editPersonEnabled ? null : (
    <>
      <button onClick={() => handleEditRelationships()}>
        {EditRelationships
          ? "Finished Editing Relationships ▲"
          : "Edit Relationships ▼"}
      </button>
      {EditRelationships ? (
        <div
          className={`edit-relationships ${EditRelationships ? "" : "hidden"}`}
        >
          <form
            className="relationship-form"
            onSubmit={(e) => {
              handleSubmit(e, "spouse");
            }}
          >
            <label>Spouse: </label>
            <select
              defaultValue={selectedPerson.spouse[0]}
              name="selectedSpouse"
              onChange={(e) => setSelectedSpouse(e.target.value)}
            >
              <option value=""></option>
              {tree.map((person) => {
                if (
                  person.id === selectedPerson.id ||
                  person.deleted ||
                  person.id === tree[0].id
                ) {
                  return null;
                } else {
                  return (
                    <option key={person.id} value={person.id}>
                      {person.firstname} {person.lastname}
                    </option>
                  );
                }
              })}
            </select>
            <button type="submit">Apply</button>
          </form>
          <form
            className="relationship-form"
            onSubmit={(e) => {
              handleSubmit(e, "father");
            }}
          >
            <label>Father:</label>
            <select
              defaultValue={oldFather.id}
              name="selectedFather"
              onChange={(e) => setSelectedFather(e.target.value)}
            >
              <option value=""></option>
              {tree.map((person) => {
                if (
                  person.id === selectedPerson.id ||
                  person.deleted ||
                  person.id === tree[0].id ||
                  tree[person.id].gender === "F"
                ) {
                  return null;
                } else {
                  return (
                    <option key={person.id} value={person.id}>
                      {person.firstname} {person.lastname}
                    </option>
                  );
                }
              })}
            </select>
            <button type="submit">Apply</button>
          </form>
          <form
            className="relationship-form"
            onSubmit={(e) => {
              handleSubmit(e, "mother");
            }}
          >
            <label>Mother:</label>
            <select
              name="selectedMother"
              defaultValue={oldMother.id}
              onChange={(e) => setSelectedMother(e.target.value)}
            >
              <option value=""></option>
              {tree.map((person) => {
                if (
                  person.id === selectedPerson.id ||
                  person.deleted ||
                  person.id === tree[0].id ||
                  tree[person.id].gender === "M"
                ) {
                  return null;
                } else {
                  return (
                    <option key={person.id} value={person.id}>
                      {person.firstname} {person.lastname}
                    </option>
                  );
                }
              })}
            </select>
            <button type="submit">Apply</button>
          </form>
        </div>
      ) : null}
    </>
  );
}
