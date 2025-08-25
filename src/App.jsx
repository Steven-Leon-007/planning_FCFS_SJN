import { useEffect, useState } from 'react'
import SchedulerComponent from './components/scheduler/SchedulerComponent'
import { ProcessModel } from './model/ProcessModel';
import "./App.css";

function App() {
  const [processes, setProcesses] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [displayButton, setDisplayButton] = useState(false);

  useEffect(() => {
    const initialProcesses = Array.from({ length: 10 }, () => ProcessModel.createRandomProcess());
    setProcesses(initialProcesses);
    setTimeout(() => {
      setDisplayButton(true);
    }, 4000);
  }, []);

  const startSimulation = () => {
    setIsSimulating(true);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  return (
    <>
      <div className='header'>Planning simulator - By Nata, Steven and Mileth</div>
      <div className="simulation-container">
        <SchedulerComponent mode="FCFS" processes={processes} isSimulating={isSimulating}/>
        <SchedulerComponent mode="SJN" processes={processes} isSimulating={isSimulating}/>
        <div>
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
      </div>
    </>
  )
}

export default App
