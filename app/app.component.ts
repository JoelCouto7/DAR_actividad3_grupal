// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeolocalizacionComponent } from './components/geolocalizacion/geolocalizacion.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GeolocalizacionComponent
  ],
  template: `
    <div class="container">
      <h1>Buscasofa</h1>
      <!-- El componente Geolocalizacion emitirá las coordenadas obtenidas -->
      <app-geolocalizacion (coordenadasObtenidas)="recibirCoordenadas($event)"></app-geolocalizacion>

      <div *ngIf="coordenadas" class="coordenadas-info">
        <h2>Coordenadas recibidas</h2>
        <p><strong>Latitud:</strong> {{ coordenadas.lat }}</p>
        <p><strong>Longitud:</strong> {{ coordenadas.lon }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    .coordenadas-info {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f1f1f1;
    }
  `]
})
export class AppComponent {
  coordenadas: { lat: number, lon: number } | null = null;

  recibirCoordenadas(event: { lat: number, lon: number }): void {
    console.log('Coordenadas recibidas:', event);
    this.coordenadas = event;
  }
}
