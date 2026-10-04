import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { PlanIcon } from "../PlanIcon";
import { planArt } from "../../lib/catalog";
import { saveData, useInView, useReducedMotion } from "../../lib/hooks";
import type { Plan } from "../../lib/types";

/**
 * Arte 3D do plano (5:4). O vídeo curto só toca quando pedido:
 * - "hover": ao passar o mouse no card (não baixa nada antes disso);
 * - "auto": quando a arte está na tela (página do produto);
 * - "none": só a imagem.
 */
export function PlanArt({
  plan,
  play = "none",
  hovering = false,
  className,
  sizes,
  priority = false,
}: {
  plan: Pick<Plan, "key" | "name" | "icon" | "color">;
  play?: "hover" | "auto" | "none";
  hovering?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const art = planArt(plan.key);
  const [state, setState] = useState<"loading" | "ok" | "none">("loading");
  const [videoReady, setVideoReady] = useState(false);
  const [armed, setArmed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(box, { threshold: 0.25 });
  const canPlay = !reduced && !saveData() && state === "ok";
  const wantPlay = canPlay && ((play === "hover" && hovering) || (play === "auto" && inView));

  useEffect(() => {
    if (wantPlay) setArmed(true);
  }, [wantPlay]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (wantPlay) v.play().catch(() => {});
    else v.pause();
  }, [wantPlay, armed]);

  return (
    <div
      ref={box}
      className={clsx("relative aspect-[5/4] overflow-hidden bg-gradient-to-b from-frost to-frost-2", className)}
    >
      {state !== "none" ? (
        <img
          src={art.image}
          alt={`Arte do plano ${plan.name}`}
          width={640}
          height={512}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          draggable={false}
          onLoad={() => setState("ok")}
          onError={() => setState("none")}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            state === "ok" ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <PlanIcon name={plan.icon} size="42%" />
        </div>
      )}
      {armed && canPlay && (
        <video
          ref={video}
          src={art.video}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          disablePictureInPicture
          onPlaying={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            videoReady && wantPlay ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {state === "loading" && <div className="skeleton absolute inset-0 rounded-none" />}
    </div>
  );
}
