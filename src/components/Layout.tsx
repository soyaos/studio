import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/chat", label: "Chat" },
  { to: "/agents", label: "Agents" },
  { to: "/keys", label: "API Keys" },
  { to: "/trace", label: "Trace" },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-20 border-b border-soya-line bg-soya-paper/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="inline-block h-3 w-3 rounded-full bg-soya-accent" />
            <span>SoyaOS Studio</span>
            <span className="badge ml-2">alpha</span>
          </NavLink>
          <nav className="text-sm flex items-center gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  [
                    "rounded-btn px-3 py-1.5 transition-colors",
                    isActive
                      ? "bg-soya-accent/15 text-soya-ink"
                      : "text-soya-muted hover:text-soya-ink hover:bg-white/60",
                  ].join(" ")
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-soya-line">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-soya-muted flex items-center justify-between">
          <span>SoyaOS Studio · alpha</span>
          <span>
            Source:{" "}
            <a
              href="https://github.com/soyaos/studio"
              className="underline hover:text-soya-accent"
            >
              soyaos/studio
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
