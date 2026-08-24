import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'DonateEase — Donate Clothes & Household Items',
  description: 'Connect with verified NGOs and orphanages. Donate unused clothes and household items with transparent tracking, doorstep pickup, and measurable impact.',
  keywords: 'donate clothes, donation platform, NGO, charity, reuse, household items, pickup',
  openGraph: {
    title: 'DonateEase — Make Giving Easy & Transparent',
    description: 'A platform connecting donors with verified organizations for seamless donation of reusable items.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
