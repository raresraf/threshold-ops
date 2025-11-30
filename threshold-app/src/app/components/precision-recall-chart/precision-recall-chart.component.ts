import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { CalculationResults } from '../../logic/model';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-precision-recall-chart',
  templateUrl: './precision-recall-chart.component.html',
  styleUrls: ['./precision-recall-chart.component.css'],
  standalone: true,
  imports: [BaseChartDirective, CommonModule],
})
export class PrecisionRecallChartComponent implements OnChanges {
  @Input() results: CalculationResults | null = null;
  @Input() budget: number = 0;

  public data: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Estimated Cost Function Φ(θ)',
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1,
      }
    ]
  };

  public options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Estimated Review Cost vs. Detection Threshold',
        font: {
            family: "'Times New Roman', Times, serif",
            size: 18,
            weight: 'normal',
        }
      },
      annotation: {
        annotations: {}
      }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Detection Threshold (θ)'
            }
        },
        y: {
            title: {
                display: true,
                text: 'Estimated Cost (minutes)'
            },
        }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['results'] && this.results) || changes['budget']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.results) return;

    const newLabels: (string | null)[] = [];
    const newPhiData: (number | null)[] = [];
    const gapThreshold = 0.2;

    for (let i = 0; i < this.results.phiValues.length; i++) {
      const currentPoint = this.results.phiValues[i];

      if (i > 0) {
        const prevPoint = this.results.phiValues[i - 1];
        if (currentPoint.theta - prevPoint.theta > gapThreshold) {
          newLabels.push('...');
          newPhiData.push(null);
        }
      }

      newLabels.push(currentPoint.theta.toFixed(2));
      newPhiData.push(currentPoint.phi);
    }
    
    this.data = {
      labels: newLabels as string[],
      datasets: [{ ...this.data.datasets[0], data: newPhiData }]
    };

    const { optimalTheta, cost } = this.results;
    const optimalThetaLabel = optimalTheta ? optimalTheta.theta.toFixed(2) : '';
    const optimalThetaIndex = newLabels.indexOf(optimalThetaLabel);

    this.options = {
      ...this.options,
      plugins: {
        ...this.options.plugins,
        annotation: {
          annotations: {
            budgetLine: {
              type: 'line',
              yMin: this.budget,
              yMax: this.budget,
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 2,
              borderDash: [10, 5],
              label: {
                content: `Budget (${this.budget.toLocaleString()} min)`,
                display: true,
                position: 'end',
                backgroundColor: 'rgba(255, 99, 132, 0.8)'
              }
            },
            ...(optimalTheta && optimalThetaIndex !== -1 && {
              optimalPoint: {
                  type: 'point',
                  xValue: optimalThetaIndex,
                  yValue: cost,
                  backgroundColor: 'rgb(75, 192, 192)',
                  radius: 6,
              },
              optimalLabel: {
                  type: 'label',
                  xValue: optimalThetaIndex,
                  yValue: cost,
                  content: `Optimal θ = ${optimalTheta.theta.toFixed(2)}`,
                  font: {
                      size: 12,
                      weight: 'bold',
                  },
                  position: 'end',
                  xAdjust: 10,
                  yAdjust: -10,
                  display: true,
              }
            })
          }
        }
      }
    };
  }
}
