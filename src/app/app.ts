import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './components/header/header';
import { HeroTerminal } from './components/hero-terminal/hero-terminal';
import { Architecture } from './components/architecture/architecture';
import { MetricsFeed } from './components/metrics-feed/metrics-feed';
import { AccessProtocol } from './components/access-protocol/access-protocol';
import { Footer } from './components/footer/footer';
import { Observatory } from './components/observatory/observatory';
import { ArtifactDisplay } from './components/artifact-display/artifact-display';
import { LiveStream } from './components/live-stream/live-stream';
import { CapitalProjection } from './components/CapitalProjection/capital-projection';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    Header, 
    HeroTerminal, 
    Architecture, 
    MetricsFeed, 
    AccessProtocol, 
    Footer,
    Observatory,
    ArtifactDisplay,
    LiveStream,
    CapitalProjection,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  systemState = signal<'locked' | 'active'>('locked');
  isShutDown = signal<boolean>(false);
  epochSync = signal<string>('');
  
  private clockId: any;
  private msInterval: any;

  ngOnInit() {
    this.checkShutdownTime();
    
    this.clockId = setInterval(() => {
      this.checkShutdownTime();
    }, 1000);
  }

  private checkShutdownTime() {
    const hour = new Date().getHours();
    
    // Zwraca true wyłącznie między 23:00 a 23:59
    if (hour === 23) {
      if (!this.isShutDown()) {
        this.isShutDown.set(true);
        this.startEpochSync(); 
      }
    } else {
      if (this.isShutDown()) {
        this.isShutDown.set(false);
        this.stopEpochSync();
      }
    }
  }

  private startEpochSync() {
    this.msInterval = setInterval(() => {
      const now = new Date();
      
      const minutesLeft = 59 - now.getMinutes();
      const secondsLeft = 59 - now.getSeconds();
      const msLeft = 999 - now.getMilliseconds();
      
      const h = '00';
      const m = String(minutesLeft).padStart(2, '0');
      const s = String(secondsLeft).padStart(2, '0');
      const ms = String(msLeft).padStart(3, '0');
      
      this.epochSync.set(`${h}:${m}:${s}.${ms}`);
    }, 16); // Odświeżanie ~60fps dla płynności
  }

  private stopEpochSync() {
    if (this.msInterval) {
      clearInterval(this.msInterval);
      this.msInterval = null;
    }
  }

  startBootSequence() {
    this.systemState.set('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() {
    if (this.clockId) clearInterval(this.clockId);
    this.stopEpochSync();
  }
}