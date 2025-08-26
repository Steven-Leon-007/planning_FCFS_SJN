import "./SchedulerComponent.css";
import ProcessComponent from '../process/ProcessComponent';
import { useEffect, useState, useRef } from "react";
import { sortBySJN } from "../../utils/SortSJN";
import { AnimatePresence, motion } from "motion/react";
import EngineIconComponent from "../engine-icon/EngineIconComponent";
import { ProcessModel } from "../../model/ProcessModel";

const TICK_MS = 1000;
const SPAWN_MS = 7000;

const SchedulerComponent = ({ mode, processes, isSimulating }) => {
    // estados para UI
    const [queue, setQueue] = useState([]);         // procesos esperando
    const [running, setRunning] = useState(null);   // proceso en CPU
    const [finished, setFinished] = useState([]);   // procesos completados

    // refs mutables para usar en el interval y evitar closures stale
    const queueRef = useRef([]);
    const runningRef = useRef(null);
    const tickIntervalRef = useRef(null);
    const spawnIntervalRef = useRef(null);

    useEffect(() => {
        // 1) clonamos para trabajar con copias independientes
        const clones = processes.map(
            (p) => new ProcessModel(p.id, p.name, p.burst, p.arrival, p.size, p.color)
        );

        // 2) inicializamos con el orden original para que se vea la lista tal cual
        queueRef.current = clones;
        setQueue([...clones]);
        setRunning(null);
        runningRef.current = null;
        setFinished([]);

    }, [processes, mode]);

    // efecto para el tick del scheduler (1s)
    useEffect(() => {
        if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
        }

        if (isSimulating) {
            tickIntervalRef.current = setInterval(() => {
                stepTick();
            }, TICK_MS);
        }

        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSimulating]);

    // efecto para spawn de procesos (cada 5s)
    useEffect(() => {
        if (spawnIntervalRef.current) {
            clearInterval(spawnIntervalRef.current);
            spawnIntervalRef.current = null;
        }

        if (isSimulating) {
            spawnIntervalRef.current = setInterval(() => {
                const newProc = ProcessModel.createRandomProcess();

                // opcional: fijar arrival en ahora (si createRandomProcess no lo hace)
                newProc.arrival = newProc.arrival ?? Date.now();

                // añadir a la cola (refs y estado)
                queueRef.current.push(newProc);
                setQueue([...queueRef.current]);
            }, SPAWN_MS);
        }

        return () => {
            if (spawnIntervalRef.current) {
                clearInterval(spawnIntervalRef.current);
                spawnIntervalRef.current = null;
            }
        };
    }, [isSimulating]);

    function stepTick() {
        if (!runningRef.current) {
            if (queueRef.current.length === 0) {
                setRunning(null);
                return;
            }

            let idx = 0;
            if (mode === "SJN") {
                // SJN -> escoger índice con menor remaining
                idx = queueRef.current.reduce((bestIdx, p, i) => {
                    return p.remaining < queueRef.current[bestIdx].remaining ? i : bestIdx;
                }, 0);
            } else {
                // FCFS -> el primero en cola
                idx = 0;
            }

            const next = queueRef.current.splice(idx, 1)[0];
            next.startTime = next.startTime ?? Date.now();
            runningRef.current = next;

            setQueue([...queueRef.current]);
            setRunning({ ...next });
            return;
        }

        runningRef.current.tick();
        // actualizar UI
        setRunning({ ...runningRef.current });

        if (runningRef.current.isFinished()) {
            runningRef.current.finishTime = Date.now();
            const done = runningRef.current;
            runningRef.current = null;
            setRunning(null);
            setFinished(prev => [...prev, done]);
        }
    }

    return (
        <div className={`main-container ${mode}`}>
            <h2>Algoritmo {mode}</h2>

            <div className={`engine-container list-${mode}`}>
                <div className="process-list">
                    <AnimatePresence>
                        {queue.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.35 }}
                            >
                                <ProcessComponent process={p} index={idx} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className={`cpu-area ${mode}`}>
                    <EngineIconComponent isRunning={isSimulating} />
                    <div className="cpu-slot">
                        {running ? (
                            <div className="running-wrapper">
                                <ProcessComponent process={running} />
                                <div className="cpu-meta">
                                    <div>{(running.name).split("-")[0]}</div>
                                    <div>{running.remaining} / {running.burst}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="cpu-idle">CPU idle</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="stats">
                <div>En cola: {queue.length}</div>
                <div>Terminados: {finished.length}</div>
            </div>
        </div>
    )
}

export default SchedulerComponent