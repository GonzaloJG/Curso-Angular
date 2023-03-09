import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import Mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"
 
Mapboxgl.accessToken = 'pk.eyJ1IjoiZ29uemFsbzk2IiwiYSI6ImNsZXNjY2Q2MjExNW00OXAyZnFsY2M3OWcifQ.510-nP-JG7T5wCb8hkG6Vw';


// if ( navigator.geolocation ){
//   alert('Navegador no soporta la Geolocation');
//   throw new Error('Navegador no soporta la Geolocation');
// }

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
