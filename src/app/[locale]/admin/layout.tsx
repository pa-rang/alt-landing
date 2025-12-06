import AdminGuard from "@/components/AdminGuard";

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;

  return <AdminGuard locale={locale}>{children}</AdminGuard>;
}
