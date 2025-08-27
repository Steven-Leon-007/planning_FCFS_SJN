import "./SchedulerComponent.css";
import ProcessComponent from '../process/ProcessComponent';
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import EngineIconComponent from "../engine-icon/EngineIconComponent";
import { ProcessModel } from "../../model/ProcessModel";

const SchedulerComponent = ({ mode, initialProcesses, newProcesses, isSimulating, isPreemptive, tickTime, onProcessAdded, showModal }) => {
    // estados para UI
    const [queue, setQueue] = useState([]);         // procesos esperando
    const [running, setRunning] = useState(null);   // proceso en CPU
    const [finished, setFinished] = useState([]);   // procesos completados


    // refs mutables para usar en el interval y evitar closures stale
    const queueRef = useRef([]);
    const runningRef = useRef(null);
    const tickIntervalRef = useRef(null);

    useEffect(() => {
        // Clonar procesos iniciales para trabajar con copias independientes
        const clones = initialProcesses.map(
            (p) => new ProcessModel(p.id, p.name, p.burst, p.arrival, p.size, p.color)
        );

        // Inicializar la cola con los procesos iniciales
        queueRef.current = clones;
        setQueue([...clones]);
    }, [initialProcesses, mode]); // Solo se ejecuta con procesos iniciales

    // Efecto para añadir nuevos procesos a la cola
    useEffect(() => {
        if (newProcesses.length > 0) {
            // Tomar el primer proceso nuevo
            const newProc = newProcesses[0];

            // Clonar el proceso para evitar referencias compartidas
            const clonedProc = new ProcessModel(
                newProc.id, newProc.name, newProc.burst,
                newProc.arrival, newProc.size, newProc.color
            );

            // Añadir a la cola
            queueRef.current.push(clonedProc);
            setQueue([...queueRef.current]);

            // Notificar al padre que hemos procesado este proceso
            onProcessAdded();

            // Verificar expropiación si es SJN y modo expropiativo
            if (mode === "SJN" && isPreemptive && runningRef.current) {
                checkForPreemption();
            }
        }
    }, [newProcesses, mode, isPreemptive, onProcessAdded]);

    // efecto para el tick del scheduler
    useEffect(() => {
        if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
        }

        if (isSimulating) {
            tickIntervalRef.current = setInterval(() => {
                stepTick();
            }, tickTime);
        }

        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
        };
    }, [isSimulating, isPreemptive, tickTime]);


    useEffect(() => {
        if (mode === "SJN" && isPreemptive && runningRef.current) {
            checkForPreemption();
        }
    }, [initialProcesses, mode, isPreemptive]);

    // Función para verificar si hay un proceso más corto en la cola
    const checkForPreemption = () => {
        if (queueRef.current.length === 0 || !runningRef.current) return;

        // Encontrar el proceso con el menor tiempo restante en la cola
        const shortestInQueue = queueRef.current.reduce((shortest, p) => {
            return p.remaining < shortest.remaining ? p : shortest;
        }, queueRef.current[0]);

        // Si hay un proceso más corto que el actual, expropiar
        if (shortestInQueue.remaining < runningRef.current.remaining) {
            // Devolver el proceso actual a la cola
            queueRef.current.push(runningRef.current);
            runningRef.current = null;
            setRunning(null);

            // Ordenar la cola por tiempo restante (SJN)
            queueRef.current.sort((a, b) => a.remaining - b.remaining);
            setQueue([...queueRef.current]);
        }
    };

    function stepTick() {
        // Si es SJN expropiativo, verificar si debemos interrumpir el proceso actual
        if (mode === "SJN" && isPreemptive && runningRef.current) {
            checkForPreemption();
        }

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

    const calculateMetrics = (process) => {
        const turnaroundTime = process.finishTime - process.arrival;
        const waitingTime = turnaroundTime - (process.burst * tickTime);
        const responseTime = process.startTime - process.arrival;

        return {
            turnaroundTime: Math.max(0, Math.round(turnaroundTime / tickTime)),
            waitingTime: Math.max(0, Math.round(waitingTime / tickTime)),
            responseTime: Math.max(0, Math.round(responseTime / tickTime))
        };
    };

    // Función para formatear tiempo en segundos
    const formatTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className={`main-container ${mode}`}>
            <h2>Algoritmo {mode} {isPreemptive && mode === "SJN" ? "(Expropiativo)" : ""}</h2>

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
                    <EngineIconComponent isRunning={isSimulating} tickTime={tickTime} />
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

            {finished.length > 0 && showModal && (
                <div className="finished-processes">
                    <h3>Procesos Terminados</h3>

                    <div className={`processes-list ${mode}`}>
                        {finished.map((process) => {
                            const metrics = calculateMetrics(process);
                            return (
                                <div className="process-card" key={process.id}>
                                    <div className="process-row">
                                        <span className="label">Proceso: </span>
                                        <span className="process-name">{process.name}</span>
                                    </div>
                                    <div className="process-row">
                                        <span className="label">Tiempo CPU: </span>
                                        <span>{process.burst}</span>
                                    </div>
                                    <div className="process-row">
                                        <span className="label">Creación: </span>
                                        <span>{formatTime(process.arrival)}</span>
                                    </div>
                                    <div className="process-row">
                                        <span className="label">Inicio: </span>
                                        <span>{formatTime(process.startTime)}</span>
                                    </div>
                                    <div className="process-row">
                                        <span className="label">Fin: </span>
                                        <span>{formatTime(process.finishTime)}</span>
                                    </div>
                                    <div className="process-row">
                                        <span className="label">T. Respuesta: </span>
                                        <span>{metrics.responseTime}</span>
                                    </div>
                                    <div className="process-row">
                                        <span className="label">T. Espera: </span>
                                        <span>{metrics.waitingTime}</span>
                                    </div>
                                    <div className="process-row">
                                        <span className="label">T. Retorno: </span>
                                        <span>{metrics.turnaroundTime}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Resumen de métricas */}
                    <div className="metrics-summary">
                        <h4>Métricas Promedio</h4>
                        <div className="summary-stats">
                            <div className="stat">
                                <span className="stat-label">Tiempo Respuesta Promedio: </span>
                                <span className="stat-value">
                                    {(
                                        finished.reduce(
                                            (sum, p) => sum + calculateMetrics(p).responseTime,
                                            0
                                        ) / finished.length
                                    ).toFixed(2)}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Tiempo Espera Promedio: </span>
                                <span className="stat-value">
                                    {(
                                        finished.reduce(
                                            (sum, p) => sum + calculateMetrics(p).waitingTime,
                                            0
                                        ) / finished.length
                                    ).toFixed(2)}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Tiempo Retorno Promedio: </span>
                                <span className="stat-value">
                                    {(
                                        finished.reduce(
                                            (sum, p) => sum + calculateMetrics(p).turnaroundTime,
                                            0
                                        ) / finished.length
                                    ).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SchedulerComponent