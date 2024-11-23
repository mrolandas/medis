// Update Descendants.js
export default function Descendants({
  selectedPerson,
  onSelectedPerson,
  tree,
  childrenIds,
}) {
  return selectedPerson.id === 0 || selectedPerson.id === null ? null : (
    <div className="descendants">
      <Children
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
        childrenIds={childrenIds}
      />
      <GrandChildren
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
        childrenIds={childrenIds}
      />
    </div>
  );
}

function Children({ selectedPerson, onSelectedPerson, tree, childrenIds }) {
  const childrenArray = childrenIds(selectedPerson.id);

  if (childrenArray.length === 0) return null;
  return (
    <div className="children">
      <h3>{selectedPerson.firstname}'s Children</h3>
      <div className="person-reference">
        {childrenArray.map((childId) => {
          const child = tree[childId];

          return (
            <button key={childId} onClick={() => onSelectedPerson(child)}>
              {`${child.firstname} ${child.lastname}`}
            </button>
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
}) {
  const grandChildrenArray = (
    Array.isArray(childrenIds(selectedPerson.id))
      ? childrenIds(selectedPerson.id)
      : []
  ).reduce((acc, childId) => {
    const grandChildrenIds = Array.isArray(childrenIds(childId))
      ? childrenIds(childId)
      : [];
    return [...acc, ...grandChildrenIds];
  }, []);

  return grandChildrenArray.length === 0 ? null : (
    <div className="grandchildren">
      <h3>{selectedPerson.firstname}'s Grandchildren</h3>
      <div className="person-reference">
        {grandChildrenArray.map((grandChildId) => {
          const grandChild = tree[grandChildId];

          return (
            <button
              key={grandChildId}
              onClick={() => onSelectedPerson(grandChild)}
            >
              {` ${grandChild.firstname} ${grandChild.lastname}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
