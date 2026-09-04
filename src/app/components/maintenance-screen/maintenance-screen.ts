import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-maintenance-screen',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './maintenance-screen.html',
  styleUrl: './maintenance-screen.css'
})
export class MaintenanceScreen implements OnInit, OnDestroy {
  resumeProgress = signal<number>(0); 
  currentPhase = signal<number>(1);
  
  calibrationLogs = signal<string[]>([
    "[ 0x6A SYSTEM MAINTENANCE PROTOCOL INITIATED ]",
    "System Offline: Deep Calibration Cycle in Progress",
    "--------------------------------------------------",
    "[ ANALYZING SECTORS ... ]"
  ]);
  
  private msInterval: any;
  private logId: any;

  // Pula realistycznych logów serwisowych
  private logPool = [
    "0x00A1: Core integrity check... OK",
    "0x01B2: Database sector mapping... OK",
    "0x02C3: Cache fragmentation check... OK",
    "0x03D4: Fault isolation routing... ERROR - FIXING... OK",
    "[ EXECUTING ERROR-CORRECTION ON 0x6A-WEB-BASE ]",
    "[ 0x6A CORE: Patch 3.12 applied to main kernel ]",
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
    this.startHighSpeedClock();
    this.startFuiLogGenerator();
  }

  // Liczy % upływu czasu od Piątku 00:00 do Poniedziałku 00:00
  private startHighSpeedClock() {
    this.msInterval = setInterval(() => {
      const now = new Date();
      const day = now.getDay();
      let daysSinceFriday = 0;
      
      if (day === 5) { daysSinceFriday = 0; }
      else if (day === 6) { daysSinceFriday = 1; }
      else if (day === 0) { daysSinceFriday = 2; }

      // Kotwica startowa: Piątek 00:00 w bieżącym tygodniu
      const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceFriday);
      friday.setHours(0, 0, 0, 0);
      
      const elapsed = now.getTime() - friday.getTime();
      const total = 72 * 60 * 60 * 1000; // 72 godziny w ms
      
      let progress = (elapsed / total) * 100;
      if (progress > 100) progress = 100;
      if (progress < 0) progress = 0;
      
      this.resumeProgress.set(progress);
      
      // Fazy kalibracji w zależności od postępu weekendu
      if (progress < 25) this.currentPhase.set(1);
      else if (progress < 50) this.currentPhase.set(2);
      else if (progress < 75) this.currentPhase.set(3);
      else this.currentPhase.set(4);
    }, 50);
  }

  // Symulator generowania logów
  private startFuiLogGenerator() {
    const generateLog = () => {
      const log = this.logPool[Math.floor(Math.random() * this.logPool.length)];
      
      this.calibrationLogs.update(logs => {
        const newLogs = [...logs, log];
        // Utrzymujemy max 12 linii, by wyglądało jak przewijający się terminal
        if (newLogs.length > 12) newLogs.shift(); 
        return newLogs;
      });

      // Losowe opóźnienia imitujące "myślenie" i procesowanie (od 100ms do 3s)
      const delay = Math.random() > 0.85 ? Math.floor(Math.random() * 2000) + 1000 : Math.floor(Math.random() * 400) + 100;
      this.logId = setTimeout(generateLog, delay);
    };

    this.logId = setTimeout(generateLog, 1500);
  }

  ngOnDestroy() {
    if (this.msInterval) clearInterval(this.msInterval);
    if (this.logId) clearTimeout(this.logId);
  }
}