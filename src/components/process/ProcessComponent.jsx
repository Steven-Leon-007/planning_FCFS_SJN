import React from 'react'
import "./ProcessComponent.css"
import { motion } from "motion/react"

const ProcessComponent = ({ process, index }) => {

  return (
    <motion.div
      className="process-block"
      style={{ backgroundColor: process.color, width: `${process.size}px` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay: index * 0.3,
      }}
    >
      <div className="process-name">{(process.name).split("-")[0]}</div>
      <div className="process-info">
        {process.remaining}/{process.burst}
      </div>
    </motion.div>
  )
}

export default ProcessComponent