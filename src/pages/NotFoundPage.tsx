import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <motion.div
        animate={{ rotate: [0, -8, 8, -8, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
        className="mb-4 text-6xl"
      >
        🧴
      </motion.div>
      <h1 className="text-xl font-semibold">ページが見つかりません</h1>
      <p className="mt-2 text-sm text-label-secondary">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white active:opacity-80"
      >
        ホームへ戻る
      </Link>
    </div>
  );
}
