import { Component, signal, OnInit, OnDestroy } from '@angular/core';

// Pojedyncza linia terminala diagnostycznego
interface TerminalLine {
  id: number;
  tag: string;     // np. "0x08F1:"
  body: string;    // np. "Flushing latent vector arrays..."
  status: string;  // np. "DONE" (renderowany ostrą bielą)
  alert: boolean;  // linia z tablicy błędów / wymuszeń
}

@Component({
  selector: 'app-maintenance-screen',
  standalone: true,
  templateUrl: './maintenance-screen.html',
  styleUrl: './maintenance-screen.css'
})
export class MaintenanceScreen implements OnInit, OnDestroy {
  // Pasek postępu ASCII i jego detale
  asciiProgressBar = signal<string>('[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]');
  asciiPercentage = signal<string>('0.0%');
  asciiChunk = signal<string>('0/72');

  // Terminal diagnostyczny (prawy panel)
  terminalLines = signal<TerminalLine[]>([]);

  private logId: any;
  private asciiId: any;
  private msInterval: any;

  // Limit linii trzymanych w pamięci / DOM
  private readonly MAX_LINES = 36;
  private lineSeq = 0;
  private burstLeft = 0;
  private lastLog = '';

  private readonly bootSequence = [
    'INIT: ROOT KERNEL BOOT SEQUENCE',
    'Loading configuration parameters... OK',
    '--------------------------------------------------',
    'Awaiting sector mapping...'
  ];

  // Tablica 1: Izolacja i czyszczenie (40%)
  private readonly isolationPool = [
    '0x08F1: Flushing latent vector arrays... DONE',
    '0x1A22: Purging stale node connections [0x00 - 0xFF]... CLEAR',
    '0x2C4B: Overwriting swap partitions... ZEROED',
    '0x3D19: Dumping encrypted memory heaps... SECURE',
    '0x4E55: Isolating corrupted index pointers... QUARANTINED'
  ];

  // Tablica 2: Kalibracja i spójność (40%)
  private readonly calibrationPool = [
    '0x5F88: Re-aligning cryptographic hashes... MATCH',
    '0x6A12: Compiling core dependency tree... COMPILED',
    '0x7B34: Testing latent latency limits... < 12ms [OK]',
    '0x8C56: Verifying structural node integrity... SOLID',
    '0x9D78: Synchronizing redundant state machines... SYNCED'
  ];

  // Tablica 3: Błędy i wymuszenia (20%) — po nich dłuższa przerwa
  private readonly alertPool = [
    '0xERR: Synchronization timeout on Node 4 -> FORCING REBOOT... OK',
    '0xWARN: Memory leak detected in cluster 0x9 -> ISOLATING... DONE',
    '0xCRIT: Bad sector mapping -> REBUILDING NODE TREE... SUCCESS'
  ];

  ngOnInit() {
    this.startFuiLogGenerator();
    this.startAsciiProgressGenerator();
  }

