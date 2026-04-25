-- pgvector 拡張を有効化 (成分ベクトル検索に使用)
create extension if not exists vector with schema extensions;

-- uuid生成
create extension if not exists "uuid-ossp" with schema extensions;
