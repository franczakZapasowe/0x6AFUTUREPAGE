import { Component, signal, OnInit, OnDestroy } from '@angular/core';

// Pojedyncza linia terminala diagnostycznego
interface TerminalLine {
  id: number;
  tag: string;     // np. "0x08F1:"
  body: string;    // np. "Flushing latent vector arrays..."
  status: string;  // np. "DONE" (renderowany ostrą bielą)
  alert: boolean;  // linia z tablicy błędów / wymuszeń
}

// Jeden wiersz matrycy BUFFER_RECONSTRUCTION (16 bloków)
interface BufferRow {
  addr: string;    // np. "0x10:"
  filled: string;  // pełne bloki "█"
  empty: string;   // puste bloki "."
}

@Component({
  selector: 'app-maintenance-screen',
  standalone: true,
  templateUrl: './maintenance-screen.html',
  styleUrl: './maintenance-screen.css'
})
export class MaintenanceScreen implements OnInit, OnDestroy {
  // BUFFER_RECONSTRUCTION: matryca 4 × 16 = 64 bloki
  bufferRows = signal<BufferRow[]>([]);
  bufferProcessed = signal<number>(0);
  bufferState = signal<string>('');
  bufferSpinner = signal<string>('');  // pusty = spinner nieaktywny, pokazujemy kursor

  // CORE_ALIGNMENT_METRICS: koniec okna serwisowego jako Unix timestamp
  lockExpiry = signal<string>('0000000000');

  // Terminal diagnostyczny (prawy panel)
  terminalLines = signal<TerminalLine[]>([]);

  private logId: any;
  private bufferId: any;
  private stateId: any;
  private spinnerId: any;
  private spinnerStopId: any;

  // Parametry bufora
  private readonly BUFFER_BLOCKS = 64;
  private readonly BUFFER_ROW_WIDTH = 16;
  private readonly WINDOW_MS = 72 * 60 * 60 * 1000;  // pt 00:00 → pn 00:00 UTC
  private readonly DAY_MS = 24 * 60 * 60 * 1000;
  private readonly SPINNER_FRAMES = ['|', '/', '-', '\\'];
  private readonly bufferStates = [
    'ISOLATING_LEAKS',
    'FLUSHING_CACHE',
    'REBUILDING_INDEX',
    'VERIFYING_SECTORS',
    'ALIGNING_HASHES'
  ];

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
    this.lockExpiry.set(this.computeLockExpiry());
    this.startFuiLogGenerator();
    this.startBufferReconstruction();
  }

  // Unix timestamp (sekundy) najbliższego poniedziałku 00:00 GMT+1.
  // Liczone w UTC, więc każdy odwiedzający widzi tę samą wartość niezależnie od strefy.
  private computeLockExpiry(): string {
    const OFFSET_MS = 1 * 60 * 60 * 1000; // GMT+1 (dla czasu letniego ustaw 2)
    const shifted = new Date(Date.now() + OFFSET_MS);
    const daysToMonday = (8 - shifted.getUTCDay()) % 7 || 7;
    const mondayMs = Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate() + daysToMonday
    ) - OFFSET_MS;
    return Math.floor(mondayMs / 1000).toString();
  }

  // ─────────────────────────────────────────────
  // BUFFER_RECONSTRUCTION: postęp w czasie rzeczywistym
  // ─────────────────────────────────────────────

  private startBufferReconstruction() {
    this.updateBuffer();
    this.bufferId = setInterval(() => this.updateBuffer(), 1000);
    this.setNextState();
  }

  // Okno: trwający (lub najbliższy) piątek 00:00 UTC → poniedziałek 00:00 UTC, dokładnie 72 h.
  // Liczone w UTC (bez DST), więc przejście przez weekend, miesiąc i rok jest zawsze równe.
  private computeFilledBlocks(nowMs: number): number {
    const now = new Date(nowMs);
    const daysSinceFriday = (now.getUTCDay() + 2) % 7; // pt=0, sb=1, nd=2, pn=3 … czw=6

    let start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceFriday);
    if (nowMs >= start + this.WINDOW_MS) {
      start += 7 * this.DAY_MS; // okno już minęło → liczymy do najbliższego piątku (0 bloków)
    }

    const progress = Math.min(1, Math.max(0, (nowMs - start) / this.WINDOW_MS));
    return Math.floor(progress * this.BUFFER_BLOCKS);
  }

  // Co sekundę przelicza bloki; DOM aktualizowany tylko gdy liczba się zmieni
  private updateBuffer() {
    const filled = this.computeFilledBlocks(Date.now());
    if (filled === this.bufferProcessed() && this.bufferRows().length) return;

    this.bufferProcessed.set(filled);

    const rows: BufferRow[] = [];
    const rowCount = this.BUFFER_BLOCKS / this.BUFFER_ROW_WIDTH;
    for (let r = 0; r < rowCount; r++) {
      const offset = r * this.BUFFER_ROW_WIDTH;
      const rowFilled = Math.min(this.BUFFER_ROW_WIDTH, Math.max(0, filled - offset));
      rows.push({
        addr: '0x' + offset.toString(16).toUpperCase().padStart(2, '0') + ':',
        filled: '█'.repeat(rowFilled),
        empty: '.'.repeat(this.BUFFER_ROW_WIDTH - rowFilled)
      });
    }
    this.bufferRows.set(rows);
  }

  // STATE: zmiana co 3–8 s, bez powtórzenia poprzedniego stanu
  private setNextState() {
    let next: string;
    do {
      next = this.bufferStates[Math.floor(Math.random() * this.bufferStates.length)];
    } while (next === this.bufferState());

    this.bufferState.set(next);
    this.runSpinner(this.rand(800, 1600));
    this.stateId = setTimeout(() => this.setNextState(), this.rand(3000, 8000));
  }

  // Spinner | / - \ przez chwilę po zmianie stanu, potem wraca migający kursor
  private runSpinner(durationMs: number) {
    clearInterval(this.spinnerId);
    clearTimeout(this.spinnerStopId);

    let frame = 0;
    this.bufferSpinner.set(this.SPINNER_FRAMES[frame]);

    this.spinnerId = setInterval(() => {
      frame = (frame + 1) % this.SPINNER_FRAMES.length;
      this.bufferSpinner.set(this.SPINNER_FRAMES[frame]);
    }, 100);

    this.spinnerStopId = setTimeout(() => {
      clearInterval(this.spinnerId);
      this.bufferSpinner.set('');
    }, durationMs);
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
    if (this.logId) clearTimeout(this.logId);
    if (this.bufferId) clearInterval(this.bufferId);
    if (this.stateId) clearTimeout(this.stateId);
    if (this.spinnerId) clearInterval(this.spinnerId);
    if (this.spinnerStopId) clearTimeout(this.spinnerStopId);
  }
}