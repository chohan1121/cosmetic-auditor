import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Camera, CircleAlert, PackageSearch, ScanBarcode } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, PageHeader } from "@/components/common/Card";
import { AnalysisResultCard } from "@/components/common/AnalysisResultCard";
import { LoginPrompt } from "@/components/common/LoginPrompt";
import { analyzeIngredients } from "@/lib/analyze";
import { findGenericPicks } from "@/lib/recommend";
import { fetchProductByBarcode, type ScannedProduct } from "@/lib/openBeautyFacts";
import { pouchCategoryOptions as categoryOptions } from "@/lib/constants";
import { useMasterDataStore } from "@/stores/masterDataStore";
import { useProfileStore } from "@/stores/profileStore";
import { useAuthStore } from "@/stores/authStore";
import { usePouchStore } from "@/stores/pouchStore";
import type { AnalysisResult, PouchCategory } from "@/types";

type ScanState = "idle" | "scanning" | "looking-up" | "found" | "not-found" | "error";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);
  const [state, setState] = useState<ScanState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [category, setCategory] = useState<PouchCategory>("lotion");
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const profile = useProfileStore();
  const { ingredients, products } = useMasterDataStore();
  const user = useAuthStore((s) => s.user);
  const addItem = usePouchStore((s) => s.addItem);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  const lookup = async (barcode: string) => {
    setState("looking-up");
    setErrorMessage("");
    try {
      const p = await fetchProductByBarcode(barcode);
      if (!p) {
        setState("not-found");
        return;
      }
      setProduct(p);
      if (p.ingredientsText) {
        setResult(analyzeIngredients(p.ingredientsText, ingredients, profile));
      }
      setState("found");
    } catch {
      setErrorMessage("商品情報の取得中にエラーが発生しました。");
      setState("error");
    }
  };

  const startScan = async () => {
    setState("scanning");
    setErrorMessage("");
    detectedRef.current = false;
    try {
      const codeReader = new BrowserMultiFormatReader();
      const controls = await codeReader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (res) => {
          if (res && !detectedRef.current) {
            detectedRef.current = true;
            controlsRef.current?.stop();
            lookup(res.getText());
          }
        }
      );
      controlsRef.current = controls;
      // decodeFromConstraints's callback can fire before this assignment lands;
      // if that happened, stop the stream now instead of leaving it running.
      if (detectedRef.current) controls.stop();
    } catch {
      setErrorMessage("カメラを起動できませんでした。カメラの利用を許可するか、下のバーコード番号入力をお試しください。");
      setState("error");
    }
  };

  const handleManualLookup = () => {
    if (!manualBarcode.trim()) return;
    lookup(manualBarcode.trim());
  };

  const handleManualAnalyze = () => {
    if (!manualIngredients.trim()) return;
    setResult(analyzeIngredients(manualIngredients, ingredients, profile));
  };

  const handleRegister = async () => {
    if (!user || !product || !result) return;
    setRegisterError("");
    const ok = await addItem(user.id, { name: product.name, category, tags: result.tags });
    if (!ok) {
      setRegisterError("登録に失敗しました。通信状況を確認してもう一度お試しください。");
      return;
    }
    setRegistered(true);
  };

  const genericPicks = result ? findGenericPicks(result.tags, products, undefined, "skin") : [];

  return (
    <div>
      <PageHeader title="バーコードスキャン" subtitle="商品をスキャンして成分をホンネ判定" />

      {(state === "idle" || state === "error") && (
        <Card>
          {state === "error" && (
            <div className="mb-3 flex items-start gap-1.5 rounded-md bg-danger/10 p-3 text-xs text-danger">
              <CircleAlert size={15} className="mt-0.5 shrink-0" />
              {errorMessage}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={startScan}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-4 text-sm font-medium text-white"
          >
            <Camera size={18} />
            カメラでスキャン開始
          </motion.button>

          <p className="mb-1.5 mt-5 text-xs text-label-secondary">またはバーコード番号を直接入力</p>
          <div className="flex gap-2">
            <input
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="例: 4901234567894"
              inputMode="numeric"
              className="flex-1 rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleManualLookup}
              disabled={!manualBarcode.trim()}
              className="rounded-md bg-background px-4 text-sm font-medium text-label disabled:opacity-40"
            >
              検索
            </button>
          </div>
        </Card>
      )}

      {state === "scanning" && (
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[3/4] w-full bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/70" />
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-label-secondary">バーコードを枠内に合わせてください</p>
            <button
              onClick={() => {
                controlsRef.current?.stop();
                setState("idle");
              }}
              className="mt-3 text-xs text-accent underline underline-offset-2"
            >
              キャンセル
            </button>
          </div>
        </Card>
      )}

      {state === "looking-up" && (
        <Card className="flex flex-col items-center py-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <ScanBarcode size={28} className="text-accent" />
          </motion.div>
          <p className="mt-3 text-sm text-label-secondary">商品情報を検索中...</p>
        </Card>
      )}

      {state === "not-found" && (
        <Card className="flex flex-col items-center py-8 text-center">
          <PackageSearch size={28} className="text-label-secondary" />
          <p className="mt-3 text-sm font-medium">商品が見つかりませんでした</p>
          <p className="mt-1 text-xs text-label-secondary">
            Open Beauty Factsのデータベースに未登録の商品の可能性があります。成分表を手入力して分析できます。
          </p>
          <textarea
            value={manualIngredients}
            onChange={(e) => setManualIngredients(e.target.value)}
            placeholder="成分表を貼り付けてください"
            rows={4}
            className="mt-4 w-full resize-none rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleManualAnalyze}
            disabled={!manualIngredients.trim()}
            className="mt-3 w-full rounded-md bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            ホンネ判定する
          </motion.button>
          <button
            onClick={() => setState("idle")}
            className="mt-3 text-xs text-accent underline underline-offset-2"
          >
            もう一度スキャンする
          </button>
        </Card>
      )}

      {state === "found" && product && (
        <div className="space-y-4">
          <Card className="flex items-center gap-3">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              {product.brand && <p className="text-xs text-label-secondary">{product.brand}</p>}
            </div>
          </Card>

          {!product.ingredientsText && (
            <Card>
              <p className="text-sm font-medium">成分表が登録されていません</p>
              <p className="mt-1 text-xs text-label-secondary">
                Open Beauty Factsにこの商品の成分情報がありませんでした。手入力すれば判定できます。
              </p>
              <textarea
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                placeholder="成分表を貼り付けてください"
                rows={4}
                className="mt-3 w-full resize-none rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleManualAnalyze}
                disabled={!manualIngredients.trim()}
                className="mt-3 w-full rounded-md bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                ホンネ判定する
              </motion.button>
            </Card>
          )}

          {result && (
            <>
              <AnalysisResultCard result={result} genericPicks={genericPicks} />

              <Card>
                {user ? (
                  registered ? (
                    <p className="text-center text-sm text-success">マイポーチに登録しました。</p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm font-medium">マイポーチに登録</p>
                      {registerError && <p className="mb-2 text-xs text-danger">{registerError}</p>}
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as PouchCategory)}
                        className="mb-3 w-full rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                      >
                        {categoryOptions.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleRegister}
                        className="w-full rounded-md bg-accent py-3 text-sm font-medium text-white"
                      >
                        この商品をポーチに追加
                      </motion.button>
                    </>
                  )
                ) : (
                  <LoginPrompt description="ログインするとこの商品をマイポーチに登録できます。" />
                )}
              </Card>
            </>
          )}

          <button
            onClick={() => {
              setState("idle");
              setProduct(null);
              setResult(null);
              setRegistered(false);
              setRegisterError("");
              setManualIngredients("");
              setManualBarcode("");
            }}
            className="block w-full text-center text-xs text-accent underline underline-offset-2"
          >
            もう一度スキャンする
          </button>
        </div>
      )}

      <Link to="/check" className="mt-4 block text-center text-xs text-accent underline underline-offset-2">
        成分表を直接入力する
      </Link>
    </div>
  );
}
