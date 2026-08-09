"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Auto-redirect to booth after brief splash
    const t = setTimeout(() => router.push("/booth"), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        className="text-center px-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="text-8xl mb-6"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📸
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-3" style={{ letterSpacing: "-0.03em" }}>
          Photobooth
        </h1>
        <p className="text-2xl font-bold" style={{ color: "var(--yellow)" }}>
          Acampamento KKP
        </p>
        <p className="text-sm font-semibold mt-1" style={{ color: "var(--muted)" }}>
          Festa Ágape
        </p>
        <motion.div
          className="mt-8 flex gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--blue-glow)" }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
