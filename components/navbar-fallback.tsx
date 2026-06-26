export function NavbarFallback() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="h-5 w-32 rounded bg-gray-100 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-md bg-gray-100 animate-pulse" />
            <div className="h-8 w-20 rounded-md bg-gray-100 animate-pulse" />
          </div>
          <div className="h-8 w-16 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
