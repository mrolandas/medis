import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Person, Marriage, ParentChild, PersonInput } from "../types";

interface TreeData {
  people: Person[];
  marriages: Marriage[];
  parentChild: ParentChild[];
  loading: boolean;
  error: string | null;
  // Mutations
  addPerson: (input: PersonInput) => Promise<Person | null>;
  updatePerson: (id: string, updates: Partial<PersonInput>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  addMarriage: (m: Omit<Marriage, "id">) => Promise<Marriage | null>;
  deleteMarriage: (id: string) => Promise<void>;
  addParentChild: (
    parentId: string,
    childId: string,
    confidence?: string | null,
  ) => Promise<ParentChild | null>;
  deleteParentChild: (id: string) => Promise<void>;
  /** Get a person by ID from the local cache */
  getPerson: (id: string) => Person | undefined;
  /** Save status for UI indicator */
  saveStatus: "idle" | "saving" | "saved" | "error";
}

const TreeDataContext = createContext<TreeData | null>(null);

export function useTreeData(): TreeData {
  const ctx = useContext(TreeDataContext);
  if (!ctx) throw new Error("useTreeData must be used within TreeDataProvider");
  return ctx;
}

export function TreeDataProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [parentChild, setParentChild] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<TreeData["saveStatus"]>("idle");

  // Fetch all data on mount
  useEffect(() => {
    async function fetchAll() {
      try {
        const [pRes, mRes, pcRes] = await Promise.all([
          supabase.from("people").select("*").order("created_at"),
          supabase.from("marriages").select("*").order("order_index"),
          supabase.from("parent_child").select("*"),
        ]);
        if (pRes.error) throw pRes.error;
        if (mRes.error) throw mRes.error;
        if (pcRes.error) throw pcRes.error;
        setPeople(pRes.data ?? []);
        setMarriages(mRes.data ?? []);
        setParentChild(pcRes.data ?? []);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const getPerson = useCallback(
    (id: string) => people.find((p) => p.id === id),
    [people],
  );

  // Helper to flash save status
  const withSave = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setSaveStatus("saving");
    try {
      const result = await fn();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
      return result;
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      throw new Error("Save failed");
    }
  }, []);

  const addPerson = useCallback(
    async (input: PersonInput): Promise<Person | null> => {
      return withSave(async () => {
        const { data, error } = await supabase
          .from("people")
          .insert(input)
          .select()
          .single();
        if (error) throw error;
        setPeople((prev) => [...prev, data]);
        return data;
      });
    },
    [withSave],
  );

  const updatePerson = useCallback(
    async (id: string, updates: Partial<PersonInput>) => {
      // Optimistic update
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p,
        ),
      );
      await withSave(async () => {
        const { error } = await supabase
          .from("people")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      });
    },
    [withSave],
  );

  const deletePerson = useCallback(
    async (id: string) => {
      await withSave(async () => {
        // Delete related marriages and parent_child records first
        await supabase
          .from("marriages")
          .delete()
          .or(`person1_id.eq.${id},person2_id.eq.${id}`);
        await supabase
          .from("parent_child")
          .delete()
          .or(`parent_id.eq.${id},child_id.eq.${id}`);
        const { error } = await supabase.from("people").delete().eq("id", id);
        if (error) throw error;
        setPeople((prev) => prev.filter((p) => p.id !== id));
        setMarriages((prev) =>
          prev.filter((m) => m.person1_id !== id && m.person2_id !== id),
        );
        setParentChild((prev) =>
          prev.filter((pc) => pc.parent_id !== id && pc.child_id !== id),
        );
      });
    },
    [withSave],
  );

  const addMarriage = useCallback(
    async (m: Omit<Marriage, "id">): Promise<Marriage | null> => {
      return withSave(async () => {
        const { data, error } = await supabase
          .from("marriages")
          .insert(m)
          .select()
          .single();
        if (error) throw error;
        setMarriages((prev) => [...prev, data]);
        return data;
      });
    },
    [withSave],
  );

  const deleteMarriage = useCallback(
    async (id: string) => {
      await withSave(async () => {
        const { error } = await supabase
          .from("marriages")
          .delete()
          .eq("id", id);
        if (error) throw error;
        setMarriages((prev) => prev.filter((m) => m.id !== id));
      });
    },
    [withSave],
  );

  const addParentChild = useCallback(
    async (
      parentId: string,
      childId: string,
      confidence: string | null = null,
    ): Promise<ParentChild | null> => {
      return withSave(async () => {
        const { data, error } = await supabase
          .from("parent_child")
          .insert({ parent_id: parentId, child_id: childId, confidence })
          .select()
          .single();
        if (error) throw error;
        setParentChild((prev) => [...prev, data]);
        return data;
      });
    },
    [withSave],
  );

  const deleteParentChild = useCallback(
    async (id: string) => {
      await withSave(async () => {
        const { error } = await supabase
          .from("parent_child")
          .delete()
          .eq("id", id);
        if (error) throw error;
        setParentChild((prev) => prev.filter((pc) => pc.id !== id));
      });
    },
    [withSave],
  );

  return (
    <TreeDataContext.Provider
      value={{
        people,
        marriages,
        parentChild,
        loading,
        error,
        addPerson,
        updatePerson,
        deletePerson,
        addMarriage,
        deleteMarriage,
        addParentChild,
        deleteParentChild,
        getPerson,
        saveStatus,
      }}
    >
      {children}
    </TreeDataContext.Provider>
  );
}
