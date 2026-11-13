interface LayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: LayoutProps) {
  return (
    <div className="relative -mt-(--header-height-mobile) md:-mt-(--header-height-desktop) w-full overflow-x-clip">
      {children}
    </div>
  );
}
