-- ============================================================
-- アカウント紐付けデータ: マイポーチ・肌質髪質プロフィール
-- メールマジックリンク認証(Supabase Auth)を前提に、
-- auth.users.id をキーとして各ユーザー専用の行のみ読み書きできるRLSを設定する。
-- ============================================================

create table user_pouch_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  category   text not null,
  tags       text[] not null default '{}',
  created_at timestamptz not null default now()
);
comment on table user_pouch_items is 'ログインユーザーのマイポーチ登録アイテム。';

create table user_beauty_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  skin_type     text,
  concerns      text[] not null default '{}',
  hair_type     text,
  hair_concerns text[] not null default '{}',
  updated_at    timestamptz not null default now()
);
comment on table user_beauty_profiles is 'ログインユーザーの肌質・髪質プロフィール(1ユーザー1行)。';

alter table user_pouch_items enable row level security;
alter table user_beauty_profiles enable row level security;

create policy "pouch_items_own_rows" on user_pouch_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_own_row" on user_beauty_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index user_pouch_items_user_id_idx on user_pouch_items(user_id);
