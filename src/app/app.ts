import { Component, signal } from '@angular/core';
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
    CapitalProjection
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Tylko dwa stany: zablokowany ekran początkowy i aktywna strona
  systemState = signal<'locked' | 'active'>('locked');

  startBootSequence() {
    // Po wciśnięciu Enter natychmiast włączamy całą stronę
    this.systemState.set('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}