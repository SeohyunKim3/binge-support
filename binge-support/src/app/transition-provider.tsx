'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

/**
 * 페이지 전환 시 중복 렌더 없이 한 장면만 보이도록 하는 트랜지션 래퍼.
 * - AnimatePresence: mode="wait" -> 이전 화면 unmount가 끝나야 다음 화면 mount
 * - initial={false}: 첫 로드시 중복 렌더 방지
 */
export default function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        // 레이아웃이 겹쳐 보이지 않게 block 컨테이너 1개만.
        style={{ display: 'block' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}