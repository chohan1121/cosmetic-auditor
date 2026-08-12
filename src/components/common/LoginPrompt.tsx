import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MailCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "./Card";

export function LoginPrompt({ description }: { description: string }) {
  const { signInWithEmail, magicLinkSent, error } = useAuthStore();
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return;
    signInWithEmail(email.trim());
  };

  return (
    <Card className="text-center">
      {magicLinkSent ? (
        <>
          <MailCheck size={28} className="mx-auto text-accent" />
          <p className="mt-3 text-sm font-medium">メールを確認してください</p>
          <p className="mt-1 text-xs text-label-secondary">
            {email} 宛にログイン用リンクを送信しました。リンクを開くとログインが完了します。
          </p>
        </>
      ) : (
        <>
          <Mail size={28} className="mx-auto text-accent" />
          <p className="mt-3 text-sm font-medium">ログインが必要です</p>
          <p className="mt-1 text-xs text-label-secondary">{description}</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-4 w-full rounded-md bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSubmit}
            disabled={!email.trim()}
            className="mt-3 w-full rounded-md bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            ログイン用リンクを送る
          </motion.button>
        </>
      )}
    </Card>
  );
}
