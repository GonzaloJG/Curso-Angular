import { Component } from '@angular/core';
import { interval } from 'rxjs';

@Component({
  selector: 'app-no-comunes',
  templateUrl: './no-comunes.component.html',
  styles: [
  ]
})
export class NoComunesComponent {

  //i18NSelect
  nombre: string = 'Fernando';
  genero: string = 'masculino';
  invitacionMapa = {
    'masculino': 'invitarlo',
    'femenino': 'invitarla'
  }

  //i18NPlural
  clientes: string[] = ['Maria', 'Pedro', 'Juan', 'Hernando', 'Eduardo', 'Fernando'];
  clientesMapa = {
    '=0': 'no tenemos ningún cliente esperando.',
    '=1': 'tenemos un cliente esperando.',
    '=2': 'tenemos 2 clientes esperando.',
    'other': 'tenemos # clientes esperando.'
  }

  cambiarCliente() {
    this.nombre = 'Maria';
    this.genero = 'femenino';
  }

  borrarCliente() {
    this.clientes.pop();
  }


  //KeyValue Pipe

  persona = {
    nombre: "Fernando",
    edad: 35,
    direccion: 'Ottawa, Canadá'
  }

  //JSON Pipe
  heroes = [
  {
    nombre: 'Superman',
    vuela: true
  },
  {
    nombre: 'Robin',
    vuela: false
  },
  {
    nombre: 'Aquaman',
    vuela: false
  }
]


// Async Pipe
miObservable = interval(1000); //0,1,2,3,4,5,6,...

valorPromesa = new Promise( (resolve, reject) => {

  setTimeout(() => {
    resolve('Tenemos data de promesa');
  }, 3500 );
});

}
