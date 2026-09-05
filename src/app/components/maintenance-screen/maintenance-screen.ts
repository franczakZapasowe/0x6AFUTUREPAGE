import { Component, signal, OnInit, OnDestroy } from '@angular/core';

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
  
  calibrationLogs = signal<string[]>([
    "INIT: ROOT KERNEL BOOT SEQUENCE",
    "Loading configuration parameters... OK",
    "--------------------------------------------------",
    "Awaiting sector mapping..."
  ]);
  
  private logId: any;
  private asciiId: any;
  private msInterval: any;

  // Surowe logi systemowe
  private logPool = [
    "0x00A1: Core integrity check... OK",
    "0x01B2: Database sector mapping... OK",
    "0x02C3: Cache fragmentation check... OK",
    "0x03D4: Fault isolation routing... ERROR - FIXING... OK",
    "[ EXECUTING ERROR-CORRECTION ON 0x6A-WEB-BASE ]",
    "0x6A CORE: Patch 3.12 applied to main kernel",
    "[ REPLICATING DATA TO REDUNDANT STORAGE ]",
    "0x04E5: File system scan... (42% complete)",
    "0x05F6: User access logs verification... COMPLETE",
    "C++20 binary socket stream proxy... VALIDATED",
    "DSP Biquad filter phase realignment... OK",
    "Angular Signals execution tree... FLUSHED",
    "TY-QC-7 Node handshake... SECURE",
    "Memory pointer reallocation... OK"
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

  // Symulator generowania logów
  private startFuiLogGenerator() {
    const generateLog = () => {
      const log = this.logPool[Math.floor(Math.random() * this.logPool.length)];
      
      this.calibrationLogs.update(logs => {
        const newLogs = [...logs, log];
        // Maksymalnie 14 linii w terminalu
        if (newLogs.length > 14) newLogs.shift(); 
        return newLogs;
      });

      // Losowe opóźnienia
      const delay = Math.random() > 0.85 ? Math.floor(Math.random() * 2000) + 1000 : Math.floor(Math.random() * 400) + 100;
      this.logId = setTimeout(generateLog, delay);
    };

    this.logId = setTimeout(generateLog, 1500);
  }

  ngOnDestroy() {
    if (this.msInterval) clearInterval(this.msInterval);
    if (this.logId) clearTimeout(this.logId);
    if (this.asciiId) clearInterval(this.asciiId);
  }
}