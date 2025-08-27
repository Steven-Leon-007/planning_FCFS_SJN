import { useEffect, useState, useRef } from 'react'
import SchedulerComponent from './components/scheduler/SchedulerComponent'
import { ProcessModel } from './model/ProcessModel';
import "./App.css";

function App() {
  const [initialProcesses, setInitialProcesses] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [displayButton, setDisplayButton] = useState(false);
  const [isPreemptive, setIsPreemptive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [spawnTime, setSpawnTime] = useState(7000);
  const spawnIntervalRef = useRef(null);
  const [newProcesses, setNewProcesses] = useState([]);
  const [showModal, setShowModal] = useState(false);



  useEffect(() => {
    const initial = Array.from({ length: 10 }, () => ProcessModel.createRandomProcess());
    setInitialProcesses(initial);
    setTimeout(() => {
      setDisplayButton(true);
    }, 4000);
  }, []);

  // Efecto para generar nuevos procesos
  useEffect(() => {
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    if (isSimulating) {
      spawnIntervalRef.current = setInterval(() => {
        const newProc = ProcessModel.createRandomProcess();
        newProc.arrival = newProc.arrival ?? Date.now();

        // Solo añadimos nuevos procesos a una lista separada
        setNewProcesses(prev => [...prev, newProc]);
      }, spawnTime / simulationSpeed);
    }

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [isSimulating, simulationSpeed, spawnTime]);

  const startSimulation = () => {
    setIsSimulating(true);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  const getTickTime = () => {
    return 1000 / simulationSpeed;
  };

  const getSpawnTime = () => {
    return 7000 / simulationSpeed;
  };

  const handleSpeedChange = (e) => {
    setSimulationSpeed(parseFloat(e.target.value));
  };

  return (
    <>
      <div className='header'>Planning simulator - By Nata, Steven and Mileth</div>
        <button onClick={() => setShowModal(prev => !prev)} className="button-report">{showModal ? "Ocultar Procesos Terminados" : "Ver Procesos Terminados"}</button>
      <div className="simulation-container">
        <SchedulerComponent
          mode="FCFS"
          initialProcesses={initialProcesses}
          newProcesses={newProcesses}
          isSimulating={isSimulating}
          isPreemptive={false}
          tickTime={getTickTime()}
          onProcessAdded={() => setNewProcesses(prev => prev.slice(1))}
          showModal={showModal}
        />
        <SchedulerComponent
          mode="SJN"
          initialProcesses={initialProcesses}
          newProcesses={newProcesses}
          isSimulating={isSimulating}
          isPreemptive={isPreemptive}
          tickTime={getTickTime()}
          onProcessAdded={() => setNewProcesses(prev => prev.slice(1))}
          showModal={showModal}
        />
        <label className='preemptive-marker'>
          <input
            type="checkbox"
            checked={isPreemptive}
            onChange={() => setIsPreemptive(!isPreemptive)}
          />
          Modo expropiativo
        </label>

        <div className='init-button-container'>
          {displayButton && (
            !isSimulating ? (
              <button className='init-simulation' onClick={startSimulation}>
                Iniciar simulación
              </button>
            ) : (
              <button className='init-simulation stop' onClick={stopSimulation}>
                Detener simulación
              </button>
            )
          )}
        </div>

        <div className="speed-control">
          <label>Velocidad de simulación:</label>
          <div className="speed-slider-container">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.5"
              value={simulationSpeed}
              onChange={handleSpeedChange}
              className="speed-slider"
            />
            <div className="speed-labels">
              <span>0.5x</span>
              <span>1x</span>
              <span>1.5x</span>
              <span>2x</span>
            </div>
          </div>
          <div className="current-speed">Velocidad actual: {simulationSpeed}x</div>
        </div>

      </div>
    </>
  )
}

export default App
