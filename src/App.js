import { useState } from "react";
import "./App.css";
import { familyTree } from "./familyTree";
import PersonDetails from "./PersonDetails";
import Search from "./Search";
import Elders from "./Elders";
import Descendants from "./Descendants";
import Spouse from "./Spouse";
import Siblings from "./Siblings";
import AddPerson from "./AddPerson";

export default function App() {
  let theFam = Object.values(familyTree);
  const [personImages, setPersonImages] = useState({});
  const [tree, setTree] = useState(theFam);
  const [selectedPerson, setSelectedPerson] = useState(tree[2]);
  const [editPersonEnabled, setEditPersonEnabled] = useState(false);

  function handleSelectedPerson(person) {
    if (!person || person.deleted === true) {
      setSelectedPerson(tree[0]);
      setEditPersonEnabled(false);
      return;
    }
    if (person !== selectedPerson) {
      setEditPersonEnabled(false);
    }
    setSelectedPerson({ ...person });
  }

  function handleTreeUpdate(updatedPerson, updateType) {
    if (updateType === "addPerson") {
      setTree((prevTree) => {
        const newTree = [...prevTree, updatedPerson];
        theFam = newTree;
        setSelectedPerson(updatedPerson);
        return newTree;
      });
      return;
    }

    setTree((oldTree) => {
      const newTree = oldTree.map((person) =>
        person.id === updatedPerson.id
          ? updateType === "delete"
            ? { ...person, deleted: true }
            : { ...updatedPerson }
          : person
      );
      theFam = newTree;

      if (updateType === "delete" && updatedPerson.id === selectedPerson.id) {
        setSelectedPerson(newTree[0]);
      } else {
        if (updateType === "deceasedChange") {
          updatedPerson = { ...updatedPerson, death: "" };
        }
        setSelectedPerson(newTree[updatedPerson.id]);
      }
      return newTree;
    });
  }

  function childrenIds(somePersonId) {
    return tree
      .filter((person) => {
        return (
          person.deleted === false && person.parents.includes(somePersonId)
        );
      })
      .map((person) => person.id);
  }

  function onSetEditPersonEnabled(value) {
    setEditPersonEnabled(value);
  }

  function lifeYearRange(person) {
    const birthDate = person.birth ? new Date(person.birth) : null;
    const deathDate = person.death ? new Date(person.death) : null;
    const presentDate = new Date();
    const birthYear = birthDate ? birthDate.getFullYear() : null;
    const deathYear = deathDate ? deathDate.getFullYear() : null;

    const calculateAge = (birth, death) => {
      if (!birth) return null;
      const endDate = death || presentDate;
      let age = endDate.getFullYear() - birth.getFullYear();
      const monthDiff = endDate.getMonth() - birth.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && endDate.getDate() < birth.getDate())
      ) {
        age--;
      }
      return age;
    };

    const age = calculateAge(birthDate, deathDate);

    return (
      <span className="life-year-range">
        {birthYear
          ? deathYear
            ? birthYear === deathYear
              ? birthYear
              : `${birthYear} - ${deathYear}, age ${age} ${
                  person.deceased && "(deceased)"
                }`
            : (person.deceased &&
                `${birthYear} - unknown ${
                  person.deceased ? "(deceased)" : ""
                }`) ||
              (!person.deceased && `${birthYear} - present, age ${age}`)
          : deathYear
          ? `unknown - ${deathYear} ${person.deceased ? "(deceased)" : ""}`
          : !birthYear && !deathYear
          ? (person.deceased &&
              `dates unknown ${person.deceased ? "(deceased)" : ""}`) ||
            (!person.deceased &&
              `dates unknown ${!person.deceased ? "(alive)" : ""}`)
          : null}
      </span>
    );
  }

  // function relationshipArray(person) {
  //   const fatherId =
  //     tree.filter(
  //       (person) =>
  //         selectedPerson.parents.includes(person.id) && person.gender === "M"
  //     )[0] || {};
  //   const motherId =
  //     tree.filter(
  //       (person) =>
  //         selectedPerson.parents.includes(person.id) && person.gender === "F"
  //     )[0] || {};
  //   const daughterIds = childrenIds(person.id)
  //     .flatMap((id) => (tree[id].gender === "F" ? id : null))
  //     .filter((id) => id !== null);
  //   const sonIds = childrenIds(person.id)
  //     .flatMap((id) => (tree[id].gender === "M" ? id : null))
  //     .filter((id) => id !== null);

  //   return {
  //     father: fatherId,
  //     mother: motherId,
  //     daughterIds: daughterIds,
  //     sonIds: sonIds,
  //   };
  // }
  // console.log(relationshipArray(selectedPerson));

  function generateImage(personId) {
    if (personImages[personId]) {
      return personImages[personId];
    } else {
      const randomNum = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://i.pravatar.cc/50?u=${personId}${randomNum}`;
      setTimeout(() => {
        setPersonImages((prevImages) => {
          const newImages = { ...prevImages, [personId]: imageUrl };
          return newImages;
        });
      }, 0);
      return imageUrl;
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* {selectedPerson.id !== 0 && (
          <div>
            <button
              value={selectedPerson}
              onClick={() => handleSelectedPerson()}
            >
              🔃
            </button>
          </div>
        )} */}
        <h1 onClick={() => handleSelectedPerson()}>Family</h1>

        <AddPerson
          onSelectedPerson={handleSelectedPerson}
          selectedPerson={selectedPerson}
          tree={tree}
          onTreeUpdate={handleTreeUpdate}
          editPersonEnabled={editPersonEnabled}
        />
        <Search
          selectedPerson={selectedPerson}
          onSelectedPerson={handleSelectedPerson}
          tree={tree}
          lifeYearRange={lifeYearRange}
        />
      </header>

      <div className="app-container">
        <div className="top-containers"></div>

        <div className="middle-containers">
          <div className="panel left-panel">
            <Elders
              selectedPerson={selectedPerson}
              onSelectedPerson={handleSelectedPerson}
              tree={tree}
              onLifeYearRange={lifeYearRange}
            />
          </div>

          <div className="panel center-panel">
            <PersonDetails
              selectedPerson={selectedPerson}
              onSelectedPerson={handleSelectedPerson}
              onTreeUpdate={handleTreeUpdate}
              tree={tree}
              childrenIds={childrenIds}
              editPersonEnabled={editPersonEnabled}
              handleSetEditPersonEnabled={onSetEditPersonEnabled}
              onLifeYearRange={lifeYearRange}
              OnGenerateImage={generateImage}
              personImages={personImages}
            />
          </div>

          <div className="panel right-panel">
            <Descendants
              selectedPerson={selectedPerson}
              onSelectedPerson={handleSelectedPerson}
              tree={tree}
              childrenIds={childrenIds}
              onLifeYearRange={lifeYearRange}
            />
          </div>
        </div>

        <div className="bottom-containers">
          <div className="panel center-panel">
            <Siblings
              selectedPerson={selectedPerson}
              onSelectedPerson={handleSelectedPerson}
              tree={tree}
              childrenIds={childrenIds}
              onLifeYearRange={lifeYearRange}
            />
          </div>
          <div className="panel center-panel">
            <Spouse
              selectedPerson={selectedPerson}
              onSelectedPerson={handleSelectedPerson}
              tree={tree}
              spouse={tree[selectedPerson.spouse]}
              editPersonEnabled={editPersonEnabled}
              onLifeYearRange={lifeYearRange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
