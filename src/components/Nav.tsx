import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview" },
  { to: "/agents", label: "Agents" },
  { to: "/scopes", label: "Scopes" },
  { to: "/keys", label: "Keys" },
];

export default function Nav() {
  return (
    <header className="border-b border-soya-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-3 w-3 rounded-full bg-soya-accent" />
          <span>SoyaOS Studio</span>
        </NavLink>
        <nav className="text-sm flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                isActive
                  ? "text-soya-accent"
                  : "text-soya-ink/70 hover:text-soya-accent"
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
