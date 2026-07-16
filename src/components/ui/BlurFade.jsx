import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const VARIANTS = {
  hidden: { opacity: 0, filter: 'blur(8px)', y: 12 },
  visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
}

export default function BlurFade({ children, className = '', style, delay = 0, duration = 0.5, amount = 0.25, once = true, as = 'div' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, amount })
  const Component = motion[as] ?? motion.div

  return (
    <Component
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={VARIANTS}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
      style={style}
    >
      {children}
    </Component>
  )
}
