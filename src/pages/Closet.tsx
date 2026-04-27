import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ClosetItem {
  id: string;
  created_at: string;
  product: {
    id: string;
    product_name: string;
    brand: string | null;
    price_jpy: number | null;
    image_url: string | null;
  } | null;
}

export default function Closet() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCloset = async () => {
      // Step 1: user_closet を取得
      const { data: closetData, error: closetError } = await supabase
        .from("user_closet")
        .select("id, created_at, product_id")
        .order("created_at", { ascending: false });

      if (closetError) {
        console.error("❌ Closet error details:");
        console.error("- Message:", closetError.message);
        console.error("- Code:", closetError.code);
        console.error("- Details:", closetError.details);
        console.error("- Hint:", closetError.hint);
        console.error("- Full error:", JSON.stringify(closetError, null, 2));
        toast.error("クローゼットの取得に失敗しました");
        setLoading(false);
        return;
      }

      if (!closetData || closetData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Step 2: product_id のリスト
      const productIds = closetData.map((item) => item.product_id);

      console.log("🔍 Fetching products with IDs:", productIds);
      console.log("🔍 IDs as JSON:", JSON.stringify(productIds));
      console.log("🔍 Total IDs:", productIds.length);

      // Step 3: products を一括取得
      console.log("🔍 About to fetch products...");
      console.log(
        "🔍 Query: .from('products').select(...).in('id', ",
        productIds,
        ")",
      );

      // デバッグ: まず全件取得を試す
      const { data: allProducts } = await supabase
        .from("products")
        .select("id, product_name, brand, price_jpy, image_url");
      console.log("🔍 All products in DB:", allProducts);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, product_name, brand, price_jpy, image_url")
        .in("id", productIds);

      console.log("🔍 Fetching products with IDs:", productIds);
      console.log("📦 Products query result:", productsData);
      console.log("📦 Products result length:", productsData?.length || 0);

      if (productsError) {
        console.error("❌ Products error:", productsError);
        console.error("Products error message:", productsError.message);
        console.error("Products error code:", productsError.code);
        toast.error("商品情報の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Step 4: マージ
      const merged: ClosetItem[] = closetData.map((item) => ({
        id: item.id,
        created_at: item.created_at,
        product: productsData?.find((p) => p.id === item.product_id) || null,
      }));

      console.log("✅ Closet loaded:", merged.length, "items");
      console.log("📦 Closet data:", closetData);
      console.log("📦 Products data:", productsData);
      console.log("📦 Merged data:", merged);
      setItems(merged);
      setLoading(false);
    };

    fetchCloset();
  }, []);

  const handleDelete = async (closetId: string) => {
    if (!confirm("このアイテムをクローゼットから削除しますか？")) return;
    const { error } = await supabase
      .from("user_closet")
      .delete()
      .eq("id", closetId);
    if (error) {
      toast.error("削除に失敗しました");
    } else {
      setItems((prev) => prev.filter((item) => item.id !== closetId));
      toast.success("削除しました");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="text-sm text-zinc-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-100">クローゼット</h1>
        <span className="text-sm text-zinc-500">{items.length}件</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Shirt size={40} className="text-zinc-600" />
          <p className="text-sm text-zinc-400">クローゼットが空です</p>
          <p className="text-xs text-zinc-600">
            商品をスキャンして追加してください
          </p>
          <Link
            to="/scan"
            className="mt-2 rounded bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300"
          >
            スキャンする
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
            >
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-500 transition-colors hover:bg-red-900/80 hover:text-red-300"
                aria-label="削除"
              >
                <Trash2 size={13} />
              </button>

              {item.product ? (
                <Link
                  to={`/products/${item.product.id}`}
                  state={{ product: item.product }}
                  className="flex flex-col"
                >
                  <div className="flex h-28 w-full items-center justify-center bg-zinc-800">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.product_name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Shirt size={32} className="text-zinc-600" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium leading-tight text-zinc-100">
                      {item.product.product_name}
                    </p>
                    {item.product.brand && (
                      <p className="text-xs text-zinc-500">
                        {item.product.brand}
                      </p>
                    )}
                    {item.product.price_jpy != null && (
                      <p className="mt-0.5 text-xs font-medium text-emerald-400">
                        ¥{item.product.price_jpy.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="flex flex-col">
                  <div className="flex h-28 w-full items-center justify-center bg-zinc-800">
                    <Shirt size={32} className="text-zinc-600" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                    <p className="text-xs text-zinc-500">商品情報なし</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
