do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'people_first_name_len_chk'
  ) then
    alter table people
      add constraint people_first_name_len_chk
      check (char_length(trim(first_name)) between 1 and 120) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'people_last_name_len_chk'
  ) then
    alter table people
      add constraint people_last_name_len_chk
      check (last_name is null or char_length(trim(last_name)) <= 120) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'people_maiden_name_len_chk'
  ) then
    alter table people
      add constraint people_maiden_name_len_chk
      check (maiden_name is null or char_length(trim(maiden_name)) <= 120) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'people_birth_date_fmt_chk'
  ) then
    alter table people
      add constraint people_birth_date_fmt_chk
      check (
        birth_date is null
        or birth_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'people_death_date_fmt_chk'
  ) then
    alter table people
      add constraint people_death_date_fmt_chk
      check (
        death_date is null
        or death_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'people_notes_len_chk'
  ) then
    alter table people
      add constraint people_notes_len_chk
      check (notes is null or char_length(notes) <= 5000) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'marriages_marriage_date_fmt_chk'
  ) then
    alter table marriages
      add constraint marriages_marriage_date_fmt_chk
      check (
        marriage_date is null
        or marriage_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'marriages_divorce_date_fmt_chk'
  ) then
    alter table marriages
      add constraint marriages_divorce_date_fmt_chk
      check (
        divorce_date is null
        or divorce_date ~ '^(unknown|[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2])|[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))$'
      ) not valid;
  end if;
end $$;