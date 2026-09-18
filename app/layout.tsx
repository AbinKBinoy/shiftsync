import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shiftsync.win"),
  title: "ShiftSync",
  description: "Collaborative shift management for frontline teams",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Single Toaster at the root — mounting more than one duplicates
            every toast. Themed to match the app's own navy/ink/yellow
            tokens rather than Sonner's default palette, since this app is
            permanently dark (no light mode to track). */}
        <Toaster
          theme="dark"
          position="top-right"
          closeButton
          toastOptions={{
            classNames: {
              toast:
                '!bg-navy-900 !border !border-navy-700 !text-ink-100 !rounded-xl !shadow-2xl !shadow-black/40',
              title: '!text-ink-100 !text-sm !font-medium',
              description: '!text-ink-300 !text-sm',
              actionButton: '!bg-yellow-400 !text-navy-950 !font-semibold',
              cancelButton: '!bg-navy-800 !text-ink-300',
              closeButton: '!bg-navy-800 !border-navy-600 !text-ink-300',
            },
          }}
        />
      </body>
    </html>
  );
}
