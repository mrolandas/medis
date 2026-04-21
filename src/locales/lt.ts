// Lithuanian locale — all user-facing strings
// Code and comments remain in English; only UI text is in Lithuanian.

const lt = {
  // App
  "app.title": "Šeimos Medis",
  "app.loading": "Kraunama...",
  "app.error": "Įvyko klaida",
  "app.noData": "Nėra duomenų",

  // Auth gate
  "auth.title": "Prisijungimas",
  "auth.password": "Slaptažodis",
  "auth.submit": "Prisijungti",
  "auth.error": "Neteisingas slaptažodis",
  "auth.lockedPrefix": "Per daug bandymų. Bandykite po",
  "auth.lockedSuffix": "sek.",
  "validation.requiredFirstName": "Prašome įvesti vardą.",
  "validation.partialDateInvalid":
    "Neteisingas datos formatas. Naudokite: YYYY, YYYY-MM, YYYY-MM-DD arba palikite tuščią.",

  // Person fields
  "person.firstName": "Vardas",
  "person.lastName": "Pavardė",
  "person.maidenName": "Mergautinė pavardė",
  "person.gender": "Lytis",
  "person.gender.male": "Vyras",
  "person.gender.female": "Moteris",
  "person.gender.unknown": "Nežinoma",
  "person.birthDate": "Gimimo data",
  "person.birthPlace": "Gimimo vieta",
  "person.deathDate": "Mirties data",
  "person.deathPlace": "Mirties vieta",
  "person.burialPlace": "Palaidojimo vieta",
  "person.causeOfDeath": "Mirties priežastis",
  "person.occupation": "Profesija",
  "person.notes": "Pastabos / istorijos",
  "person.isDeceased": "Miręs(-usi)",
  "person.photo": "Nuotrauka",
  "person.age": "Amžius",
  "person.lifespan": "Gyvenimo metai",

  // Confidence levels
  confidence: "Patikimumas",
  "confidence.confirmed": "Patvirtinta",
  "confidence.probable": "Tikėtina",
  "confidence.uncertain": "Neaišku",
  "confidence.legendary": "Legenda",

  // Relationships
  "relation.spouse": "Sutuoktinis(-ė)",
  "relation.spouses": "Sutuoktiniai",
  "relation.parent": "Tėvas / Motina",
  "relation.parents": "Tėvai",
  "relation.father": "Tėvas",
  "relation.mother": "Motina",
  "relation.child": "Vaikas",
  "relation.children": "Vaikai",
  "relation.sibling": "Brolis / Sesuo",
  "relation.siblings": "Broliai / Seserys",
  "relation.marriageDate": "Santuokos data",
  "relation.divorceDate": "Skyrybų data",
  "relation.marriagePlace": "Santuokos vieta",

  // Actions
  "action.save": "Išsaugoti",
  "action.cancel": "Atšaukti",
  "action.delete": "Ištrinti",
  "action.edit": "Redaguoti",
  "action.add": "Pridėti",
  "action.familyMembers": "Sąrašas",
  "action.exportCsv": "Eksportuoti CSV",
  "action.exportPdf": "Eksportuoti PDF",
  "action.addPerson": "Pridėti asmenį",
  "action.addSpouse": "Pridėti sutuoktinį(-ę)",
  "action.addParent": "Pridėti tėvą / motiną",
  "action.addChild": "Pridėti vaiką",
  "action.search": "Ieškoti...",
  "action.close": "Uždaryti",
  "action.zoomIn": "Priartinti",
  "action.zoomOut": "Nutolinti",
  "action.fitView": "Rodyti visą medį",
  "action.confirm": "Patvirtinti",
  "action.selectPerson": "Pasirinkti asmenį",

  // Confirmation dialogs
  "confirm.deletePerson": "Ar tikrai norite ištrinti šį asmenį?",
  "confirm.deleteWarning": "Šis veiksmas negrįžtamas.",
  "confirm.removeRelation": "Ar tikrai norite pašalinti šį ryšį?",

  // Save status
  "save.saving": "Saugoma...",
  "save.saved": "Išsaugota",
  "save.error": "Klaida saugant",
  "save.unsaved": "Neišsaugoti pakeitimai",

  // Search
  "search.noResults": "Rezultatų nerasta",
  "search.placeholder": "Ieškoti pagal vardą...",

  // Empty states
  "empty.noPeople": "Šeimos medis tuščias. Pridėkite pirmą asmenį!",
  "empty.noSpouses": "Nėra sutuoktinių",
  "empty.noParents": "Tėvai nežinomi",
  "empty.noChildren": "Nėra vaikų",

  // Family members modal
  "familyMembers.title": "Visi šeimos nariai",
  "familyMembers.none": "Nėra",

  // Date hints
  "date.hint": "Pvz.: 1850, 1850-03, 1850-03-15 arba palikite tuščią",
} as const;

export type TranslationKey = keyof typeof lt;
export default lt;
