import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FinanceService } from '@core/services/finance.service';
import { NetWorthData } from '@core/models/finance.model';
import ApexCharts from 'apexcharts';

/**
 * Finance Dashboard Component
 *
 * Displays net worth over time with ApexCharts visualization,
 * current net worth, and breakdown of assets vs liabilities.
 */
@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class FinanceDashboardComponent implements OnInit {
  private financeService = inject(FinanceService);
  private router = inject(Router);
  private chart: ApexCharts | null = null;

  // State
  netWorthHistory = signal<NetWorthData[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Current net worth (most recent)
  currentNetWorth = signal<NetWorthData | null>(null);

  ngOnInit(): void {
    this.loadNetWorthData();
  }

  loadNetWorthData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.financeService.getNetWorthHistory().subscribe({
      next: (data) => {
        this.netWorthHistory.set(data);
        if (data.length > 0) {
          // Most recent is the last item (sorted by date ascending)
          this.currentNetWorth.set(data[data.length - 1]);
        }
        this.loading.set(false);
        this.renderChart();
      },
      error: (err) => {
        console.error('Failed to load net worth data:', err);
        this.error.set(err.message || 'Failed to load net worth data');
        this.loading.set(false);
      },
    });
  }

  renderChart(): void {
    const data = this.netWorthHistory();
    if (data.length === 0) {
      return;
    }

    // Prepare data for chart
    const dates = data.map((d) => new Date(d.date).getTime());
    const netWorthValues = data.map((d) => Number(d.netWorth));
    const assetsValues = data.map((d) => Number(d.totalAssets));
    const liabilitiesValues = data.map((d) => Number(d.totalLiabilities));

    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'line',
        height: 400,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        animations: {
          enabled: true,
          speed: 800,
        },
      },
      series: [
        {
          name: 'Net Worth',
          data: netWorthValues,
          color: '#8b5cf6', // Purple
        },
        {
          name: 'Assets',
          data: assetsValues,
          color: '#3b82f6', // Blue
        },
        {
          name: 'Liabilities',
          data: liabilitiesValues,
          color: '#ef4444', // Red
        },
      ],
      xaxis: {
        type: 'datetime',
        categories: dates,
        labels: {
          datetimeUTC: false,
          format: 'MMM yyyy',
        },
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return this.formatCurrencyShort(value);
          },
        },
      },
      stroke: {
        width: 3,
        curve: 'smooth',
      },
      markers: {
        size: 5,
      },
      tooltip: {
        x: {
          format: 'MMM dd, yyyy',
        },
        y: {
          formatter: (value) => {
            return this.formatCurrency(value);
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '14px',
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4,
      },
    };

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Render new chart
    const chartElement = document.querySelector('#networth-chart');
    if (chartElement) {
      this.chart = new ApexCharts(chartElement, options);
      this.chart.render();
    }
  }

  getQoQGrowth(): string {
    const data = this.netWorthHistory();
    if (data.length < 2) {
      return 'N/A';
    }

    const current = Number(data[data.length - 1].netWorth);
    const previous = Number(data[data.length - 2].netWorth);
    const growth = ((current - previous) / Math.abs(previous)) * 100;

    return growth > 0 ? `+${growth.toFixed(2)}%` : `${growth.toFixed(2)}%`;
  }

  getQoQGrowthClass(): string {
    const data = this.netWorthHistory();
    if (data.length < 2) {
      return 'text-gray-600';
    }

    const current = Number(data[data.length - 1].netWorth);
    const previous = Number(data[data.length - 2].netWorth);

    return current >= previous ? 'text-green-600' : 'text-red-600';
  }

  manageAccounts(): void {
    this.router.navigate(['/finance/accounts']);
  }

  enterBalances(): void {
    this.router.navigate(['/finance/balance-entry']);
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  formatCurrencyShort(amount: number): string {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  }

  dismissError(): void {
    this.error.set(null);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
