import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FinanceService } from '@core/services/finance.service';
import {
  Account,
  Liability,
  BulkBalanceEntry,
  NetWorthData,
} from '@core/models/finance.model';

/**
 * Balance Entry Component
 *
 * Allows users to enter balance data for all accounts and liabilities
 * for a specific date (typically quarterly). Shows previous balance for
 * comparison and provides real-time net worth preview.
 */
@Component({
  selector: 'app-balance-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-entry.component.html',
  styleUrl: './balance-entry.component.css',
})
export class BalanceEntryComponent implements OnInit {
  private financeService = inject(FinanceService);
  private router = inject(Router);

  // State
  accounts = signal<Account[]>([]);
  liabilities = signal<Liability[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form state
  selectedDate = signal<string>(this.getDefaultQuarterDate());
  balanceEntries = signal<Map<string, number>>(new Map());
  note = signal<string>('');

  // Computed values
  totalAccounts = computed(() => {
    let total = 0;
    this.accounts().forEach((acc) => {
      const balance = this.balanceEntries().get(`account-${acc.id}`);
      if (balance !== undefined && !isNaN(balance)) {
        total += balance;
      }
    });
    return total;
  });

  totalLiabilities = computed(() => {
    let total = 0;
    this.liabilities().forEach((liab) => {
      const balance = this.balanceEntries().get(`liability-${liab.id}`);
      if (balance !== undefined && !isNaN(balance)) {
        total += balance;
      }
    });
    return total;
  });

  netWorth = computed(() => this.totalAccounts() - this.totalLiabilities());

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load both accounts and liabilities
    this.financeService.getAccounts(false).subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loadLiabilities();
      },
      error: (err) => {
        console.error('Failed to load accounts:', err);
        this.error.set(err.message || 'Failed to load accounts');
        this.loading.set(false);
      },
    });
  }

  private loadLiabilities(): void {
    this.financeService.getLiabilities(false).subscribe({
      next: (liabilities) => {
        this.liabilities.set(liabilities);
        this.loadExistingBalances();
      },
      error: (err) => {
        console.error('Failed to load liabilities:', err);
        this.error.set(err.message || 'Failed to load liabilities');
        this.loading.set(false);
      },
    });
  }

  private loadExistingBalances(): void {
    const date = this.selectedDate();
    this.financeService.getBalancesForDate(date).subscribe({
      next: (data) => {
        // Populate form with existing balances if they exist
        const entries = new Map<string, number>();
        data.accounts.forEach((balance) => {
          if (balance.accountId && balance.amount !== undefined) {
            entries.set(`account-${balance.accountId}`, Number(balance.amount));
          }
        });
        data.liabilities.forEach((balance) => {
          if (balance.liabilityId && balance.amount !== undefined) {
            entries.set(`liability-${balance.liabilityId}`, Number(balance.amount));
          }
        });
        this.balanceEntries.set(entries);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load existing balances:', err);
        // Don't show error - it's ok if no balances exist yet
        this.loading.set(false);
      },
    });
  }

  onDateChange(newDate: string): void {
    this.selectedDate.set(newDate);
    this.loadExistingBalances();
  }

  setQuarterlyDate(quarter: number): void {
    const year = new Date().getFullYear();
    const dates = [
      `${year}-03-31`, // Q1
      `${year}-06-30`, // Q2
      `${year}-09-30`, // Q3
      `${year}-12-31`, // Q4
    ];
    this.onDateChange(dates[quarter - 1]);
  }

  updateBalance(key: string, value: string): void {
    const entries = new Map(this.balanceEntries());
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      entries.set(key, numValue);
    } else {
      entries.delete(key);
    }
    this.balanceEntries.set(entries);
  }

  getBalance(key: string): number | undefined {
    return this.balanceEntries().get(key);
  }

  getPreviousBalance(item: Account | Liability): number | null {
    if (!item.balances || item.balances.length === 0) {
      return null;
    }
    // Get most recent balance
    const sorted = [...item.balances].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return Number(sorted[0].amount);
  }

  saveBalances(): void {
    this.saving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const entries = this.balanceEntries();
    const balances: BulkBalanceEntry[] = [];

    // Convert map to array format
    entries.forEach((amount, key) => {
      const [type, id] = key.split('-');
      if (type === 'account') {
        balances.push({ accountId: id, amount });
      } else if (type === 'liability') {
        balances.push({ liabilityId: id, amount });
      }
    });

    if (balances.length === 0) {
      this.error.set('Please enter at least one balance');
      this.saving.set(false);
      return;
    }

    // Convert date to ISO datetime format (backend expects datetime, not just date)
    const dateStr = this.selectedDate();
    const dateTime = new Date(dateStr + 'T00:00:00.000Z').toISOString();

    const request = {
      date: dateTime,
      balances,
      note: this.note() || undefined,
    };

    this.financeService.bulkUpdateBalances(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set(
          `Successfully saved ${balances.length} balance${balances.length > 1 ? 's' : ''} for ${this.formatDate(this.selectedDate())}`
        );
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Clear message after 5 seconds
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        console.error('Failed to save balances:', err);
        this.error.set(err.message || 'Failed to save balances');
        this.saving.set(false);
      },
    });
  }

  viewDashboard(): void {
    this.router.navigate(['/finance/dashboard']);
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '-';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private getDefaultQuarterDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // Determine current quarter
    if (month < 3) return `${year}-03-31`; // Q1
    if (month < 6) return `${year}-06-30`; // Q2
    if (month < 9) return `${year}-09-30`; // Q3
    return `${year}-12-31`; // Q4
  }

  dismissError(): void {
    this.error.set(null);
  }

  dismissSuccess(): void {
    this.successMessage.set(null);
  }
}
