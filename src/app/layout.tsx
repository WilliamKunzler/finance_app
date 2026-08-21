import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minhas Finanças",
  description: "Controle financeiro pessoal local",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Sets the theme before first paint to avoid a light-mode flash.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var t=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col md:flex-row bg-bg text-ink">
        <ConfirmProvider>
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 md:p-10">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </ConfirmProvider>
      </body>
    </html>
  );
}
