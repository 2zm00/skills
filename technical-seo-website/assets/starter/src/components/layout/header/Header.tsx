import { uiText } from "@/configs/contents/uiContent";
import HeaderClient from "./HeaderClient";
import { headerCta, navigation } from "./navigation";

// 서버 헤더: 마크업·스타일 담당. 데스크톱 드롭다운은 CSS(hover/focus-within)로만 동작해 서버에서 그려진다.
export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-(--header-height-mobile) max-w-[1280px] items-center justify-between px-5 md:h-(--header-height-desktop) md:px-10">
        <a href="/" className="font-semibold">
          {/* 로고 컴포넌트 자리 */}
          LOGO
        </a>
        <nav aria-label={uiText.header.navLabel} className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-8">
            {navigation.map((group) => (
              <li key={group.label} className="group relative flex h-full items-center">
                {group.href ? (
                  <a href={group.href}>{group.label}</a>
                ) : (
                  <>
                    <button type="button" aria-haspopup="true">
                      {group.label}
                    </button>
                    <ul className="invisible absolute top-full left-0 w-72 border border-gray-200 bg-white opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {group.children?.map((link) => (
                        <li key={link.href}>
                          <a href={link.href} className="block px-5 py-4">
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <a href={headerCta.href} className="hidden lg:inline-flex">
          {headerCta.label}
        </a>
        <HeaderClient navigation={navigation} cta={headerCta} />
      </div>
    </header>
  );
}
