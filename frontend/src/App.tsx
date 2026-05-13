import { motion } from 'framer-motion'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center space-y-4"
      >
        <h1 className="text-5xl font-bold text-white tracking-tight">
          Signal<span className="text-blue-500">PH</span>
        </h1>
        <p className="text-gray-400 text-lg">
          React · TypeScript · Tailwind CSS · Framer Motion
        </p>
        <motion.div
          className="h-1 w-24 bg-blue-500 rounded-full mx-auto"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        />
      </motion.div>
    </div>
  )
}
