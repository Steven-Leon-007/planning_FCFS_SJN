import "./SchedulerComponent.css";
import ProcessComponent from '../process/ProcessComponent';
import { useEffect, useState } from "react";
import { sortBySJN } from "../../utils/SortSJN";
import { AnimatePresence, motion } from "motion/react";
import EngineIconComponent from "../engine-icon/EngineIconComponent";

const SchedulerComponent = ({ mode, processes }) => {
    const [initProcesses, setInitProcesses] = useState(processes);

    useEffect(() => {
        if (mode === "SJN") {
            setInitProcesses(processes);
            const timer = setTimeout(() => {
                setInitProcesses(sortBySJN(processes));
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setInitProcesses(processes);
        }

    }, [mode, processes]);

    return (
        <div className={`main-container ${mode}`}>
            <h2>Algoritmo {mode}</h2>
            <div className={`engine-container list-${mode}`}>
                <div className={`process-list`}>
                    <AnimatePresence>
                        {initProcesses.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                layout
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <ProcessComponent process={p} index={idx} />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                </div>
                <EngineIconComponent />
            </div>
        </div>
    )
}

export default SchedulerComponent