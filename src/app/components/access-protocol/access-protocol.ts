import { Component, signal, OnInit } from '@angular/core';

interface LogStep {
  tag: string;
  type: 'ok' | 'warn' | 'wait' | 'err';
  msg: string;
}

@Component({
  selector: 'app-access-protocol',
  standalone: true,
  templateUrl: './access-protocol.html',
  styleUrl: './access-protocol.css'
})
export class AccessProtocol implements OnInit {
  accessKey = signal('');
  // Dodano nowy status: 'granted'
  status = signal<'idle' | 'processing' | 'denied' | 'sealed' | 'granted'>('idle');
  validationLogs = signal<LogStep[]>([]);
  
  attempts = signal(0); 
  readonly MAX_ATTEMPTS = 6;
  readonly STORAGE_KEY = '0x6a_access_attempts';
  // Tajny klucz dostępu
  readonly SECRET_KEY = '0x6A:65:76:6C:6F:74'; 

  ngOnInit() {
    const storedAttempts = localStorage.getItem(this.STORAGE_KEY);
    if (storedAttempts) {
      const parsedAttempts = parseInt(storedAttempts, 10);
      this.attempts.set(parsedAttempts);
      
      if (parsedAttempts >= this.MAX_ATTEMPTS) {
        this.status.set('sealed');
      }
    }
  }

  onKeyChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.accessKey.set(target.value);
  }

  executeRequest() {
    if (!this.accessKey().trim() || this.status() === 'processing') return;
    
    this.status.set('processing');
    this.validationLogs.set([]);
    
    // Sprawdzamy czy wpisano tajny klucz
    const isKeyValid = this.accessKey().trim() === this.SECRET_KEY;

    // Różne scenariusze logów w zależności od sukcesu/porażki
    let steps: { log: LogStep, delay: number }[] = [];
    
    if (isKeyValid) {
      steps = [
        { log: { tag: '[OK]', type: 'ok', msg: 'parsing access key...' }, delay: 300 },
        { log: { tag: '[OK]', type: 'ok', msg: 'querying node registry...' }, delay: 900 },
        { log: { tag: '[OK]', type: 'ok', msg: 'verifying clearance level: ELITE' }, delay: 1600 },
        { log: { tag: '[>>]', type: 'warn', msg: 'bypassing security protocols...' }, delay: 2300 },
        { log: { tag: '[OK]', type: 'ok', msg: 'establishing direct neural link...' }, delay: 3000 }
      ];
    } else {
      steps = [
        { log: { tag: '[OK]', type: 'ok', msg: 'parsing access key...' }, delay: 300 },
        { log: { tag: '[OK]', type: 'ok', msg: 'querying node registry...' }, delay: 900 },
        { log: { tag: '[OK]', type: 'ok', msg: 'verifying clearance level...' }, delay: 1600 },
        { log: { tag: '[>>]', type: 'warn', msg: 'encrypting request payload...' }, delay: 2300 },
        { log: { tag: '[..]', type: 'wait', msg: 'dispatching to provisioning queue...' }, delay: 3000 }
      ];
    }

    steps.forEach((step, index) => {
      setTimeout(() => {
        this.validationLogs.update(logs => [...logs, step.log]);
        
        if (index === steps.length - 1) {
          setTimeout(() => {
            if (isKeyValid) {
              // Reset prób na wypadek sukcesu
              this.attempts.set(0);
              localStorage.setItem(this.STORAGE_KEY, '0');
              this.status.set('granted');
            } else {
              // Rejestracja błędnej próby
              const currentAttempts = this.attempts() + 1;
              this.attempts.set(currentAttempts);
              localStorage.setItem(this.STORAGE_KEY, currentAttempts.toString());

              // Decyzja czy zwykły błąd, czy trwała blokada
              if (currentAttempts >= this.MAX_ATTEMPTS) {
                this.status.set('sealed');
              } else {
                this.status.set('denied');
              }
            }
          }, 800);
        }
      }, step.delay);
    });
  }

  retry() {
    this.status.set('idle');
    this.accessKey.set('');
    this.validationLogs.set([]);
  }

  formatAttempts(num: number): string {
    return `0x${num} / 0x${this.MAX_ATTEMPTS}`;
  }
}