import { useState } from "react";
import "./App.css";
import { familyTree } from "./familyTree";
import PersonDetails from "./PersonDetails";
import Search from "./Search";
import Elders from "./Elders";
import Descendants from "./Descendants";

let theFam = Object.values(familyTree);

export default function App() {
  const [tree, setTree] = useState(theFam);
  const [selectedPerson, setSelectedPerson] = useState(tree[2]);

  function handleSelectedPerson(person) {
    !person ? setSelectedPerson(tree[0]) : setSelectedPerson(person);
  }

  function handleTreeUpdate(updatedPerson) {
    if (!updatedPerson) {
      // Handle deletion case
      setTree((oldTree) => {
        const newTree = oldTree.filter(
          (person) => person.id !== selectedPerson.id
        );
        theFam = newTree; // Keep theFam in sync
        setSelectedPerson(tree[0]); // Reset selection to first person
        return newTree;
      });
    } else {
      // Handle normal update case
      setTree((oldTree) => {
        const newTree = oldTree.map((person) =>
          person.id === updatedPerson.id ? updatedPerson : person
        );
        theFam = newTree;
        return newTree;
      });
    }
  }

  function childrenIds(somePersonId) {
    return tree
      .filter((person) => person.parents.includes(somePersonId))
      .map((person) => person.id);
  }

  return (
    <div className="App">
      <Search
        selectedPerson={selectedPerson}
        onSelectedPerson={handleSelectedPerson}
        tree={tree}
      />

      <div className="app-container">
        <div className="left-panel">
          <Elders
            selectedPerson={selectedPerson}
            onSelectedPerson={handleSelectedPerson}
            tree={tree}
          />
        </div>

        <div className="center-panel">
          <PersonDetails
            selectedPerson={selectedPerson}
            onSelectedPerson={handleSelectedPerson}
            onTreeUpdate={handleTreeUpdate}
            tree={tree}
            childrenIds={childrenIds}
          />
        </div>

        <div className="right-panel">
          <Descendants
            selectedPerson={selectedPerson}
            onSelectedPerson={handleSelectedPerson}
            tree={tree}
            childrenIds={childrenIds}
          />
        </div>
      </div>
    </div>
  );
}
