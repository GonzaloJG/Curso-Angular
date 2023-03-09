import { Component } from '@angular/core';
import { ChartData, ChartType, Color } from 'chart.js';
import { baseColors } from 'ng2-charts';

@Component({
  selector: 'app-dona',
  templateUrl: './dona.component.html',
  styles: [
  ]
})
export class DonaComponent {

  public colors: Color[] = [
    '#FFB557',
    '#5167F5',
    '#1CE080'
 ];

   // Doughnut
   public doughnutChartLabels: string[] = [ 'Download Sales', 'In-Store Sales', 'Mail-Order Sales' ];
   public doughnutChartData: ChartData<'doughnut'> = {
     labels: this.doughnutChartLabels,
     datasets: [
       { data: [ 350, 450, 100 ], backgroundColor: this.colors }
     ]
     
   };
   public doughnutChartType: ChartType = 'doughnut';

}
