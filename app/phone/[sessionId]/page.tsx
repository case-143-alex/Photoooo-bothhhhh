"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { playSound } from "@/lib/audio";

type PhoneStatus = "joining" | "waiting" | "shooting" | "done" | "error";

export default function PhonePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [status, setStatus] = useState<PhoneStatus>("joining");
  const [sessionStatus, setSessionStatus] = useState<string>("waiting");
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<"camera" | "download">("camera");

  useEffect(() => {
    const socket = getSocket();
    socket.emit("phone:join-session", sessionId);
    setStatus("waiting");

    socket.on("session:state", ({ status: s }: { status: string }) => {
      setSessionStatus(s);
    });

    socket.on("session:status", ({ status: s }: { status: string }) => {
      setSessionStatus(s);
      if (s === "starting") setStatus("shooting");
    });

    socket.on("session:photo-received", ({ photoIndex, photoData }: { photoIndex: number; photoData: string }) => {
      setPhotos((prev) => ({ ...prev, [photoIndex]: photoData }));
      setStatus("shooting");
      setActiveTab("camera");
    });

    socket.on("session:done", () => {
      setStatus("done");
      setActiveTab("download");
      playSound("confirm");
    });

    socket.on("session:reset", () => {
      setPhotos({});
      setStatus("waiting");
      setActiveTab("camera");
    });

    socket.on("error", () => setStatus("error"));

    return () => {
      socket.off("session:state");
      socket.off("session:status");
      socket.off("session:photo-received");
      socket.off("session:done");
      socket.off("session:reset");
      socket.off("error");
    };
  }, [sessionId]);

  const handleDownload = (index: number) => {
    const photo = photos[index];
    if (!photo) return;
    const a = document.createElement("a");
    a.href = photo;
    a.download = `kkp-agape-${sessionId}-foto${index + 1}.png`;
    a.click();
    playSound("confirm");
  };

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">Sessão não encontrada</h2>
          <p style={{ color: "var(--muted)" }}>Pede ao staff para gerar um novo QR Code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3 border-b"
        style={{ borderColor: "rgba(96,165,250,0.15)" }}
      >
        <div className="text-2xl">📸</div>
        <div className="flex-1">
          <div className="font-black text-white text-base">Photobooth</div>
          <div className="text-xs font-semibold" style={{ color: "var(--yellow)" }}>
            Acampamento KKP · Festa Ágape
          </div>
        </div>
        <div
          className="text-xs px-2 py-1 rounded-lg font-mono font-bold"
          style={{ background: "var(--surface2)", color: "var(--blue-glow)" }}
        >
          {sessionId}
        </div>
      </div>

      {/* Session status banner */}
      <AnimatePresence>
        {(sessionStatus === "starting" || sessionStatus.startsWith("captured")) && (
          <motion.div
            className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: "var(--yellow)" }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <span className="text-sm font-semibold" style={{ color: "var(--yellow)" }}>
              {sessionStatus === "starting" ? "📸 A sessão começou!" : `✅ Foto ${Object.keys(photos).length}/4 tirada!`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-4 p-1 rounded-xl" style={{ background: "var(--surface)" }}>
        {(["camera", "download"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeTab === tab ? "var(--blue)" : "transparent",
              color: activeTab === tab ? "white" : "var(--muted)",
            }}
          >
            {tab === "camera" ? "📷 Fotos" : "⬇️ Download"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {/* CAMERA/PHOTOS TAB */}
          {activeTab === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {Object.keys(photos).length === 0 ? (
                <div className="glass p-8 text-center">
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="font-bold mb-1">Ainda sem fotos</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    As fotos vão aparecer aqui assim que o Booth iniciar a sessão
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    FOTOS TIRADAS ({Object.keys(photos).length}/4)
                  </p>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="rounded-2xl overflow-hidden"
                      style={photos[i] ? undefined : { background: "var(--surface)", aspectRatio: "16/9" }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: photos[i] ? 1 : 0.3, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {photos[i] ? (
                        <img src={photos[i]} alt={`Foto ${i + 1}`} className="w-full h-auto block" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface)" }}>
                          <span className="text-3xl" style={{ color: "var(--surface2)" }}>
                            📷
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}

          {/* DOWNLOAD TAB */}
          {activeTab === "download" && (
            <motion.div
              key="download"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {Object.keys(photos).length === 0 ? (
                <div className="glass p-8 text-center">
                  <motion.div
                    className="text-4xl mb-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    ⏳
                  </motion.div>
                  <p className="font-bold mb-1">A processar...</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    Aguarda que o Booth termine a sessão
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    AS TUAS 4 FOTOGRAFIAS ✨
                  </p>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="glass p-3 space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {photos[i] ? (
                        <>
                          <img
                            src={photos[i]}
                            alt={`Foto ${i + 1}`}
                            className="w-full rounded-xl"
                          />
                          <button
                            className="btn-yellow w-full text-base py-3"
                            onClick={() => handleDownload(i)}
                          >
                            ⬇️ Guardar Foto {i + 1}
                          </button>
                        </>
                      ) : (
                        <div className="aspect-video flex items-center justify-center rounded-xl" style={{ background: "var(--surface2)" }}>
                          <span className="text-2xl">📷</span>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  <motion.div
                    className="glass p-4 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-sm font-bold mb-1">Partilha o momento! 💛</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      #AcampamentoKKP #FestaÁgape
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom safe area */}
      <div className="h-6" />
    </div>
  );
}
