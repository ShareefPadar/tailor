import type { Metadata } from "next";
import { DM_Sans, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Style Twin",
  description: "An AI co-designer that learns your style.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-sans text-[13px] tracking-[-0.003em] text-ink">
        {children}
      </body>
    </html>
  );
}
