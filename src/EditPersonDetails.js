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
          ? "Finished Editing Person Details ▲"
          : "Edit Person Details ▼"}
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
              <label>Birth Date</label>{" "}
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
              <label>Deceased</label>
              <div className="checkboxDiv">
                <input
                  type="checkbox"
                  checked={selectedPerson.deceased ? true : false}
                  onChange={(e) => {
                    if (editPersonEnabled) {
                      const updatedPerson = {
                        ...selectedPerson,
                        deceased: e.target.checked,
                      };
                      onTreeUpdate(updatedPerson, "deceasedChange");
                    }
                  }}
                  readOnly={!editPersonEnabled}
                />
              </div>
            </li>
            <li>
              <label>Death Date</label>{" "}
              {selectedPerson.deceased !== true ? (
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
