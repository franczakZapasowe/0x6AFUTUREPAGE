import { Component, signal, OnInit, OnDestroy } from '@angular/core';

interface TelemetryNode {
  label: string;
  basePct: number;
  variance: number;
  status: string;
  currentPct: number;
  activeBar: string;
  emptyBar: string;
}

@Component({
  selector: 'app-architecture',
  standalone: true,
  templateUrl: './architecture.html',
  styleUrl: './architecture.css'
})
export class Architecture implements OnInit, OnDestroy {
  // Stan maszyn (węzłów)
  nodes = signal<TelemetryNode[]>([
    this.initNode('NODE_01 [ZERO_LATENCY_BUS]', 68, 3, ':: ALLOCATED'),
    this.initNode('NODE_02 [ENCRYPTED_ENGINE]', 24, 5, ':: ROTATING_KEYS'),
    this.initNode('NODE_03 [DATA_PIPELINES]', 100, 0, ':: NON-EUCLIDEAN'),
    this.initNode('NODE_04 [LATENT_VECTOR]', 41, 4, ':: STABILIZED')
  ]);

  private intervals: any[] = [];

  ngOnInit() {
    // Inicjalizacja asymetrycznych oscylacji dla węzłów
    this.nodes().forEach((node, index) => {
      if (node.variance > 0) {
        // Losowy interwał dla każdej maszyny (od 800ms do 1500ms)
        const intervalTime = Math.floor(Math.random() * 700) + 800;
        const intervalId = setInterval(() => this.fluctuateNode(index), intervalTime);
        this.intervals.push(intervalId);
      }
    });
  }

  private initNode(label: string, basePct: number, variance: number, status: string): TelemetryNode {
    const node = { label, basePct, variance, status, currentPct: basePct, activeBar: '', emptyBar: '' };
    this.updateAsciiBar(node);
    return node;
  }

  private fluctuateNode(index: number) {
    this.nodes.update(currentNodes => {
      const node = currentNodes[index];
      
      // Wyliczenie losowego odchylenia w zadanym zakresie wariancji (np. -3 do +3)
      const change = Math.floor(Math.random() * (node.variance * 2 + 1)) - node.variance;
      let newPct = node.basePct + change;
      
      // Zabezpieczenie limitów
      if (newPct < 0) newPct = 0;
      if (newPct > 100) newPct = 100;

      node.currentPct = newPct;
      this.updateAsciiBar(node);
      
      return [...currentNodes]; 
    });
  }

  private updateAsciiBar(node: TelemetryNode) {
    const totalChars = 24;
    // Matematyczne zaokrąglenie paska względem 24 znaków
    const activeCount = Math.round((node.currentPct / 100) * totalChars);
    const emptyCount = totalChars - activeCount;

    node.activeBar = '|'.repeat(activeCount);
    node.emptyBar = '.'.repeat(emptyCount);
  }

  ngOnDestroy() {
    this.intervals.forEach(id => clearInterval(id));
  }
}