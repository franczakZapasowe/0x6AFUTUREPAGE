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

  ngOnInit() {
    const part1 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
    const part2 = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    this.sessionHash.set(`0x${part1}${part2}`);
  }

  // Funkcja aktywująca całkowite odcięcie
  terminateConnection() {
    this.isTerminated.set(true);

    // 1. Wymuszenie trybu pełnoekranowego (najpierw, póki aplikacja jeszcze istnieje)
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(err => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    }

    // 2. Brutalne usunięcie całej aplikacji z drzewa DOM
    // To fizycznie niszczy wszystkie komponenty, zostawiając pustkę
    document.body.innerHTML = '';
    
    // 3. Ustawienie parametrów śmierci
    document.body.style.backgroundColor = '#000000';
    document.body.style.overflow = 'hidden';
    document.body.style.cursor = 'none';
  }
}