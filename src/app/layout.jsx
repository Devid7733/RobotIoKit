import { Inter, Noto_Sans } from "next/font/google";
import AppProviders from "@/components/storefront/AppProviders";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata = {
  title: "RobotIoKit",
  description: "Robotics e-commerce storefront for RobotIoKit."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSans.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
