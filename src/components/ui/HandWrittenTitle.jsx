import { motion } from 'framer-motion'

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 2.2, ease: [0.43, 0.13, 0.23, 0.96] },
      opacity: { duration: 0.4 },
    },
  },
}

export default function HandWrittenTitle({ title, subtitle, className = '' }) {
  return (
    <div className={`relative w-full max-w-6xl mx-auto ${className}`}>
      <div className="absolute inset-0 pointer-events-none">
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 600"
          initial="hidden"
          animate="visible"
          className="w-full h-full"
        >
          <motion.path
            d="M 950 90
               C 1250 300, 1050 480, 600 520
               C 250 520, 150 480, 150 300
               C 150 120, 350 80, 600 80
               C 850 80, 950 180, 950 180"
            fill="none"
            strokeWidth="10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            className="text-brand opacity-25"
          />
        </motion.svg>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {title}
        </motion.div>

        {subtitle && (
          <motion.div
            className="mt-5 md:mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {subtitle}
          </motion.div>
        )}
      </div>
    </div>
  )
}
