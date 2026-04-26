-- productsテーブルが手動作成された場合の欠損カラム補完
alter table products
  add column if not exists jan_code       text unique,
  add column if not exists name           text,
  add column if not exists brand          text,
  add column if not exists category       text,
  add column if not exists price_jpy      integer,
  add column if not exists image_url      text,
  add column if not exists amazon_url     text,
  add column if not exists raw_ingredient_text text,
  add column if not exists created_at     timestamptz not null default now();
