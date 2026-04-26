import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from "@zxing/library";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ScanStatus = "idle" | "scanning" | "detected" | "analyzing" | "error";

interface ScanState {
  status: ScanStatus;
  errorMessage?: string;
  errorDetail?: string;
  detectedCode?: string;
}

interface AnalyzeBarcodeResponse {
  product: { id: string };
  cached: boolean;
}

export default function Scan() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const isProcessingRef = useRef(false); // ✨ 処理中フラグ
  const detectedRef = useRef(false); // ✨ 検出済みフラグ（新規追加）

  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");

  const isInsecureContext =
    location.protocol !== "https:" && location.hostname !== "localhost";

  const analyzeJan = useCallback(
    async (jan: string) => {
      // ✨ 処理中なら無視
      if (isProcessingRef.current) {
        console.log("⏭️ Already processing, skipping:", jan);
        return;
      }

      isProcessingRef.current = true; // ✨ 処理開始
      console.log("✅ Detected JAN:", jan);
      setScanState({ status: "analyzing", detectedCode: jan });

      try {
        console.log("📡 Calling analyze-barcode...");
        const { data, error } =
          await supabase.functions.invoke<AnalyzeBarcodeResponse>(
            "analyze-barcode",
            { body: { jan } },
          );
        if (error) {
          console.error("❌ Edge Function error:", error);
          throw error;
        }
        console.log("✅ Success:", data);
        if (!data?.product?.id) {
          throw new Error("製品データが取得できませんでした");
        }

        // カメラを完全停止
        stopScan();

        // データを state として渡す
        navigate(`/products/${data.product.id}`, {
          state: { product: data.product },
        });
      } catch (err: unknown) {
        console.error("💥 Error:", err);
        let message = "解析に失敗しました。もう一度お試しください。";
        let detail = "";
        if (err !== null && typeof err === "object") {
          if (
            "message" in err &&
            typeof (err as Record<string, unknown>).message === "string"
          ) {
            message = (err as Record<string, unknown>).message as string;
          }
          if (
            "error" in err &&
            typeof (err as Record<string, unknown>).error === "string"
          ) {
            message = (err as Record<string, unknown>).error as string;
          }
          if (import.meta.env.DEV) {
            detail = JSON.stringify(err, null, 2);
          }
        }
        setScanState({
          status: "error",
          errorMessage: message,
          errorDetail: detail,
        });
      } finally {
        isProcessingRef.current = false; // ✨ 処理終了
      }
    },
    [navigate],
  );

  const stopScan = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
  }, []);

  useEffect(() => {
    if (isInsecureContext) {
      setScanState({
        status: "error",
        errorMessage: "カメラはHTTPS環境またはlocalhostでのみ使用できます。",
      });
      return;
    }

    const hints = new Map<DecodeHintType, unknown>([
      [
        DecodeHintType.POSSIBLE_FORMATS,
        [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ],
      ],
    ]);

    const reader = new BrowserMultiFormatReader(hints, 300);
    readerRef.current = reader;

    const start = async () => {
      if (!videoRef.current) return;
      setScanState({ status: "scanning" });
      try {
        await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, error) => {
            if (result) {
              // ✨ 既に検出済みなら無視
              if (detectedRef.current) {
                return;
              }

              detectedRef.current = true; // ✨ 検出済みフラグをセット
              const code = result.getText();

              // ✨ 即座にカメラを停止（他の処理より前）
              reader.reset();

              console.log("✅ Detected JAN:", code);
              if (navigator.vibrate) navigator.vibrate(100);

              analyzeJan(code);
            }
            if (error && !(error instanceof NotFoundException)) {
              console.warn("[Scan] decode error:", error);
            }
          },
        );
      } catch (err: unknown) {
        const isPermissionDenied =
          (err instanceof DOMException && err.name === "NotAllowedError") ||
          (err instanceof Error && err.message.includes("Permission denied"));
        setScanState({
          status: "error",
          errorMessage: isPermissionDenied
            ? "カメラへのアクセスが拒否されました。ブラウザの設定からカメラ権限を許可してください。"
            : `カメラの起動に失敗しました: ${err instanceof Error ? err.message : String(err)}`,
        });
        if (isPermissionDenied) setShowManualInput(true);
      }
    };

    start();
    return () => {
      stopScan();
      detectedRef.current = false; // ✨ フラグリセット
    };
  }, [isInsecureContext, stopScan, analyzeJan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{8}$|^\d{12,13}$/.test(manualCode)) {
      setManualError("8桁または12〜13桁の数字を入力してください");
      return;
    }
    setManualError("");
    analyzeJan(manualCode);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-zinc-100">
          バーコードをスキャン
        </h1>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-4 px-4 pb-8">
        {/* Camera viewport */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-emerald-400 bg-zinc-900">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Scan guide overlay */}
          {scanState.status === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-zinc-950/40" />
              <div className="relative z-10 h-44 w-64">
                <span className="absolute left-0 top-0 h-7 w-7 border-l-2 border-t-2 border-emerald-400" />
                <span className="absolute right-0 top-0 h-7 w-7 border-r-2 border-t-2 border-emerald-400" />
                <span className="absolute bottom-0 left-0 h-7 w-7 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute bottom-0 right-0 h-7 w-7 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>
          )}

          {/* Analyzing overlay */}
          {scanState.status === "analyzing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                <p className="text-sm font-medium text-emerald-400">
                  解析中...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          {scanState.status === "idle" && (
            <p className="text-center text-sm text-zinc-400">初期化中...</p>
          )}
          {scanState.status === "scanning" && (
            <p className="text-center text-sm text-zinc-300">
              JANコードにカメラを向けてください
            </p>
          )}
          {scanState.status === "analyzing" && (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              <p className="text-sm text-zinc-300">解析中...</p>
            </div>
          )}
          {scanState.status === "error" && (
            <div className="space-y-2">
              <div className="rounded border border-red-500 bg-red-950/20 px-3 py-2">
                <p className="text-sm font-bold text-red-400 mb-1">エラー</p>
                <p className="text-sm text-zinc-300">
                  {scanState.errorMessage}
                </p>
                {scanState.errorMessage?.includes("not found") && (
                  <p className="text-xs text-zinc-500 mt-2">
                    💡 ヒント: Yahoo
                    Shoppingに未登録の商品です。別のJANコードをお試しください。
                  </p>
                )}
                {scanState.errorMessage?.includes("拒否") && (
                  <p className="text-xs text-zinc-500 mt-1">
                    設定方法: アドレスバー左の🔒 → カメラ → 許可
                  </p>
                )}
                {scanState.errorDetail && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-zinc-500">
                      詳細を表示
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded bg-zinc-950 p-2 text-xs text-zinc-500">
                      {scanState.errorDetail}
                    </pre>
                  </details>
                )}
              </div>
              {!scanState.errorMessage?.includes("拒否") &&
                !scanState.errorMessage?.includes("HTTPS") && (
                  <button
                    onClick={() => setScanState({ status: "scanning" })}
                    className="w-full rounded bg-emerald-400 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-300"
                  >
                    もう一度試す
                  </button>
                )}
            </div>
          )}
        </div>

        {/* Manual input toggle */}
        {!showManualInput && (
          <button
            onClick={() => setShowManualInput(true)}
            className="text-center text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-400"
          >
            手動で入力
          </button>
        )}

        {/* Manual input form */}
        {showManualInput && (
          <form
            onSubmit={handleManualSubmit}
            className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <p className="text-sm font-medium text-zinc-300">
              JANコードを手動入力
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={13}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
              placeholder="例: 4901301278203"
              className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-emerald-400"
            />
            {manualError && (
              <p className="text-xs text-red-400">{manualError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded bg-emerald-400 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300"
            >
              検索
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
