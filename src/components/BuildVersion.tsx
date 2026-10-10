import { useEffect, useState } from "react";
export function BuildVersion() {
  const [info, setInfo] = useState<{ version: string; commit: string } | null>(
    null,
  );
  useEffect(() => {
    let active = true;
    fetch("/api/version")
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (active) setInfo(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return info ? (
    <footer className="py-3 text-center text-[11px] text-zinc-500 font-mono">
      Humanis v{info.version} · {info.commit}
    </footer>
  ) : null;
}
