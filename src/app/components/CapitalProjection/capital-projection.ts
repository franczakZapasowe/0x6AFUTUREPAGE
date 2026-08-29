import { Component } from '@angular/core';

@Component({
  selector: 'app-capital-projection',
  standalone: true,
  templateUrl: './capital-projection.html',
  styleUrl: './capital-projection.css'
})
export class CapitalProjection {
  // Ten komponent jest w 100% statycznym, nieinteraktywnym odczytem
  // (read-only snapshot). Cała struktura jest zdefiniowana w widoku.
}