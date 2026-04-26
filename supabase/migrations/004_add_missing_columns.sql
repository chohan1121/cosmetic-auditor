-- products: 取得元追跡 + 成分ベクトル
alter table products
  add column if not exists source text check (source in ('yahoo', 'rakuten', 'mock')) default 'mock',
  add column if not exists source_url text,
  add column if not exists ingredient_vector vector(768);

-- ingredients: 表記揺れ対応 + シナジー重み
alter table ingredients
  add column if not exists aliases text[] not null default '{}',
  add column if not exists weight_in_synergy numeric not null default 1.0;

-- product_ingredients: マッチングメタデータ
alter table product_ingredients
  add column if not exists matched_text text,
  add column if not exists match_confidence text check (match_confidence in ('exact', 'alias', 'fuzzy', 'embedding'));
