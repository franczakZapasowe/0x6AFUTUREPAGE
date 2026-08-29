import { Component, signal, Output, EventEmitter, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-hero-terminal',
  standalone: true,
  templateUrl: './hero-terminal.html',
  styleUrl: './hero-terminal.css'
})
export class HeroTerminal implements OnInit {
  @Output() bootSequenceComplete = new EventEmitter<void>();

  bootPhase = signal<'typing' | 'waiting'>('typing');

  typedTitle = signal('');
  typedLogs = signal<string[]>([]);
  currentLog = signal('');
  typedSubheadline = signal('');
  typedPrompt = signal('');

  ngOnInit() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    // Literówka: Zmieniono '06A' na '0x6A'
    const titleText = `0x6A / ${year}.${month}.${day}`;

    const formatTime = (date: Date) => {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    const timeNow = new Date();
    const timePast = new Date(timeNow.getTime() - (5 * 60000) - 31000);
    
    const logsToType = [
      `${formatTime(new Date(timePast.getTime()))}  MARKET   → OBSERVING`,
      `${formatTime(new Date(timePast.getTime() + 2000))}  FILTER   → 07/09`,
      `${formatTime(new Date(timePast.getTime() + 3000))}  EXPOSURE → DENIED`,
      `${formatTime(new Date(timePast.getTime() + 4000))}  STATE    → STANDBY`,
      ``,
      `${formatTime(new Date(timeNow.getTime() - 1000))}  FILTER   → 09/09`,
      `${formatTime(timeNow)}  EXPOSURE → AUTHORIZED`,
      `${formatTime(timeNow)}  EXEC     → XAU`
    ];

    const subText = '[ ACCESS STATUS ] NOT CURRENTLY OPEN TO THE PUBLIC.';
    const promptText = '> PRESS [ENTER] TO INITIALIZE KERNEL ';

    const typeText = (text: string, updateFn: (val: string) => void, speed: number, callback: () => void) => {
      let i = 0;
      const interval = setInterval(() => {
        updateFn(text.substring(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(callback, 150);
        }
      }, speed);
    };

    typeText(titleText, (val) => this.typedTitle.set(val), 40, () => {
      let logIndex = 0;
      
      const typeNextLog = () => {
        if (logIndex < logsToType.length) {
          const currentLine = logsToType[logIndex];
          
          if (currentLine === '') {
             this.typedLogs.update(logs => [...logs, '']);
             logIndex++;
             typeNextLog();
          } else {
             typeText(currentLine, (val) => this.currentLog.set(val), 15, () => {
               this.typedLogs.update(logs => [...logs, currentLine]);
               this.currentLog.set(''); 
               logIndex++;
               typeNextLog();
             });
          }
        } else {
          typeText(subText, (val) => this.typedSubheadline.set(val), 25, () => {
             typeText(promptText, (val) => this.typedPrompt.set(val), 30, () => {
                this.bootPhase.set('waiting');
             });
          });
        }
      };

      typeNextLog();
    });
  }

  @HostListener('window:keydown.enter')
  handleEnter() {
    if (this.bootPhase() === 'waiting') {
      // Wyrzuca event na zewnątrz (do app.ts) informujący o poprawnym starcie
      this.bootSequenceComplete.emit(); 
    }
  }
}