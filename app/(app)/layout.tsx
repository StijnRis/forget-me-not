import { AuthGuard } from '@/components/auth-guard';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard
      fallback={
        <div className="min-h-[100dvh] flex flex-col bg-gray-50" />
      }
    >
      <div className="min-h-[100dvh] flex flex-col bg-gray-50">
        {children}
      </div>
    </AuthGuard>
  );
}
