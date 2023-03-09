import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-basicos',
  templateUrl: './basicos.component.html',
  styles: [
  ]
})
export class BasicosComponent {

  @ViewChild('miFormulario') miFormulario!: NgForm;

  initForm = {
    producto: 'RTX 4080',
    precio: 0,
    existencias: 10
  }

  nombreValido(): boolean {
    // return this.miFormulario?.controls['producto']?.invalid && 
    //        this.miFormulario?.controls['producto']?.touched;
    return false;
  }

  precioValido(): boolean {
    // return this.miFormulario?.controls['precio']?.value > 0 &&
    //        this.miFormulario?.controls['precio']?.touched;
    return false;
  }

  //      miFormulario: NgForm
  guardar() {
    // console.log(this.miFormulario);
    console.log('Posteo correcto');

    this.miFormulario.resetForm({
      producto: 'Algo',
      precio: 0,
      existencias: 0
    });

  }

}
