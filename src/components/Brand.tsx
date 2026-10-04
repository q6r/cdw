import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { saveData, useInView, useReducedMotion } from "../lib/hooks";

/** Logo da marca (ícone do servidor). */
export function BrandMark({ size = 36, withName = true, className }: { size?: number; withName?: boolean; className?: string }) {
  return (
    <span className={clsx("group/brand inline-flex items-center gap-2.5", className)}>
      <span
        className="relative block shrink-0 overflow-hidden rounded-[30%] bg-frost shadow-[0_1px_2px_rgb(24_38_50/0.12),inset_0_0_0_1px_rgb(255_255_255/0.6)] ring-1 ring-silver"
        style={{ width: size, height: size }}
      >
        <img src="/brand/logo.gif" alt="" width={size} height={size} className="h-full w-full object-cover" />
        
      </span>
      {withName && <span className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-ink"> </span>}
    </span>
  );
}

/**
 * O GIF da marca como medalhão 1:1. Vídeo leve no lugar do GIF de 8 MB,
 * pausado fora da tela; com movimento reduzido ou economia de dados, só o pôster.
 */
export function BrandMedia({ className, priority = false }: { className?: string; priority?: boolean }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(box, { threshold: 0.15 });
  const [ready, setReady] = useState(false);
  const still = reduced || saveData();

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const sync = () => {
      if (inView && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [inView, still]);

  return (
    <div ref={box} className={clsx("relative aspect-square overflow-hidden bg-[#d0d8e0]", className)}>
      <img
        src="/brand/cdw-poster-512.webp"
        alt="Logo da CDW: as letras cdw cheias de líquido azul, sobre um céu prateado"
        width={512}
        height={512}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {!still && (
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          disablePictureInPicture
          poster="/brand/cdw-poster-512.webp"
          onPlaying={() => setReady(true)}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <source src="/brand/cdw-512.webm" type="video/webm" />
          <source src="/brand/cdw-512.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
