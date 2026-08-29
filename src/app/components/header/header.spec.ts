import { Component, signal, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Stan systemu jako sygnały
  latency = signal(0.12);
  private intervalId: any;

  ngOnInit() {
    // Prosta symulacja skaczącego pingu co 2 sekundy
    this.intervalId = setInterval(() => {
      const randomFluctuation = (Math.random() * 0.05 - 0.02);
      this.latency.update(val => Number((val + randomFluctuation).toFixed(2)));
    }, 2000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}