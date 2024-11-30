import { useState } from "react";
import EditRelationships from "./EditRelationships";
import EditPersonDetails from "./EditPersonDetails";

export default function PersonDetails({
  selectedPerson,
  tree,
  onTreeUpdate,
  editPersonEnabled,
  handleSetEditPersonEnabled,
  onLifeYearRange,
  OnGenerateImage,
}) {
  const [deletePersonEnabled, setDeletePersonEnabled] = useState(false);

  function resetPersonView() {
    setDeletePersonEnabled(false);
    handleSetEditPersonEnabled(false);
  }

  return selectedPerson.id === null || selectedPerson === tree[0] ? null : (
    <>
      <div className="person-details">
        <div class="person-header-container">
          <div>
            <h2>
              {selectedPerson.firstname} {selectedPerson.lastname}
            </h2>
            <span>{onLifeYearRange(selectedPerson)}</span>
          </div>
          <img
            src={OnGenerateImage(selectedPerson.id)}
            alt={`${selectedPerson.firstname} ${selectedPerson.lastname} portrait`}
            className="person-portrait"
          />
        </div>

        <div className="person-edit-container">
          <EditPersonDetails
            selectedPerson={selectedPerson}
            onTreeUpdate={onTreeUpdate}
            editPersonEnabled={editPersonEnabled}
          />
          <EditRelationships
            selectedPerson={selectedPerson}
            tree={tree}
            onTreeUpdate={onTreeUpdate}
            editPersonEnabled={editPersonEnabled}
          />
        </div>

        <div className="person-control">
          <div className="left-controls">
            <button
              className={`delete-person-button ${
                !editPersonEnabled || deletePersonEnabled ? "hidden" : ""
              } `}
              onClick={() => {
                setDeletePersonEnabled(true);
              }}
            >
              Delete Person
            </button>
            <button
              className={`delete-person-button cancel ${
                deletePersonEnabled ? "" : "hidden"
              }`}
              onClick={() => {
                setDeletePersonEnabled(false);
              }}
            >
              Cancel Delete
            </button>
          </div>

          <div className="right-controls">
            {deletePersonEnabled && (
              <button
                className="delete-person-button confirm"
                onClick={() => {
                  onTreeUpdate(selectedPerson, "delete");
                  resetPersonView();
                }}
              >
                Confirm Delete
              </button>
            )}
            <button
              className={`edit-person-button ${
                deletePersonEnabled ? "hidden" : ""
              } ${editPersonEnabled ? "confirm-button" : ""}`}
              onClick={() => {
                handleSetEditPersonEnabled(!editPersonEnabled);
              }}
            >
              {editPersonEnabled ? "Finished Editing" : "Edit Person"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
