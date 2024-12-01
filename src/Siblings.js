export default function Siblings({
  selectedPerson,
  onSelectedPerson,
  tree,
  childrenIds,
  onLifeYearRange,
}) {
  const siblings = [
    ...new Set(
      selectedPerson.parents
        .flatMap((parentId) => childrenIds(parentId))
        .filter((childId) => childId !== selectedPerson.id)
    ),
  ]
    .map((id) => tree.find((person) => person.id === id))
    .filter((person) => person.deleted !== true);

  return siblings.length === 0 ? null : (
    <div className="siblings">
      <h3>{`${selectedPerson.firstname}'s Siblings`}</h3>
      <div className="person-reference">
        {siblings.map((sibling) => (
          <label key={sibling.id}>
            {onLifeYearRange(sibling)}
            <button
              key={sibling.id}
              onClick={() => onSelectedPerson(sibling)}
            >{`${sibling.firstname} ${sibling.lastname}`}</button>
          </label>
        ))}
      </div>
    </div>
  );
}
