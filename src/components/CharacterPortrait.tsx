import { useEffect, useRef, useState } from "react";

type Variant = "stage" | "card" | "thumb";

type Props = {
  src: string;
  alt?: string;
  variant?: Variant;
  className?: string;
};

/**
 * Static-sprite portrait with light motion:
 * idle breath bob + expression/character crossfade.
 */
export function CharacterPortrait({
  src,
  alt = "",
  variant = "stage",
  className = "",
}: Props) {
  const [current, setCurrent] = useState(src);
  const [outgoing, setOutgoing] = useState<string | null>(null);
  const [settle, setSettle] = useState(false);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (src === currentRef.current) return;
    setOutgoing(currentRef.current);
    setCurrent(src);
    setSettle(true);
    const clearOut = window.setTimeout(() => setOutgoing(null), 420);
    const clearSettle = window.setTimeout(() => setSettle(false), 520);
    return () => {
      window.clearTimeout(clearOut);
      window.clearTimeout(clearSettle);
    };
  }, [src]);

  return (
    <div className={`char-portrait char-portrait--${variant} ${className}`.trim()}>
      <div className={`char-portrait__bob${settle ? " is-settle" : ""}`}>
        {outgoing && (
          <img className="char-portrait__layer is-out" src={outgoing} alt="" draggable={false} />
        )}
        <img
          className={`char-portrait__layer${outgoing ? " is-in" : ""}`}
          src={current}
          alt={alt}
          draggable={false}
        />
      </div>
    </div>
  );
}
