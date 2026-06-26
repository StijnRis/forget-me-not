import { AuthGuard } from '@/components/auth-guard';

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard
      fallback={
        <div className="min-h-[100dvh] flex flex-col bg-gray-50">
          <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8" />
        </div>
      }
    >
      <div className="min-h-[100dvh] flex flex-col bg-gray-50">
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">{children}</div>
      </div>
    </AuthGuard>
  );
}
