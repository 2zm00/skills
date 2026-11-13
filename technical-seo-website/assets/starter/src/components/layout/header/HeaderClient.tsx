"use client";

import { useState } from "react";
import { uiText } from "@/configs/contents/uiContent";
import type { NavigationGroup, NavigationLink } from "./navigation";

// 클라이언트 헤더: 모바일 메뉴 열기·닫기만 담당
export default function HeaderClient({ navigation, cta }: { navigation: NavigationGroup[]; cta: NavigationLink }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? uiText.header.closeMenu : uiText.header.openMenu}
        className="lg:hidden"
      >
        ≡
      </button>
      <div id="mobile-menu" hidden={!isOpen} className="fixed inset-x-0 top-(--header-height-mobile) bottom-0 bg-white lg:hidden">
        <nav aria-label={uiText.header.mobileNavLabel}>
          {navigation.map((group) => (
            <div key={group.label}>
              {group.href ? <a href={group.href}>{group.label}</a> : <p>{group.label}</p>}
              {group.children?.map((link) => (
                <a key={link.href} href={link.href} className="block">
                  {link.label}
                </a>
              ))}
            </div>
          ))}
          <a href={cta.href}>{cta.label}</a>
        </nav>
      </div>
    </>
  );
}
