import { useState } from "react";

export default function Search({ selectedPerson, onSelectedPerson, tree }) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const results = Object.values(tree).filter((person) => {
      return (
        person.firstname.toLowerCase().includes(query) ||
        person.lastname.toLowerCase().includes(query)
      );
    });
    setSearchResults(results);
  }

  return (
    <>
      <nav className="nav">
        <input
          className="search-field"
          type="search"
          placeholder="Search by first or last name"
          value={searchQuery}
          onChange={handleSearch}
        />
        {selectedPerson.id !== 0 && (
          <div>
            <button onClick={() => onSelectedPerson()}>Clear Results</button>
          </div>
        )}
      </nav>
      <div className="search-results">
        {searchResults.length === 0 && searchQuery.length > 1 && (
          <ul>
            <li>No results found</li>
          </ul>
        )}

        {searchQuery.length > 1 &&
          searchResults.map((person) => (
            <ul key={person.id}>
              <li
                onClick={() => {
                  onSelectedPerson(person);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
              >
                {person.firstname} {person.lastname}
              </li>
            </ul>
          ))}
      </div>
    </>
  );
}
