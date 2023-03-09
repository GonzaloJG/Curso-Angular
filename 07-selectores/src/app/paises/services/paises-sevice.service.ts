import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pais, PaisSmall } from '../interfaces/paises.inteface';
import { combineLatest, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaisesSevice {

  private baseUrl: string = 'https://restcountries.com/v2';

  private _regiones: string[] = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

  get regiones(): string[] {
    return [...this._regiones];
  }

  constructor( private http: HttpClient ) {}

  getPaisesPorRegion( region: string ): Observable<PaisSmall[]>{

    const url: string = `${this.baseUrl}/region/${region}?fields=name,alpha3Code`;
    return this.http.get<PaisSmall[]>(url);
  }

  getPaisPorCodigo(codigo: string): Observable<Pais | null> {
    
    if ( !codigo )
      return of(null);

    const url = `${this.baseUrl}/alpha?codes=${codigo}`;
    return this.http.get<Pais>(url)
  }

  getPaisPorCodigoSmall(codigo: string): Observable<PaisSmall> {

    const url = `${this.baseUrl}/alpha?codes=${codigo}&fields=name,alpha3Code`;
    return this.http.get<PaisSmall>(url)
  }

  getPaisesPorCodigos(borders: string[]): Observable<PaisSmall[]> {

    if (!borders)
      return of([]);

    const peticiones: Observable<PaisSmall>[] = [];

    borders.forEach( codigo => {
      const peticion = this.getPaisPorCodigoSmall(codigo);
      peticiones.push(peticion);
    } );

    return combineLatest( peticiones );

  }

}
