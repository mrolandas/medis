// Database entity types matching Supabase schema

export interface Person {
  id: string;
  first_name: string;
  last_name: string | null;
  maiden_name: string | null;
  gender: "M" | "F" | null;
  birth_date: string | null;
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  burial_place: string | null;
  cause_of_death: string | null;
  occupation: string | null;
  notes: string | null;
  confidence: Confidence;
  is_deceased: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Marriage {
  id: string;
  person1_id: string;
  person2_id: string;
  marriage_date: string | null;
  divorce_date: string | null;
  marriage_place: string | null;
  order_index: number;
}

export interface ParentChild {
  id: string;
  parent_id: string;
  child_id: string;
  confidence: Confidence | null;
}

export type Confidence = "confirmed" | "probable" | "uncertain" | "legendary";

// Convenience types for the UI

export interface PersonWithRelations extends Person {
  spouses: Marriage[];
  parents: ParentChild[];
  children: ParentChild[];
}

/** Form data for creating/updating a person (all optional except first_name) */
export type PersonInput = Omit<Person, "id" | "created_at" | "updated_at">;

/** Partial update — only send changed fields */
export type PersonUpdate = Partial<PersonInput> & { id: string };
