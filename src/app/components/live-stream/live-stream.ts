import { Component, signal, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';

interface LogLine {
  id: number;
  time: string;
  key: string;
  val: string;
  color: string;
}

@Component({
  selector: 'app-live-stream',
  standalone: true,
  templateUrl: './live-stream.html',
  styleUrl: './live-stream.css'
})
export class LiveStream implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  currentLogs = signal<LogLine[]>([]);
  currentTime = signal<string>('');
  
  private clockId: any;
  private processTimeoutId: any;
  private logIdCounter = 0;
  
  // Konfiguracja "chaosu"
  private readonly MAX_VISIBLE_LOGS = 7; 
  private isProcessing = false;

  ngOnInit() {
    // Inicjalizacja zegara systemowego (co 1s)
    this.updateClock();
    this.clockId = setInterval(() => {
      this.updateClock();
    }, 1000);

    // Zaczynamy cykl analityczny na starcie (żeby okno nie było puste)
    this.appendLog('MARKET', 'OBSERVING', 'val-cyan');
    setTimeout(() => this.startAnalysisCycle(), 1000);
  }

  // Scrolluje na dół po każdym renderze, jeśli logów jest za dużo
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  private updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    this.currentTime.set(`${h}:${m}:${s}`);
  }

  // Funkcja główna odpowiedzialna za 1 cykl analizy (losowa ilość skoków filtra i DENIED na koniec)
  private startAnalysisCycle() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    // Losujemy ile razy parametr FILTER ma skoczyć, zanim odrzuci (od 3 do 8 razy)
    const filterJumps = Math.floor(Math.random() * 6) + 3;
    let currentJump = 0;

    const executeNextStep = () => {
      if (currentJump < filterJumps) {
        // Generuj nieliniowy skok (Twardy limit: nigdy 09/09, więc od 04 do 08)
        const randVal = Math.floor(Math.random() * 5) + 4; 
        const filterStr = `0${randVal}/09`;
        
        // LOGIKA KOLORÓW: Tylko 07 i 08 na pomarańczowo, reszta na biało (val-gray)
        const colorClass = (randVal === 7 || randVal === 8) ? 'val-yellow' : 'val-gray';
        
        this.appendLog('FILTER', filterStr, colorClass);
        
        currentJump++;
        
        // Losowe opóźnienie przed kolejnym krokiem (asymetria czasowa: od 100ms do 1100ms)
        const delay = Math.floor(Math.random() * 1000) + 100;
        this.processTimeoutId = setTimeout(executeNextStep, delay);
      } else {
        // Koniec cyklu - gwałtowne odrzucenie
        // Mała pauza na pomyślenie, a potem cios
        this.processTimeoutId = setTimeout(() => {
          this.appendLog('EXPOSURE', 'DENIED', 'val-red');
          
          this.processTimeoutId = setTimeout(() => {
            this.appendLog('STATE', 'STANDBY', 'val-gray');
            this.isProcessing = false;
            
            // Losowa pauza po zakończeniu cyklu przed rozpoczęciem następnego (od 2 do 5 sekund)
            const idleDelay = Math.floor(Math.random() * 3000) + 2000;
            this.processTimeoutId = setTimeout(() => {
                this.appendLog('MARKET', 'OBSERVING', 'val-cyan');
                // Restartujemy cykl
                setTimeout(() => this.startAnalysisCycle(), 500);
            }, idleDelay);
            
          }, 300); // 300ms po DENIED wypada STANDBY
        }, 800);
      }
    };

    // Odpal pierwszy krok po losowym krótkim czasie
    this.processTimeoutId = setTimeout(executeNextStep, Math.floor(Math.random() * 600) + 200);
  }

  // Funkcja dodająca log. Pilnuje dynamicznego timestampu i wywala stare.
  private appendLog(key: string, val: string, colorClass: string) {
    this.currentLogs.update(logs => {
      // Pobieramy absolutnie bieżący czas w ułamku sekundy dodania logu
      const timestamp = this.currentTime();
      
      // Wypychamy sygnał na zewnątrz dla HUD (Observatory)
      window.dispatchEvent(new CustomEvent('hft-sync', { detail: { key, val, time: timestamp } }));
      
      const newLog = {
        id: this.logIdCounter++,
        time: timestamp,
        key: key,
        val: val,
        color: colorClass
      };
      
      const updated = [...logs, newLog];
      
      // Limitowanie wyświetlanych logów, by działał scroll i najstarsze wypadały
      if (updated.length > this.MAX_VISIBLE_LOGS) {
        updated.shift();
      }
      
      return updated;
    });
  }

  ngOnDestroy() {
    clearInterval(this.clockId);
    clearTimeout(this.processTimeoutId);
  }
}