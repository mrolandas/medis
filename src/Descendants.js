// Update Descendants.js
export default function Descendants({
  selectedPerson,
  onSelectedPerson,
  tree,
  childrenIds,
  onLifeYearRange,
}) {
  return selectedPerson.id === 0 || selectedPerson.id === null ? null : (
    <div className="descendants">
      <Children
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
        childrenIds={childrenIds}
        onLifeYearRange={onLifeYearRange}
      />
      <GrandChildren
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
        childrenIds={childrenIds}
        onLifeYearRange={onLifeYearRange}
      />
    </div>
  );
}

function Children({
  selectedPerson,
  onSelectedPerson,
  tree,
  childrenIds,
  onLifeYearRange,
}) {
  const childrenArray = childrenIds(selectedPerson.id);

  return childrenArray.length === 0 ? (
    <div className="children"></div>
  ) : (
    <div className="children">
      <h3>{selectedPerson.firstname}'s Children</h3>
      <div className="person-reference">
        {childrenArray.map((childId) => {
          const child = tree[childId];

          return (
            <label key={childId}>
              {onLifeYearRange(child)}

              <button key={childId} onClick={() => onSelectedPerson(child)}>
                {`  ${child.firstname} ${child.lastname}                `}
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function GrandChildren({
  selectedPerson,
  tree,
  onSelectedPerson,
  childrenIds,
  onLifeYearRange,
}) {
  const grandChildrenArray = (
    Array.isArray(childrenIds(selectedPerson.id))
      ? childrenIds(selectedPerson.id)
      : []
  ).reduce((acc, childId) => {
    const grandChildrenIds = Array.isArray(childrenIds(childId))
      ? childrenIds(childId).filter((id) => tree[id].deleted !== true)
      : [];
    return [...acc, ...grandChildrenIds];
  }, []);

  return grandChildrenArray.length === 0 ? (
    <div className="grandchildren"></div>
  ) : (
    <div className="grandchildren">
      <h3>{selectedPerson.firstname}'s Grandchildren</h3>
      <div className="person-reference">
        {grandChildrenArray.map((grandChildId) => {
          const grandChild = tree[grandChildId];

          return (
            <label key={grandChildId}>
              {onLifeYearRange(grandChild)}
              <button
                key={grandChildId}
                onClick={() => onSelectedPerson(grandChild)}
              >
                {` ${grandChild.firstname} ${grandChild.lastname}`}
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
}
