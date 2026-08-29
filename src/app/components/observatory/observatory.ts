import { Component, signal, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-observatory',
  standalone: true,
  templateUrl: './observatory.html',
  styleUrl: './observatory.css'
})
export class Observatory implements OnInit {
  filterValue = signal<string>('07'); // Domyślna wartość
  lastUpdate = signal<string>('');
  exposureStatus = signal<string>('STANDBY');

  ngOnInit() {
    this.initClock();
  }

  // Nasłuchuje zdarzeń 'hft-sync' wysyłanych z komponentu LiveStream
 @HostListener('window:hft-sync', ['$event'])
  onHftSync(event: Event) {
    // Rzutowanie typu, żeby TypeScript przestał krzyczeć o brakującym 'detail'
    const customEvent = event as CustomEvent;
    const { key, val, time } = customEvent.detail;

    // 1. Synchronizacja Filtra i Czasu z dokładnością do milisekundy logu
    if (key === 'FILTER') {
      const filterNum = val.split('/')[0];
      this.filterValue.set(filterNum);
      this.lastUpdate.set(time);
    }

    // 2. Brutalna Egzekucja Odrzucenia (Flesz)
    if (key === 'EXPOSURE' && val === 'DENIED') {
      this.exposureStatus.set('DENIED');
      
      // Przywrócenie do chłodnego STANDBY po równo 1 sekundzie
      setTimeout(() => {
        if (this.exposureStatus() === 'DENIED') {
          this.exposureStatus.set('STANDBY');
        }
      }, 1000);
    }
  }

  // Czas startowy przed napłynięciem pierwszych danych
  private initClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    this.lastUpdate.set(`${h}:${m}:${s}`);
  }
}