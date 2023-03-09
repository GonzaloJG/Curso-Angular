import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { enviroment } from 'src/enviroments/enviroment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    (mapboxgl as any).accessToken = enviroment.mapboxToken;
  }

}
