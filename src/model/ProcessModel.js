let lastId = 0;

export class ProcessModel {


    constructor(id, name, burst, arrival, size, color) {
        this.id = id;               // identificador único
        this.name = name;           // nombre del proceso
        this.burst = burst;         // tiempo total requerido
        this.remaining = burst;     // tiempo restante
        this.arrival = arrival;     // timestamp de llegada
        this.size = size;           // ancho visual (solo UI)
        this.color = color;         // color para diferenciar en UI
        this.startTime = null;      // cuándo comenzó a ejecutarse
        this.finishTime = null;     // cuándo finalizó
    }

    tick() {
        if (this.remaining > 0) {
            this.remaining -= 1;
        }
    }

    isFinished() {
        return this.remaining <= 0;
    }

    static createRandomProcess() {
        const id = ++lastId;

        const processNames = [
            "Init", "System", "Chrome", "VSCode", "Explorer",
            "Discord", "Spotify", "Terminal", "Compiler", "Kernel",
            "Daemon", "Worker", "Backup", "Updater", "Logger"
        ];
        const name = processNames[Math.floor(Math.random() * processNames.length)] + `-${id}`;
        const burst = Math.floor(Math.random() * 8) + 2; // 2..9

        const sizeFactor = 30;
        const size = burst * sizeFactor;

        const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

        return new ProcessModel(id, name, burst, Date.now(), size, color);
    }
}