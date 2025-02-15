// src/app/components/geolocalizacion/geolocalizacion.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';       // Para *ngIf, *ngFor, etc.
import { FormsModule } from '@angular/forms';           // Para [(ngModel)]
import { HttpClientModule, HttpClient } from '@angular/common/http'; // Para las peticiones HTTP

// Interfaz para representar una estación con sus datos, precios y horario.
interface Estacion {
  lat: number;
  lon: number;
  distancia: number;
  fuels: { [fuel: string]: number | null };
  horario: string;
}

@Component({
  selector: 'app-geolocalizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="geolocalizacion">
      <p>Aclaración: Los campos se rellenan con las coordenadas obtenidas a partir de tu IP (o mediante la API de geolocalización del navegador si está disponible).</p>
      <label>Latitud:</label><br>
      <input type="number" [(ngModel)]="latitud" name="latitud"><br>
      <label>Longitud:</label><br>
      <input type="number" [(ngModel)]="longitud" name="longitud"><br><br>

      <!-- Sección para seleccionar los combustibles a mostrar -->
      <div class="fuel-selection">
        <h4>Seleccione los combustibles a mostrar:</h4>
        <div *ngFor="let fuel of availableFuels">
          <label>
            <input
              type="checkbox"
              [value]="fuel"
              (change)="toggleFuel(fuel, $event)"
              [checked]="selectedFuels.includes(fuel)"
            />
            {{ fuel }}
          </label>
        </div>
      </div>
      <br>

      <button (click)="buscarEstaciones()">Buscar las 10 gasolineras más cercanas</button>
      <button (click)="obtenerGeolocalizacion()">Obtener mi geolocalización</button>

      <!-- Sección para ordenar por combustible -->
      <div class="sort-filter" *ngIf="estaciones.length > 0">
        <label>Ordenar por combustible:</label>
        <select [(ngModel)]="selectedSortFuel">
          <option *ngFor="let fuel of selectedFuels" [value]="fuel">{{ fuel }}</option>
        </select>
        <button (click)="ordenarPorCombustible()">Ordenar</button>
      </div>

      <div *ngIf="estaciones.length > 0">
        <h3>Gasolineras cercanas (Top 10)</h3>
        <table>
          <thead>
          <tr>
            <th>Latitud</th>
            <th>Longitud</th>
            <th>Distancia (km)</th>
            <th>Horario</th>
            <!-- Se generan columnas dinámicamente para cada combustible seleccionado -->
            <th *ngFor="let fuel of selectedFuels">{{ fuel }}</th>
            <th>Acciones</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let estacion of estaciones">
            <td>{{ estacion.lat }}</td>
            <td>{{ estacion.lon }}</td>
            <td>
              <a [href]="'https://www.google.com/maps/search/?api=1&query=' + estacion.lat + ',' + estacion.lon" target="_blank">
                {{ estacion.distancia | number:'1.2-2' }}
              </a>
            </td>
            <!-- Nueva columna para mostrar el horario -->
            <td>{{ estacion.horario }}</td>
            <td *ngFor="let fuel of selectedFuels">
              {{ estacion.fuels[fuel] !== null ? (estacion.fuels[fuel] | number:'1.3-3') : 'N/D' }}
            </td>
            <td>
              <button (click)="openInMaps(estacion.lat, estacion.lon)">Ver en Maps</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .geolocalizacion {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f9f9f9;
      margin-bottom: 20px;
    }
    .fuel-selection, .sort-filter {
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #eee;
    }
    table {
      margin-top: 10px;
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px;
      text-align: center;
      border: 1px solid #ddd;
    }
  `]
})
export class GeolocalizacionComponent implements OnInit {
  latitud: number = 0;
  longitud: number = 0;
  estaciones: Estacion[] = [];
  @Output() coordenadasObtenidas = new EventEmitter<{ lat: number, lon: number }>();

  availableFuels: string[] = ['Gasolina 95', 'Gasolina 98', 'Gasóleo A', 'Gasóleo B'];
  selectedFuels: string[] = ['Gasolina 95', 'Gasolina 98'];
  selectedSortFuel: string = 'Gasolina 95';
  fuelMappings: { [fuel: string]: string[] } = {
    'Gasolina 95': ['Precio Gasolina 95 E5', 'Precio Gasolina 95 E10'],
    'Gasolina 98': ['Precio Gasolina 98 E5', 'Precio Gasolina 98 E10'],
    'Gasóleo A': ['Precio Gasoleo A'],
    'Gasóleo B': ['Precio Gasoleo B']
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.obtenerGeolocalizacion();
  }

  obtenerGeolocalizacion(): void {
    // Se usa la API de geolocalización nativa para mayor precisión.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitud = position.coords.latitude;
          this.longitud = position.coords.longitude;
          this.coordenadasObtenidas.emit({ lat: this.latitud, lon: this.longitud });
        },
        (error) => {
          console.error('Error al obtener la geolocalización mediante navigator:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.error('La geolocalización no es soportada por este navegador.');
    }
  }

  /**
   * Calcula la distancia en kilómetros entre dos puntos usando la fórmula del Haversine.
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number): number => value * Math.PI / 180;
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Consulta la API de Estaciones de Carburantes, filtra las 10 estaciones más cercanas,
   * extrae para cada estación los precios de los combustibles y el horario, y lo almacena en 'estaciones'.
   */
  buscarEstaciones(): void {
    const apiUrl = `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/`;
    this.http.get<any>(apiUrl).subscribe(
      response => {
        console.log('Respuesta de la API:', response);
        let datos: any[] = [];
        if (Array.isArray(response)) {
          datos = response;
        } else if (response && Array.isArray(response.ListaEESSPrecio)) {
          datos = response.ListaEESSPrecio;
        } else {
          console.error("Formato JSON inesperado:", response);
          return;
        }

        const listaEstaciones: Estacion[] = [];
        datos.forEach((item, index) => {
          const latText = item["Latitud"];
          const lonText = item["Longitud (WGS84)"];
          const horarioText = item["Horario"] || "";
          console.log(`Elemento ${index}: latText = ${latText}, lonText = ${lonText}, Horario = ${horarioText}`);
          if (latText && lonText) {
            const latValue = latText.replace(',', '.');
            const lonValue = lonText.replace(',', '.');
            const lat = parseFloat(latValue);
            const lon = parseFloat(lonValue);
            if (!isNaN(lat) && !isNaN(lon)) {
              const distancia = this.haversineDistance(this.latitud, this.longitud, lat, lon);
              const fuels: { [fuel: string]: number | null } = {};
              for (const fuel of this.availableFuels) {
                let valor: number | null = null;
                const keys = this.fuelMappings[fuel];
                if (keys) {
                  for (const key of keys) {
                    const fuelText = item[key];
                    if (fuelText && fuelText.trim() !== "") {
                      valor = parseFloat(fuelText.replace(',', '.'));
                      break;
                    }
                  }
                }
                fuels[fuel] = valor;
              }
              listaEstaciones.push({ lat, lon, distancia, fuels, horario: horarioText });
            } else {
              console.warn(`Error al parsear las coordenadas en el elemento ${index}:`, latValue, lonValue);
            }
          } else {
            console.warn(`Elemento ${index} incompleto:`, item);
          }
        });
        console.log('Lista de estaciones filtradas:', listaEstaciones);
        listaEstaciones.sort((a, b) => a.distancia - b.distancia);
        this.estaciones = listaEstaciones.slice(0, 10);
        console.log('Las 10 gasolineras más cercanas:', this.estaciones);
      },
      error => {
        console.error('Error al consultar la API de carburantes:', error);
      }
    );
  }

  /**
   * Ordena la lista de estaciones según el precio del combustible seleccionado.
   * Si el precio es null, se considera Infinity para que se ordene al final.
   */
  ordenarPorCombustible(): void {
    if (!this.selectedSortFuel) {
      console.warn('No se ha seleccionado un combustible para ordenar.');
      return;
    }
    this.estaciones.sort((a, b) => {
      const priceA = a.fuels[this.selectedSortFuel] ?? Infinity;
      const priceB = b.fuels[this.selectedSortFuel] ?? Infinity;
      return priceA - priceB;
    });
  }

  /**
   * Abre la ubicación de la gasolinera en Google Maps en una nueva pestaña.
   */
  openInMaps(lat: number, lon: number): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, '_blank');
  }

  /**
   * Alterna la selección de un combustible para mostrar en la tabla.
   */
  toggleFuel(fuel: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedFuels.includes(fuel)) {
        this.selectedFuels.push(fuel);
      }
    } else {
      this.selectedFuels = this.selectedFuels.filter(f => f !== fuel);
    }
  }
}
