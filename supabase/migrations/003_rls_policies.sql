-- ============================================================
-- Row Level Security (RLS) 設定
-- 全テーブルで RLS を有効化し、最小権限の原則を適用
-- ============================================================

-- products: 全員読み取り可、書き込みは認証済みのみ
alter table products enable row level security;

create policy "products_select_all"
  on products for select using (true);

create policy "products_insert_authenticated"
  on products for insert
  with check (auth.role() = 'authenticated');

create policy "products_update_authenticated"
  on products for update
  using (auth.role() = 'authenticated');

-- ingredients: 全員読み取り可、書き込みは認証済みのみ
alter table ingredients enable row level security;

create policy "ingredients_select_all"
  on ingredients for select using (true);

create policy "ingredients_insert_authenticated"
  on ingredients for insert
  with check (auth.role() = 'authenticated');

-- product_ingredients: 全員読み取り可
alter table product_ingredients enable row level security;

create policy "product_ingredients_select_all"
  on product_ingredients for select using (true);

create policy "product_ingredients_insert_authenticated"
  on product_ingredients for insert
  with check (auth.role() = 'authenticated');

-- user_closet: 自分のデータのみアクセス可
alter table user_closet enable row level security;

create policy "user_closet_own_rows"
  on user_closet for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- generic_matches: 全員読み取り可
alter table generic_matches enable row level security;

create policy "generic_matches_select_all"
  on generic_matches for select using (true);

create policy "generic_matches_insert_authenticated"
  on generic_matches for insert
  with check (auth.role() = 'authenticated');
