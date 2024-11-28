export default function Spouse({
  selectedPerson,
  onSelectedPerson,
  spouse,
  editPersonEnabled,
}) {
  if (!spouse || spouse.deleted === true) {
    return null;
  }

  return (
    <div className="spouse">
      <h3>{`${[selectedPerson.firstname]}'s Spouse`}</h3>
      <div className="person-reference">
        <button
          onClick={() => onSelectedPerson(spouse)}
        >{`${spouse.firstname} ${spouse.lastname}`}</button>
      </div>
    </div>
  );
}
