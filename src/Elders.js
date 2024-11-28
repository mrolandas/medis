export default function Elders({
  selectedPerson,
  onSelectedPerson,
  tree,
  onLifeYearRange,
}) {
  return selectedPerson.id === 0 || selectedPerson.id === null ? null : (
    <div className="elders">
      <GrandParents
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
        onLifeYearRange={onLifeYearRange}
      />
      <Parents
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
        onLifeYearRange={onLifeYearRange}
      />
    </div>
  );
}

function Parents({ selectedPerson, onSelectedPerson, tree, onLifeYearRange }) {
  const selectedFather =
    tree.filter(
      (person) =>
        selectedPerson.parents.includes(person.id) && person.gender === "M"
    )[0] || {};

  const parents = selectedPerson.parents.filter(
    (parentId) => tree[parentId].deleted !== true
  );

  if (parents.length === 0) return null;
  return (
    <div className="parents">
      <h3>{selectedPerson.firstname}'s Parents</h3>
      <div className="person-reference">
        {parents.map((parentId) => {
          const parent = tree[parentId];
          return (
            <label key={parentId}>
              {onLifeYearRange(parent)}
              <button key={parentId} onClick={() => onSelectedPerson(parent)}>
                {`${parent.firstname} ${parent.lastname} `}
                <span>
                  {parent === selectedFather ? "(Father)" : "(Mother)"}
                </span>
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function GrandParents({
  selectedPerson,
  tree,
  onSelectedPerson,
  onLifeYearRange,
}) {
  const parents = selectedPerson.parents.filter(
    (parentId) => tree[parentId].deleted !== true
  );
  const grandParents = parents.flatMap((parentId) => tree[parentId].parents);

  return grandParents.length === 0 ? null : (
    <div className="grandparents">
      <h3>{selectedPerson.firstname}'s Grandparents</h3>
      <div className="person-reference">
        {grandParents.map((grandParentId) => {
          const grandParent = tree[grandParentId];
          return (
            <label key={grandParentId}>
              {onLifeYearRange(grandParent)}
              <button
                key={grandParentId}
                onClick={() => onSelectedPerson(grandParent)}
              >
                {` ${grandParent.firstname} ${grandParent.lastname}`}{" "}
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
}
