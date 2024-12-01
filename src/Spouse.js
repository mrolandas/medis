export default function Spouse({
  selectedPerson,
  onSelectedPerson,
  spouse,
  onLifeYearRange,
}) {
  if (!spouse || spouse.deleted === true) {
    return null;
  }

  return (
    <div className="spouse">
      <h3>{`${[selectedPerson.firstname]}'s Spouse`}</h3>
      <div className="person-reference">
        <label>
          {onLifeYearRange(spouse)}
          <button
            onClick={() => onSelectedPerson(spouse)}
          >{`${spouse.firstname} ${spouse.lastname}`}</button>
        </label>
      </div>
    </div>
  );
}
