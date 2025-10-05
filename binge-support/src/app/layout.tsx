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
        <Sidebar />

        {/* ✅ TransitionProvider가 children을 감싸도록 변경 */}
        <TransitionProvider>
          <div style={{ marginLeft: 72, transition: 'margin-left .2s ease' }}>
            {children}
          </div>
        </TransitionProvider>

        {/* ✅ 사이드바 열림/닫힘에 따른 여백 조정 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                const ro = new ResizeObserver(() => {
                  var sb = document.querySelector('.sb');
                  var main = document.querySelector('body > div[style]');
                  if(!sb||!main) return;
                  main.style.marginLeft = sb.classList.contains('open') ? '220px' : '72px';
                });
                var el = document.querySelector('.sb');
                if(el) ro.observe(el);
              })();
            `
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
          © SoulKim 2025
        </footer>
      </body>
    </html>
  );
}