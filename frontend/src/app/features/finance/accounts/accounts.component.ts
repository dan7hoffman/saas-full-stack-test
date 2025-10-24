import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { Account, Liability, AccountType, LiabilityType } from '../../../core/models/finance.model';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css'],
})
export class AccountsComponent implements OnInit {
  // State
  accounts = signal<Account[]>([]);
  liabilities = signal<Liability[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Modal state
  showAccountModal = signal(false);
  showLiabilityModal = signal(false);
  editingAccount = signal<Account | null>(null);
  editingLiability = signal<Liability | null>(null);

  // Form data
  accountForm = {
    name: '',
    type: 'CHECKING' as AccountType,
    institution: '',
    accountNumber: '',
  };

  liabilityForm = {
    name: '',
    type: 'CREDIT_CARD' as LiabilityType,
    institution: '',
    accountNumber: '',
    interestRate: null as number | null,
    minimumPayment: null as number | null,
    dueDate: null as number | null,
  };

  // Type options
  accountTypes: AccountType[] = ['CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'PROPERTY', 'VEHICLE', 'CRYPTO', 'OTHER'];
  liabilityTypes: LiabilityType[] = ['CREDIT_CARD', 'STUDENT_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'PERSONAL_LOAN', 'OTHER'];

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    Promise.all([
      this.financeService.getAccounts().toPromise(),
      this.financeService.getLiabilities().toPromise(),
    ])
      .then(([accounts, liabilities]) => {
        this.accounts.set(accounts || []);
        this.liabilities.set(liabilities || []);
        this.loading.set(false);
      })
      .catch((err) => {
        this.error.set(err.message || 'Failed to load data');
        this.loading.set(false);
      });
  }

  // Account methods
  openAccountModal(account?: Account): void {
    if (account) {
      this.editingAccount.set(account);
      this.accountForm = {
        name: account.name,
        type: account.type,
        institution: account.institution || '',
        accountNumber: account.accountNumber || '',
      };
    } else {
      this.editingAccount.set(null);
      this.resetAccountForm();
    }
    this.showAccountModal.set(true);
  }

  closeAccountModal(): void {
    this.showAccountModal.set(false);
    this.editingAccount.set(null);
    this.resetAccountForm();
  }

  resetAccountForm(): void {
    this.accountForm = {
      name: '',
      type: 'CHECKING',
      institution: '',
      accountNumber: '',
    };
  }

  saveAccount(): void {
    const data = {
      name: this.accountForm.name,
      type: this.accountForm.type,
      institution: this.accountForm.institution || undefined,
      accountNumber: this.accountForm.accountNumber || undefined,
    };

    const editing = this.editingAccount();
    const operation = editing
      ? this.financeService.updateAccount(editing.id, data)
      : this.financeService.createAccount(data);

    operation.subscribe({
      next: () => {
        this.closeAccountModal();
        this.loadData();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to save account');
      },
    });
  }

  deleteAccount(account: Account): void {
    if (!confirm(`Are you sure you want to archive "${account.name}"?`)) {
      return;
    }

    this.financeService.deleteAccount(account.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to delete account');
      },
    });
  }

  // Liability methods
  openLiabilityModal(liability?: Liability): void {
    if (liability) {
      this.editingLiability.set(liability);
      this.liabilityForm = {
        name: liability.name,
        type: liability.type,
        institution: liability.institution || '',
        accountNumber: liability.accountNumber || '',
        interestRate: liability.interestRate || null,
        minimumPayment: liability.minimumPayment || null,
        dueDate: liability.dueDate || null,
      };
    } else {
      this.editingLiability.set(null);
      this.resetLiabilityForm();
    }
    this.showLiabilityModal.set(true);
  }

  closeLiabilityModal(): void {
    this.showLiabilityModal.set(false);
    this.editingLiability.set(null);
    this.resetLiabilityForm();
  }

  resetLiabilityForm(): void {
    this.liabilityForm = {
      name: '',
      type: 'CREDIT_CARD',
      institution: '',
      accountNumber: '',
      interestRate: null,
      minimumPayment: null,
      dueDate: null,
    };
  }

  saveLiability(): void {
    const data = {
      name: this.liabilityForm.name,
      type: this.liabilityForm.type,
      institution: this.liabilityForm.institution || undefined,
      accountNumber: this.liabilityForm.accountNumber || undefined,
      interestRate: this.liabilityForm.interestRate || undefined,
      minimumPayment: this.liabilityForm.minimumPayment || undefined,
      dueDate: this.liabilityForm.dueDate || undefined,
    };

    const editing = this.editingLiability();
    const operation = editing
      ? this.financeService.updateLiability(editing.id, data)
      : this.financeService.createLiability(data);

    operation.subscribe({
      next: () => {
        this.closeLiabilityModal();
        this.loadData();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to save liability');
      },
    });
  }

  deleteLiability(liability: Liability): void {
    if (!confirm(`Are you sure you want to archive "${liability.name}"?`)) {
      return;
    }

    this.financeService.deleteLiability(liability.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to delete liability');
      },
    });
  }

  // Utility methods
  formatAccountType(type: AccountType): string {
    return type.replace('_', ' ');
  }

  formatLiabilityType(type: LiabilityType): string {
    return type.replace('_', ' ');
  }

  getLatestBalance(item: Account | Liability): number | null {
    if (!item.balances || item.balances.length === 0) {
      return null;
    }
    return item.balances[0].amount;
  }

  formatCurrency(amount: number | null): string {
    if (amount === null) return 'No balance yet';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
