import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TransitionProvider from "./transition-provider";
import Sidebar from "@/components/Sidebar";
import Shell from './shell' 


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dolla by SoulKim",
  description: "Dolgo Dolla",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          background: "rgba(255,255,255,0.65)",
        }}
      >
        {/* 본문 */}
        <main
      style={{
        marginLeft: '0', // 열릴 때만 여백 생김
        transition: 'margin-left 0.25s ease',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        position: 'relative',
      }}
          className="main-content"
        >
          <Shell>{children}</Shell>
        </main>

        {/* 푸터 */}
        <footer
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#a1a1a1",
            padding: "20px 0",
            letterSpacing: "0.5px",
            borderTop: "1px solid rgba(0,0,0,0.05)",
            fontFamily: "var(--font-geist-mono)",
            background: "rgba(255,255,255,0.4)",
            backdropFilter: "blur(10px)",
            marginTop: "auto", // 👈 핵심
          }}
        >
          © SoulKim 2025
        </footer>

    {/* 사이드바 열림 감시 */}
    <script
    dangerouslySetInnerHTML={{
      __html: `
        (function(){
          var html = document.documentElement;
          html.classList.add('no-sb-init');
          try {
            var open = localStorage.getItem('sb-open') === '1';
            html.style.setProperty('--sbw', open ? '220px' : '72px');
          } catch(e){}
          html.classList.remove('no-sb-init');
        })();
      `,
    }}
  />
  </body>
</html>
  );
}