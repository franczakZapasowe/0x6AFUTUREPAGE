import { Component, signal, OnInit, OnDestroy } from '@angular/core';

interface ProjectionStep {
  id: string;
  capital: string;
  gain: string;
  pct: string;
  isStandby: boolean;
  comment: string;
  rawCap: number; 
}

@Component({
  selector: 'app-capital-projection',
  standalone: true,
  templateUrl: './capital-projection.html',
  styleUrl: './capital-projection.css'
})
export class CapitalProjection implements OnInit, OnDestroy {
  // Twarde dane źródłowe
  private readonly sourceData: ProjectionStep[] = [
    { id: 'M_00', capital: '$10,000.00', gain: '[ INITIALIZATION ]', pct: '', isStandby: false, comment: '', rawCap: 10000 },
    { id: 'M_01', capital: '$11,600.00', gain: '+ $1,600.00', pct: '[ +16.0% ]', isStandby: false, comment: '', rawCap: 11600 },
    { id: 'M_02', capital: '$12,412.00', gain: '+ $812.00',   pct: '[ +7.0%  ]', isStandby: false, comment: '<- Yield calculated on $11,600', rawCap: 12412 },
    { id: 'M_03', capital: '$13,529.08', gain: '+ $1,117.08', pct: '[ +9.0%  ]', isStandby: false, comment: '', rawCap: 13529 },
    { id: 'M_04', capital: '$14,340.82', gain: '+ $811.74',   pct: '[ +6.0%  ]', isStandby: false, comment: '', rawCap: 14340 },
    { id: 'M_05', capital: '$14,340.82', gain: '+ $0.00',     pct: '[ STANDBY ]', isStandby: true, comment: '<- Zero exposure. Capital preserved.', rawCap: 14340 },
    { id: 'M_06', capital: '$15,774.90', gain: '+ $1,434.08', pct: '[ +10.0% ]', isStandby: false, comment: '', rawCap: 15774 },
    { id: 'M_07', capital: '$17,667.89', gain: '+ $1,892.99', pct: '[ +12.0% ]', isStandby: false, comment: '', rawCap: 17667 },
    { id: 'M_08', capital: '$18,374.61', gain: '+ $706.72',   pct: '[ +4.0%  ]', isStandby: false, comment: '', rawCap: 18374 },
    { id: 'M_09', capital: '$19,844.58', gain: '+ $1,469.97', pct: '[ +8.0%  ]', isStandby: false, comment: '', rawCap: 19844 },
    { id: 'M_10', capital: '$22,622.82', gain: '+ $2,778.24', pct: '[ +14.0% ]', isStandby: false, comment: '', rawCap: 22622 },
    { id: 'M_11', capital: '$23,753.96', gain: '+ $1,131.14', pct: '[ +5.0%  ]', isStandby: false, comment: '', rawCap: 23753 },
    { id: 'M_12', capital: '$26,366.90', gain: '+ $2,612.94', pct: '[ +11.0% ]', isStandby: false, comment: '', rawCap: 26366 },
  ];

  // Sygnały zasilające widok w czasie rzeczywistym
  displayedSteps = signal<ProjectionStep[]>([]);
  activeCapital = signal<string>('$0.00');
  activeYield = signal<string>('+0.00%');
  progressPercent = signal<number>(0);
  isSimulating = signal<boolean>(true);

  private simInterval: any;
  private restartTimeout: any;

  ngOnInit() {
    this.runSimulation();
  }

  private runSimulation() {
    this.isSimulating.set(true);
    this.displayedSteps.set([]);
    this.activeCapital.set('$0.00');
    this.activeYield.set('0.00%');
    this.progressPercent.set(0);

    let currentIndex = 0;

    // Maszynowe tempo dodawania wierszy (350ms na linię)
    this.simInterval = setInterval(() => {
      if (currentIndex < this.sourceData.length) {
        const step = this.sourceData[currentIndex];

        // 1. Zrzut kolejnego wiersza do matrycy
        this.displayedSteps.update(steps => [...steps, step]);

        // 2. Aktualizacja wielkiego HUD-a po prawej
        this.activeCapital.set(step.capital);

        // 3. Kalkulacja Net Yield na żywo względem $10k
        if (currentIndex === 0) {
          this.activeYield.set('0.00%');
        } else {
          const yieldVal = ((step.rawCap - 10000) / 10000) * 100;
          this.activeYield.set('+' + yieldVal.toFixed(2) + '%');
        }

        // 4. Kalkulacja paska postępu (start od 10k(37.9%) do 26.3k(100%))
        const progress = (step.rawCap / 26366) * 100;
        this.progressPercent.set(progress);

        currentIndex++;
      } else {
        // Zakończenie cyklu - zatrzymanie, przerwa 8 sekund i restart maszyny
        clearInterval(this.simInterval);
        this.isSimulating.set(false);

        this.restartTimeout = setTimeout(() => {
          this.runSimulation();
        }, 8000);
      }
    }, 350); 
  }

  ngOnDestroy() {
    if (this.simInterval) clearInterval(this.simInterval);
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
  }
}