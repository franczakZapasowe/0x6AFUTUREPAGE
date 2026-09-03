import { Component, signal, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit {
  sessionHash = signal('');
  isTerminated = signal(false);
  
  // Sygnał dla dynamicznej lokalizacji
  routingNode = signal('LOCATING...');

  ngOnInit() {
    // Generowanie hash sesji
    const part1 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
    const part2 = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    this.sessionHash.set(`0x${part1}${part2}`);

    // Pobieranie lokalizacji użytkownika
    this.fetchClientLocation();
  }

  // Funkcja odpytująca darmowe API o miasto
  private async fetchClientLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        const city = data.city ? data.city.toUpperCase() : 'UNKNOWN';
        const country = data.country_code ? data.country_code.toUpperCase() : 'XX';
        
        // Zastępujemy spacje podkreślnikami, żeby utrzymać surowy format
        const formattedCity = city.replace(/\s+/g, '_');
        this.routingNode.set(`${formattedCity}_${country}`);
      } else {
        this.routingNode.set('NODE_UNREACHABLE');
      }
    } catch (error) {
      // W przypadku blokady przez adblocka lub braku neta
      this.routingNode.set('SECURE_PROXY_ACTIVE');
    }
  }

  terminateConnection() {
    this.isTerminated.set(true);

    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    }

    document.body.innerHTML = '';
    
    document.body.style.backgroundColor = '#000000';
    document.body.style.overflow = 'hidden';
    document.body.style.cursor = 'none';
  }
}