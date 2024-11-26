import { useState } from "react";

export default function PersonDetails({
  selectedPerson,
  onSelectedPerson,
  tree,
  onTreeUpdate,
}) {
  const [deletePersonEnabled, setDeletePersonEnabled] = useState(false);
  const [editPersonEnabled, setEditPersonEnabled] = useState(false);

  function resetPersonView() {
    setDeletePersonEnabled(false);
    setEditPersonEnabled(false);
  }

  return selectedPerson.id === null || selectedPerson === tree[0] ? null : (
    <>
      <div className="person-details">
        <h2>
          {selectedPerson.firstname} {selectedPerson.lastname}
        </h2>

        <ul>
          <li>
            <label>Name:</label>
            <input
              type="text"
              value={selectedPerson.firstname}
              onChange={(e) => {
                if (editPersonEnabled) {
                  const updatedPerson = {
                    ...selectedPerson,
                    firstname: e.target.value,
                  };
                  onTreeUpdate(updatedPerson);
                }
              }}
              readOnly={!editPersonEnabled}
            />
            <input
              type="text"
              value={selectedPerson.lastname}
              onChange={(e) => {
                if (editPersonEnabled) {
                  const updatedPerson = {
                    ...selectedPerson,
                    lastname: e.target.value,
                  };
                  onTreeUpdate(updatedPerson);
                }
              }}
              readOnly={!editPersonEnabled}
            />
          </li>
          <li>
            <label>Birth/Death:</label>{" "}
            {selectedPerson.birth === "" ? (
              <span className="birth-death">Unknown</span>
            ) : (
              <input
                type="date"
                value={selectedPerson.birth}
                onChange={(e) => {
                  if (editPersonEnabled) {
                    const updatedPerson = {
                      ...selectedPerson,
                      birth: e.target.value,
                    };
                    onTreeUpdate(updatedPerson);
                  }
                }}
                readOnly={!editPersonEnabled}
              />
            )}
            {!editPersonEnabled && selectedPerson.death === "" ? (
              <span className="birth-death">Unknown</span>
            ) : (
              <input
                type="date"
                value={selectedPerson.death}
                onChange={(e) => {
                  if (editPersonEnabled) {
                    const updatedPerson = {
                      ...selectedPerson,
                      death: e.target.value,
                    };
                    onTreeUpdate(updatedPerson);
                  }
                }}
                readOnly={!editPersonEnabled}
              />
            )}
          </li>

          <li>
            <label>Spouse:</label>{" "}
            <div className="person-reference">
              {selectedPerson.spouse.map((spouseId) => {
                const spouse = tree[spouseId];
                return (
                  <button
                    key={spouseId}
                    onClick={() => onSelectedPerson(spouse)}
                  >
                    {`${spouse.firstname} ${spouse.lastname}`}
                  </button>
                );
              })}
            </div>
          </li>
        </ul>
        <div className="person-control">
          <div className="left-controls">
            <button
              className={`delete-person-button ${
                !editPersonEnabled ? "hidden" : ""
              } ${deletePersonEnabled ? "cancel" : ""}`}
              onClick={() => {
                setDeletePersonEnabled(!deletePersonEnabled);
              }}
            >
              {deletePersonEnabled ? "Cancel" : "Delete Person"}
            </button>
          </div>

          <div className="right-controls">
            {deletePersonEnabled && (
              <button
                className="delete-person-button confirm"
                onClick={() => {
                  onTreeUpdate(null);
                  resetPersonView();
                }}
              >
                Confirm Delete
              </button>
            )}
            <button
              className={`edit-person-button ${
                deletePersonEnabled ? "hidden" : ""
              }`}
              onClick={() => {
                setEditPersonEnabled(!editPersonEnabled);
              }}
            >
              {editPersonEnabled ? "Done Editing" : "Edit"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
