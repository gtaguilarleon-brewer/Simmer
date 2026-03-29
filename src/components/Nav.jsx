"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SimmerLogo from './SimmerLogo';
import { GearIcon } from './Icons';
import { t } from '../lib/theme';

export default function Nav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Recipes', href: '/recipes' },
    { label: 'Weekly Plan', href: '/' },
    { label: 'Grocery List', href: '/grocery' },
  ];

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "0 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <SimmerLogo />
          <span style={{ fontFamily: t.serif, fontSize: 19, color: t.text }}>Simmer</span>
        </Link>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                border: "none", cursor: "pointer", fontFamily: t.sans, textDecoration: "none",
                color: isActive(item.href) ? t.text : t.subtle,
                background: isActive(item.href) ? t.border : "transparent",
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ width: 1, height: 24, background: t.border, margin: "0 8px" }} />
          <Link
            href="/settings"
            style={{
              padding: 7, borderRadius: 8, border: "none", cursor: "pointer",
              background: pathname === "/settings" ? t.border : "transparent",
              color: pathname === "/settings" ? t.text : t.subtle,
              display: "flex", alignItems: "center", textDecoration: "none",
            }}
          >
            <GearIcon />
          </Link>
        </div>
      </div>
    </nav>
  );
}
