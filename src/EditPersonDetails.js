import { useState } from "react";
export default function EditPersonDetails({
  selectedPerson,
  onTreeUpdate,
  editPersonEnabled,
}) {
  const [EditPersonDetails, setEditPersonDetails] = useState(false);

  function handleEditPersonDetails() {
    setEditPersonDetails(!EditPersonDetails);
  }
  return !editPersonEnabled ? null : (
    <>
      <button onClick={() => handleEditPersonDetails()}>
        {EditPersonDetails
          ? "Finished Editing Person Details"
          : "Edit Person Details"}
      </button>
      <div className="edit-person-details">
        <div className={EditPersonDetails ? "" : "hidden"}>
          <ul>
            <li>
              <label>Name:</label>
              <input
                type="text"
                value={selectedPerson.firstname ? selectedPerson.firstname : ""}
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
              <label>Birth</label>{" "}
              {!editPersonEnabled && selectedPerson.birth === "" ? (
                <span className="birth-death"></span>
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
            </li>
            <li>
              <label>Death</label>{" "}
              {!editPersonEnabled && selectedPerson.death === "" ? (
                <span className="birth-death"></span>
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
          </ul>
        </div>
      </div>
    </>
  );
}
