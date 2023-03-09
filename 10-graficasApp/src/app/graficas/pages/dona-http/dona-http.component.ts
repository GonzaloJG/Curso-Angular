import { Component, OnInit } from '@angular/core';
import { ChartData, ChartDataset, ChartType, Color } from 'chart.js';
import { GraficasService } from '../../services/graficas.service';

@Component({
  selector: 'app-dona-http',
  templateUrl: './dona-http.component.html',
  styles: [
  ]
})
export class DonaHttpComponent implements OnInit {

  public colors: Color[] = [
    '#FFB557',
    '#5167F5',
    '#1CE080'
 ];

   // Doughnut
   public doughnutChartLabels: string[] = [];
   public dataset: ChartDataset <"doughnut", number[]>[] = [];
   public doughnutChartData: ChartData<'doughnut'> = {
     labels: this.doughnutChartLabels,
     datasets: this.dataset
     
   };
   public doughnutChartType: ChartType = 'doughnut';



  constructor( private graficasService: GraficasService ) {

  }
  ngOnInit(): void {
    
    this.graficasService.getUsuariosRedesSocialesDonaData()
    .subscribe( ({ labels, values }) => {
      this.doughnutChartLabels = labels;
      this.doughnutChartData.datasets = [{ data: Object.values(values) }];
    })

  }

  

}
