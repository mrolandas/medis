export default function Elders({ selectedPerson, onSelectedPerson, tree }) {
  return selectedPerson.id === 0 || selectedPerson.id === null ? null : (
    <div className="elders">
      <GrandParents
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
      />
      <Parents
        selectedPerson={selectedPerson}
        onSelectedPerson={onSelectedPerson}
        tree={tree}
      />
    </div>
  );
}

function Parents({ selectedPerson, onSelectedPerson, tree }) {
  const parents = selectedPerson.parents;
  if (parents.length === 0) return null;
  return (
    <div className="parents">
      <h3>{selectedPerson.firstname}'s Parents</h3>
      <div className="person-reference">
        {parents.map((parentId) => {
          const parent = tree[parentId];
          return (
            <button key={parentId} onClick={() => onSelectedPerson(parent)}>
              {`${parent.firstname} ${parent.lastname}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrandParents({ selectedPerson, tree, onSelectedPerson }) {
  const parents = selectedPerson.parents;
  const grandParents = parents.flatMap((parentId) => tree[parentId].parents);

  return grandParents.length === 0 ? null : (
    <div className="grandparents">
      <h3>{selectedPerson.firstname}'s Grandparents</h3>
      <div className="person-reference">
        {grandParents.map((grandParentId) => {
          const grandParent = tree[grandParentId];
          return (
            <button
              key={grandParentId}
              onClick={() => onSelectedPerson(grandParent)}
            >
              {` ${grandParent.firstname} ${grandParent.lastname}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
