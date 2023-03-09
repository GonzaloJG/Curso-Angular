import { Injectable } from '@angular/core';
import { AnySourceData, LngLatBounds, LngLatLike, Map, Marker, Popup } from 'mapbox-gl';
import { Feature } from '../interfaces/places';

import { DirectionsApiClient } from '../api/directionsApiClient';
import { DirectionsResponse, Route } from '../interfaces/directions';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private _map?: Map;
  private _markers: Marker[] = [];
  
  get isMapReady() {
    return !!this._map;
  }

  constructor( private directionsApi: DirectionsApiClient ) {
    
  }


  setMap(map: Map) {
    this._map = map;
  }

  flyTo(coords: LngLatLike) {
    if (!this.isMapReady) throw Error('El mapa no está inicializado');

    this._map?.flyTo({
      zoom: 14,
      center: coords
    });
  }

  createMarkersFromPlaces( places: Feature[], userLocation: [number, number] ) {
    if ( !this._map ) throw Error('Mapa no inicializado');
    
    
    this._markers.forEach( marker => marker.remove());
    
    const newMarkers = [];
    
    for (const place of places) {
      const [lng, lat] = place.center;
      
      const popup = new Popup()
      .setHTML(`
      <h6> ${ place.text } </h6>
      <span>${ place.place_name }</span>
      `);
      
      const newMarker = new Marker()
      .setLngLat([lng, lat])
      .setPopup( popup )
      .addTo( this._map);
      
      newMarkers.push( newMarker );
    }
    
    this._markers = newMarkers;
    
    if ( places.length === 0 ) return ;

    // Limites del mapa
    const bounds = new LngLatBounds();
    newMarkers.forEach( marker => bounds.extend(marker.getLngLat()));
    bounds.extend(userLocation);

    this._map.fitBounds(bounds, {
      padding: 200
    });

  }


  getRouteBetweenPoints( start: [ number, number ], end: [ number, number ] ) {

    this.directionsApi.get<DirectionsResponse>(`/${ start.join(',') };${ end.join(',') } `)
      .subscribe(resp => this.drawPolyline(resp.routes[0]));

  }

  private drawPolyline(route: Route) {
    console.log ({ kms: route.distance / 1000,  duration: route.duration / 60});

    if ( !this._map ) throw Error('Mapa no inicializado');

    const coords = route.geometry.coordinates;
    const bounds = new LngLatBounds();

    coords.forEach( ([ lng, lat ]) => {
      bounds.extend( [ lng, lat ] )
    } );    

    this._map?.fitBounds( bounds, {
      padding: 200
    } );

    // Polyline
    const sourceData : AnySourceData = {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords
            }
          }
        ] 
      }
    }

    // Todo: limpiar ruta previa
    if (this._map.getLayer('RouteString')) {
      this._map.removeLayer('RouteString');
      this._map.removeSource('RouteString');
    }


    this._map.addSource('RouteString', sourceData);

    this._map.addLayer({
      id: 'RouteString',
      type: 'line',
      source: 'RouteString',
      layout: {
        "line-cap": 'round',
        "line-join": 'round'
      },
      paint: {
        "line-color": 'black',
        "line-width": 3
      }
    });


  }

  deletePolyLine(): void {
    this._map?.removeLayer('RouteString');
    this._map?.removeSource('RouteString');
    this._markers.forEach( marker => marker.remove());
  }

}
