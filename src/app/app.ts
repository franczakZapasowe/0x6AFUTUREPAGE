import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DecimalPipe } from '@angular/common';

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
    DecimalPipe,
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
  
  isWeekend = signal<boolean>(false);
  isShutDown = signal<boolean>(false);
  
  epochSync = signal<string>(''); 
  unixEpoch = signal<string>(''); 
  humanCountdown = signal<string>(''); 
  resumeProgress = signal<number>(0); 
  
  hexPulse = signal<boolean>(false);
  hexMatrixNodes = signal<string[]>(Array(9).fill('00'));
  
  private clockId: any;
  private msInterval: any;
  private heartbeatId: any;

  private audioCtx: AudioContext | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  ngOnInit() {
    this.checkShutdownTime();
    
    this.clockId = setInterval(() => {
      this.checkShutdownTime();
    }, 1000);
    
    this.startHighSpeedClock();

    window.addEventListener('click', () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }, { once: true });
  }

  private checkShutdownTime() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    const isWeekendTime = (day === 5 || day === 6 || day === 0);

    if (isWeekendTime) {
      if (!this.isWeekend()) {
        this.isWeekend.set(true);
        this.isShutDown.set(false);
        this.initAudioLayer();
        this.startDiagnosticHeartbeat();
      }
    } else {
      this.isWeekend.set(false);
      this.stopDiagnosticHeartbeat();
      this.stopAudioLayer();
      
      if (hour === 23) {
        if (!this.isShutDown()) {
          this.isShutDown.set(true);
        }
      } else {
        if (this.isShutDown()) {
          this.isShutDown.set(false);
        }
      }
    }
  }

  private startHighSpeedClock() {
    if (this.msInterval) clearInterval(this.msInterval);
    
    this.msInterval = setInterval(() => {
      const now = new Date();
      
      if (this.isWeekend()) {
        const epoch = (now.getTime() / 1000).toFixed(3);
        this.unixEpoch.set(epoch);

        const day = now.getDay();
        let daysToMonday = 0;
        let daysSinceFriday = 0;
        
        if (day === 5) { daysToMonday = 3; daysSinceFriday = 0; }
        else if (day === 6) { daysToMonday = 2; daysSinceFriday = 1; }
        else if (day === 0) { daysToMonday = 1; daysSinceFriday = 2; }
        
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);
        monday.setHours(0, 0, 0, 0); 
        const diff = monday.getTime() - now.getTime();
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        const ms = Math.floor(diff % 1000);
        
        this.humanCountdown.set(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
        );

        const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceFriday);
        friday.setHours(0, 0, 0, 0);
        const elapsed = now.getTime() - friday.getTime();
        const total = 72 * 60 * 60 * 1000;
        const progress = (elapsed / total) * 100;
        this.resumeProgress.set(progress);

      } 
      else if (this.isShutDown()) {
        const minutesLeft = 59 - now.getMinutes();
        const secondsLeft = 59 - now.getSeconds();
        const msLeft = 999 - now.getMilliseconds();
        this.epochSync.set(`00:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}.${String(msLeft).padStart(3, '0')}`);
      }
    }, 16);
  }

  private initAudioLayer() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.humOsc = this.audioCtx.createOscillator();
      this.humOsc.type = 'sine';
      this.humOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime); 
      this.humGain = this.audioCtx.createGain();
      this.humGain.gain.setValueAtTime(0.02, this.audioCtx.currentTime); 
      this.humOsc.connect(this.humGain);
      this.humGain.connect(this.audioCtx.destination);
      this.humOsc.start();
    } catch (e) {}
  }

  private stopAudioLayer() {
    if (this.humOsc) {
      this.humOsc.stop();
      this.humOsc.disconnect();
      this.humOsc = null;
    }
    if (this.humGain) {
      this.humGain.disconnect();
      this.humGain = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  private triggerMechanicalClick() {
    if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.015, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch (e) {}
  }

  private startDiagnosticHeartbeat() {
    if (this.heartbeatId) clearInterval(this.heartbeatId);
    this.heartbeatId = setInterval(() => {
      const newNodes = Array(9).fill(0).map(() => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
      );
      this.hexMatrixNodes.set(newNodes);
      this.triggerMechanicalClick();
      this.hexPulse.set(true);
      setTimeout(() => this.hexPulse.set(false), 100);
    }, 12000);
  }

  private stopDiagnosticHeartbeat() {
    if (this.heartbeatId) clearInterval(this.heartbeatId);
  }

  startBootSequence() {
    this.systemState.set('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() {
    if (this.clockId) clearInterval(this.clockId);
    if (this.msInterval) clearInterval(this.msInterval);
    this.stopDiagnosticHeartbeat();
    this.stopAudioLayer();
  }
}