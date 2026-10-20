-- =====================================================================
-- LICEO SAVORE: menu items table (Supabase / PostgreSQL)
--
-- How to run: Supabase dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run.
--
-- Add, edit, or remove items afterwards in Table Editor -> food_items.
-- =====================================================================

create table public.food_items (
    id           bigint generated always as identity primary key,
    name         text not null,
    description  text,
    category     text not null,
    price        numeric(8, 2) not null check (price >= 0),
    image_url    text,
    is_available boolean not null default true,
    created_at   timestamptz not null default now()
);

-- The website uses the public (publishable) key, so lock the table and
-- only allow reading. Items are managed from the Supabase dashboard.
alter table public.food_items enable row level security;

create policy "Anyone can view the menu" on public.food_items
    for select using (true);

-- Sample items (edit or delete these in the Table Editor)
insert into public.food_items (name, description, category, price) values
    ('Chicken Adobo with Rice', 'Classic adobo with a cup of rice', 'Meals', 65),
    ('Pork Sinigang with Rice', 'Sour tamarind soup with rice', 'Meals', 70),
    ('Pancit Canton', 'Stir-fried noodles with vegetables', 'Meals', 45),
    ('Siomai (4 pcs)', 'Steamed pork dumplings with soy-calamansi', 'Snacks', 30),
    ('Banana Cue', 'Caramelized saba on a stick', 'Snacks', 15),
    ('Turon', 'Banana and jackfruit spring roll', 'Snacks', 15),
    ('Iced Tea', '16 oz', 'Drinks', 20),
    ('Bottled Water', '500 ml', 'Drinks', 15);
