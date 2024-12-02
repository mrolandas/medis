import { useState, useEffect, useRef } from "react";

export default function Search({
  selectedPerson,
  onSelectedPerson,
  tree,
  lifeYearRange,
}) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchResultsRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    if (searchResults.length > 0) {
      setSelectedIndex(0); // Select the top result by default
    } else {
      setSelectedIndex(-1); // Reset selection when no results
    }
  }, [searchResults]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setSearchResults([]);
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const results = Object.values(tree).filter((person) => {
      return person.deleted === true
        ? null
        : person.firstname.toLowerCase().includes(query) ||
            person.lastname.toLowerCase().includes(query);
    });
    setSearchResults(results);
  }

  function handleKeyDown(e) {
    if (searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = searchResults[selectedIndex];
          onSelectedPerson(selected);
          setSearchResults([]);
          setSearchQuery("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setSearchResults([]);
        setSearchQuery("");
        break;
      default:
        // Handle any other key press
        break;
    }
  }

  return (
    <>
      <div className="search-container">
        <input
          className="search-field"
          type="search"
          placeholder="Search by first or last name"
          value={searchQuery}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
        />
      </div>
      {searchQuery.length > 1 && (
        <>
          <div
            className={`${searchResults != null ? "overlay" : ""}`}
            onClick={() => setSearchResults([])}
          ></div>

          <div className="search-results" ref={searchResultsRef}>
            {searchResults.length === 0 ? (
              <ul>
                <li>No results found</li>
              </ul>
            ) : (
              searchResults.map((person, index) => (
                <ul key={person.id}>
                  <li
                    ref={index === selectedIndex ? selectedRef : null}
                    className={index === selectedIndex ? "selected" : ""}
                    onClick={() => {
                      onSelectedPerson(person);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                  >
                    {person.firstname} {person.lastname} {lifeYearRange(person)}
                  </li>
                </ul>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
