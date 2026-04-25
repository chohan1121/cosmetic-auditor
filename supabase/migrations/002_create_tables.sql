-- ============================================================
-- 成分の刺激リスクレベル
-- ============================================================
create type irritation_risk as enum ('low', 'medium', 'high');

-- ============================================================
-- products: JANコードやOCRで取得した製品マスター
-- ============================================================
create table products (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  jan_code         text unique,
  name             text not null,
  brand            text,
  category         text,                        -- 'moisturizer', 'serum', 'cleanser' etc.
  price_jpy        integer,                     -- 円
  image_url        text,
  amazon_url       text,
  raw_ingredient_text text                      -- OCRで取得した生テキスト (デバッグ用)
);

comment on table products is '化粧品マスター。JANコードスキャンまたは手動登録で追加される';

-- ============================================================
-- ingredients: 成分マスター (INCI名ベース)
-- ============================================================
create table ingredients (
  id               uuid primary key default uuid_generate_v4(),
  inci_name        text not null unique,        -- 国際化粧品成分命名法
  ja_name          text,                        -- 日本語表記
  functions        text[] not null default '{}', -- ['moisturizer', 'emulsifier', ...]
  safety_score     smallint check (safety_score between 1 and 10), -- 1=危険, 10=安全
  irritation_risk  irritation_risk,
  embedding        vector(768),                 -- Gemini embedding for similarity search
  notes            text                         -- 補足説明
);

comment on table ingredients is '成分マスター。INCI名をキーとしてpgvectorで類似検索可能';
comment on column ingredients.safety_score is '1(危険)〜10(安全)の安全スコア。EWGスコアを参考';

create index ingredients_embedding_idx
  on ingredients using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================
-- product_ingredients: 製品と成分の中間テーブル
-- ============================================================
create table product_ingredients (
  product_id       uuid not null references products(id) on delete cascade,
  ingredient_id    uuid not null references ingredients(id) on delete cascade,
  position         smallint not null,           -- 成分表中の順番 (1始まり)
  concentration_pct numeric(5,2),              -- 推定濃度 (NULL可)
  primary key (product_id, ingredient_id)
);

comment on column product_ingredients.position is '成分表は濃度順のため、順番は重要な情報';

-- ============================================================
-- user_closet: ユーザーの手持ちコスメ
-- ============================================================
create table user_closet (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  product_id       uuid not null references products(id) on delete cascade,
  added_at         timestamptz not null default now(),
  is_active        boolean not null default true,  -- false = 使い切り/廃棄済み
  notes            text,
  unique (user_id, product_id)
);

comment on table user_closet is 'ユーザーが登録した手持ちコスメ。シナジー分析のベースになる';

-- ============================================================
-- generic_matches: ジェネリック判定結果のキャッシュ
-- ============================================================
create table generic_matches (
  id               uuid primary key default uuid_generate_v4(),
  source_product_id uuid not null references products(id) on delete cascade,
  match_product_id  uuid not null references products(id) on delete cascade,
  similarity_score  numeric(4,3) not null check (similarity_score between 0 and 1),
  price_ratio       numeric(6,3),               -- match_price / source_price (< 1 なら安い)
  created_at        timestamptz not null default now(),
  unique (source_product_id, match_product_id)
);

comment on table generic_matches is '成分ベクトル類似度に基づくジェネリック候補のキャッシュ';
