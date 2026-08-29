import { Component, signal, OnInit, OnDestroy } from '@angular/core';

interface TerminalLog {
  time: string;
  tag: string;
  tagClass: string;
  hex: string;
  message: string;
}

@Component({
  selector: 'app-metrics-feed',
  standalone: true,
  templateUrl: './metrics-feed.html',
  styleUrl: './metrics-feed.css'
})
export class MetricsFeed implements OnInit, OnDestroy {
  logs = signal<TerminalLog[]>([]);
  private intervalId: any;

  // Baza przykładowych wiadomości z oryginalnego zrzutu ekranu
  private logTemplates = [
    { tag: 'OK',   class: 'tag-ok',   msg: 'entropy pool reseeded (4096b)' },
    { tag: 'OK',   class: 'tag-ok',   msg: 'memory bus cycle complete :: 0.09ms' },
    { tag: 'DBG',  class: 'tag-dbg',  msg: 'latent-space vector converged' },
    { tag: 'OK',   class: 'tag-ok',   msg: 'share rotation committed (3/5)' },
    { tag: 'OK',   class: 'tag-ok',   msg: 'watchdog :: all subsystems green' },
    { tag: 'OK',   class: 'tag-ok',   msg: 'encrypted handshake :: peer 0x91a2' },
    { tag: 'CRIT', class: 'tag-crit', msg: 'access probe rejected :: clearance=NONE' },
    { tag: 'OK',   class: 'tag-ok',   msg: 'telemetry uplink flushed' },
    { tag: 'DBG',  class: 'tag-dbg',  msg: 'byzantine consensus reached :: 14/14' },
    { tag: 'CRIT', class: 'tag-crit', msg: 'byzantine consensus mismatch :: 13/14' },
    { tag: 'WARN', class: 'tag-warn', msg: 'non-euclidean route recomputed' },
    { tag: 'INFO', class: 'tag-info', msg: 'telemetry uplink flushed' }
  ];

  ngOnInit() {
    // Generowanie początkowej partii logów, aby ekran nie był pusty
    const initialLogs: TerminalLog[] = [];
    const now = new Date();
    for (let i = 12; i > 0; i--) {
      const pastTime = new Date(now.getTime() - i * 800);
      initialLogs.push(this.generateRandomLog(pastTime));
    }
    this.logs.set(initialLogs);

    // Dodawanie nowego logu w losowych odstępach czasu (efekt prawdziwego terminala)
    this.scheduleNextLog();
  }

  private scheduleNextLog() {
    // Losowy odstęp od 200ms do 1200ms
    const delay = Math.floor(Math.random() * 1000) + 200;
    
    this.intervalId = setTimeout(() => {
      const newLog = this.generateRandomLog(new Date());
      
      this.logs.update(currentLogs => {
        const updated = [...currentLogs, newLog];
        // Utrzymujemy maksymalnie 16 logów w widoku
        if (updated.length > 16) updated.shift();
        return updated;
      });
      
      this.scheduleNextLog();
    }, delay);
  }

  private generateRandomLog(date: Date): TerminalLog {
    const template = this.logTemplates[Math.floor(Math.random() * this.logTemplates.length)];
    // Generowanie losowego, 4-znakowego adresu hex (np. 0x5E72)
    const hexVal = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
    
    return {
      time: this.formatTime(date),
      tag: template.tag,
      tagClass: template.class,
      hex: `0x${hexVal}`,
      message: template.msg
    };
  }

  private formatTime(date: Date): string {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
  }
}