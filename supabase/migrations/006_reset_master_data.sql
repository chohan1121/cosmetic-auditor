-- ============================================================
-- コスメのホンネ v2: 完全クライアントサイド設計への移行に伴う
-- マスターデータスキーマの作り直し。
-- 旧スキーマ(pgvector類似検索・JANスキャン・ユーザークローゼット)は廃止し、
-- 成分辞書・相性ルール・商品DB・カテゴリ相場のみを読み取り専用マスターとして持つ。
-- ============================================================

drop table if exists generic_matches cascade;
drop table if exists user_closet cascade;
drop table if exists product_ingredients cascade;
drop table if exists ingredients cascade;
drop table if exists products cascade;
drop type if exists irritation_risk cascade;

-- ============================================================
-- ingredients: 成分辞書
-- ============================================================
create table ingredients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  aliases     text[] not null default '{}',
  category    text not null,
  description text not null,
  good        smallint not null check (good between 0 and 3),
  caution     smallint not null check (caution between 0 and 3),
  tags        text[] not null default '{}'
);
comment on table ingredients is '成分ホンネ分析で参照する成分辞書。good/cautionは0-3の実力・刺激性スコア。';

-- ============================================================
-- compat_rules: 成分タグ同士の相性ルール
-- ============================================================
create table compat_rules (
  id     uuid primary key default gen_random_uuid(),
  tag_a  text not null,
  tag_b  text not null,
  level  text not null check (level in ('ng', 'caution', 'good')),
  title  text not null,
  reason text not null,
  advice text not null
);
comment on table compat_rules is 'マイポーチ相性チェック・成分組み合わせ事典で使う相性ルール。';

-- ============================================================
-- products: プチプラ実在品DB(ジェネリック提案・プロフィール推薦用)
-- ============================================================
create table products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  brand         text not null,
  category      text not null,
  price         integer not null,
  volume        integer not null,
  tags          text[] not null default '{}',
  point         text not null,
  domain        text not null check (domain in ('skin', 'hair')),
  skin_type     text[] not null default '{}',
  skin_concern  text[] not null default '{}',
  hair_type     text[] not null default '{}',
  hair_concern  text[] not null default '{}'
);
comment on table products is 'ジェネリック提案・肌質髪質プロフィール推薦で使う実在プチプラ商品DB。';

-- ============================================================
-- benchmarks: カテゴリ別の相場単価(コスパ診断用)
-- ============================================================
create table benchmarks (
  category   text primary key,
  label      text not null,
  unit_price numeric not null
);
comment on table benchmarks is 'コスパ診断のカテゴリ別相場単価(円/ml・g)。';

-- ============================================================
-- RLS: 認証なし設計のため、匿名ロールに読み取りのみ許可。
-- 書き込みはmigration/seed経由のみ(insert/updateポリシーは設けない)。
-- ============================================================
alter table ingredients enable row level security;
alter table compat_rules enable row level security;
alter table products enable row level security;
alter table benchmarks enable row level security;

create policy "ingredients_select_all" on ingredients for select using (true);
create policy "compat_rules_select_all" on compat_rules for select using (true);
create policy "products_select_all" on products for select using (true);
create policy "benchmarks_select_all" on benchmarks for select using (true);
