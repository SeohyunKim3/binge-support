'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function TransitionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
     <AnimatePresence mode="wait">
       <motion.div
         key={pathname}
         initial={{ rotateY: 10, opacity: 0, x: 40 }}
         animate={{ rotateY: 0, opacity: 1, x: 0 }}
         exit={{ rotateY: -10, opacity: 0, x: -40 }}
         transition={{ duration: 0.5, ease: [0.45, 0, 0.55, 1] }}
         style={{
           transformOrigin: 'center',
           perspective: 1000,
           minHeight: '100vh',
         }}
       >
         {children}
       </motion.div>
     </AnimatePresence>
  )
}