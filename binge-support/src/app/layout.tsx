'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TransitionProvider from "./transition-provider";
import Sidebar from '@/components/Sidebar'

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 사이드바 */}
        <Sidebar />
        {/* 콘텐츠는 딱 한 번만 렌더링 */}
        <div id="app-main" style={{ marginLeft: 72, transition: "margin-left .2s ease" }}>
          <TransitionProvider>{children}</TransitionProvider>
        </div>

        {/* 사이드바 열림/닫힘에 맞춰 margin-left만 바꿔줌 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                const main = document.getElementById('app-main');
                const sb = document.querySelector('.sb');
                if(!main || !sb) return;

                const ro = new ResizeObserver(() => {
                  main.style.marginLeft = sb.classList.contains('open') ? '220px' : '72px';
                });
                ro.observe(sb);
              })();
            `,
          }}
        />

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
          }}
        >
          © SoulKim 2025.
        </footer>
      </body>
    </html>
  );
}