  // Oblicza rzeczywisty postęp od Piątku 00:00 do Poniedziałku 00:00 i generuje pasek ASCII
  private startAsciiProgressGenerator() {
    this.msInterval = setInterval(() => {
      const now = new Date();
      const day = now.getDay();
      let daysSinceFriday = 0;
      
      if (day === 5) { daysSinceFriday = 0; }
      else if (day === 6) { daysSinceFriday = 1; }
      else if (day === 0) { daysSinceFriday = 2; }

      const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceFriday);
      friday.setHours(0, 0, 0, 0);
      
      const elapsed = now.getTime() - friday.getTime();
      const total = 72 * 60 * 60 * 1000; 
      
      let progress = (elapsed / total) * 100;
      if (progress > 100) progress = 100;
      if (progress < 0) progress = 0;

      this.asciiPercentage.set(progress.toFixed(1) + '%');
      
      // Chunks (zakładamy 72 godzinne chunki, co godzinę jeden)
      const currentChunk = Math.floor((elapsed / total) * 72);
      this.asciiChunk.set(`${currentChunk > 72 ? 72 : currentChunk}/72`);

      // Generowanie paska ASCII (32 znaki szerokości)
      const totalBlocks = 32;
      const filledBlocks = Math.round((progress / 100) * totalBlocks);
      const emptyBlocks = totalBlocks - filledBlocks;
      
      const filledChar = '█';
      const emptyChar = '░';
      
      this.asciiProgressBar.set(`[${filledChar.repeat(filledBlocks)}${emptyChar.repeat(emptyBlocks)}]`);
    }, 100);
  }

  // ─────────────────────────────────────────────
  // TERMINAL DIAGNOSTYCZNY: burst & pause
  // ─────────────────────────────────────────────

  private startFuiLogGenerator() {
    this.terminalLines.set(this.bootSequence.map(raw => this.parseLine(raw, false)));
    this.logId = setTimeout(() => this.tick(), 1500);
  }

  // Jeden krok generatora: losuje log i planuje następny krok
  private tick() {
    const { raw, alert } = this.pickLog();

    if (alert) {
      this.runAlert(raw);
      return;
    }

    this.pushLine(this.parseLine(raw, false));
    this.logId = setTimeout(() => this.tick(), this.nextDelay());
  }

  // Błąd/wymuszenie: linia "zawisa" bez statusu, status pojawia się po chwili,
  // potem dodatkowa przerwa zanim system ruszy dalej
  private runAlert(raw: string) {
    this.burstLeft = 0;

    const line = this.parseLine(raw, true);
    const finalStatus = line.status;
    this.pushLine({ ...line, status: '' });

    this.logId = setTimeout(() => {
      this.terminalLines.update(lines =>
        lines.map(l => (l.id === line.id ? { ...l, status: finalStatus } : l))
      );
      this.logId = setTimeout(() => this.tick(), this.rand(1000, 2000));
    }, this.rand(1200, 2200));
  }

  // Tempo: seria 3–4 linii w ułamku sekundy, potem przerwa 1–3 s;
  // poza seriami zwykłe tempo lub losowy "ciężki plik"
  private nextDelay(): number {
    if (this.burstLeft > 0) {
      this.burstLeft--;
      return this.burstLeft > 0 ? this.rand(30, 120) : this.rand(1000, 3000);
    }

    const r = Math.random();
    if (r < 0.3) {
      this.burstLeft = this.rand(2, 3); // + bieżąca linia = seria 3–4
      return this.rand(30, 120);
    }
    if (r < 0.5) {
      return this.rand(1000, 3000);
    }
    return this.rand(150, 600);
  }

  // Losowanie z proporcjami 40 / 40 / 20, bez powtórzenia tej samej linii pod rząd
  private pickLog(): { raw: string; alert: boolean } {
    const r = Math.random();
    const pool = r < 0.4 ? this.isolationPool : r < 0.8 ? this.calibrationPool : this.alertPool;

    let raw = pool[Math.floor(Math.random() * pool.length)];
    if (raw === this.lastLog) {
      raw = pool[(pool.indexOf(raw) + 1) % pool.length];
    }
    this.lastLog = raw;

    return { raw, alert: pool === this.alertPool };
  }

  // Dzieli surowy log na: tag / treść / status
  private parseLine(raw: string, alert: boolean): TerminalLine {
    let rest = raw;
    let tag = '';
    let status = '';

    const tagMatch = /^(\S+:)\s+/.exec(rest);
    if (tagMatch) {
      tag = tagMatch[1];
      rest = rest.slice(tagMatch[0].length);
    }

    const cut = rest.lastIndexOf('... ');
    if (cut !== -1) {
      status = rest.slice(cut + 4);
      rest = rest.slice(0, cut + 3);
    }

    return { id: ++this.lineSeq, tag, body: rest, status, alert };
  }

  // Dodaje linię i przycina bufor do MAX_LINES
  private pushLine(line: TerminalLine) {
    this.terminalLines.update(lines => {
      const next = [...lines, line];
      return next.length > this.MAX_LINES ? next.slice(-this.MAX_LINES) : next;
    });
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  ngOnDestroy() {
    if (this.msInterval) clearInterval(this.msInterval);
    if (this.logId) clearTimeout(this.logId);
    if (this.asciiId) clearInterval(this.asciiId);
  }
}