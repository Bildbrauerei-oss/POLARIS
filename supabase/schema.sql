create table if not exists artikel (
  id uuid primary key default gen_random_uuid(),
  titel text not null,
  quelle text,
  url text unique not null,
  datum timestamptz,
  rohtext text,
  kategorie text,
  suchbegriff text,
  sentiment text,
  relevanz text,
  handlungsbedarf boolean default false,
  zusammenfassung text,
  analysiert boolean default false,
  erstellt_am timestamptz default now()
);

create index if not exists idx_artikel_datum on artikel(datum desc);
create index if not exists idx_artikel_kategorie on artikel(kategorie);
create index if not exists idx_artikel_analysiert on artikel(analysiert);

alter table artikel enable row level security;
create policy "Alle lesen" on artikel for select using (true);
create policy "Alle schreiben" on artikel for insert with check (true);
create policy "Alle aktualisieren" on artikel for update using (true);
create policy "Alle löschen" on artikel for delete using (true);
