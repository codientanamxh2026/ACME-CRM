import '@/styles/globals.css';
import Providers from '@/components/layout/Providers';

export const metadata = {
  title: 'ACME CRM - Quản Lý Bán Hàng & Kho Doanh Nghiệp',
  description: 'Hệ thống CRM hiện đại, bảo mật cao, hỗ trợ import/export Excel, phân quyền RBAC và giao diện OS Dark/Light mode',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
