import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Account,
  Liability,
  Balance,
  NetWorthData,
  CreateAccountRequest,
  UpdateAccountRequest,
  CreateLiabilityRequest,
  UpdateLiabilityRequest,
  CreateBalanceRequest,
  BulkUpdateBalancesRequest,
  ApiResponse,
} from '../models/finance.model';

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/finance`;

  // ============ Accounts ============

  getAccounts(includeInactive = false): Observable<Account[]> {
    const url = includeInactive
      ? `${this.apiUrl}/accounts?includeInactive=true`
      : `${this.apiUrl}/accounts`;

    return this.http
      .get<ApiResponse<Account[]>>(url, { withCredentials: true })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to fetch accounts'))
        )
      );
  }

  getAccount(id: string): Observable<Account> {
    return this.http
      .get<ApiResponse<Account>>(`${this.apiUrl}/accounts/${id}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to fetch account'))
        )
      );
  }

  createAccount(data: CreateAccountRequest): Observable<Account> {
    return this.http
      .post<ApiResponse<Account>>(`${this.apiUrl}/accounts`, data, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to create account'))
        )
      );
  }

  updateAccount(id: string, data: UpdateAccountRequest): Observable<Account> {
    return this.http
      .patch<ApiResponse<Account>>(`${this.apiUrl}/accounts/${id}`, data, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to update account'))
        )
      );
  }

  deleteAccount(id: string, hardDelete = false): Observable<void> {
    const url = hardDelete
      ? `${this.apiUrl}/accounts/${id}?hard=true`
      : `${this.apiUrl}/accounts/${id}`;

    return this.http
      .delete<void>(url, { withCredentials: true })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to delete account'))
        )
      );
  }

  // ============ Liabilities ============

  getLiabilities(includeInactive = false): Observable<Liability[]> {
    const url = includeInactive
      ? `${this.apiUrl}/liabilities?includeInactive=true`
      : `${this.apiUrl}/liabilities`;

    return this.http
      .get<ApiResponse<Liability[]>>(url, { withCredentials: true })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to fetch liabilities'))
        )
      );
  }

  getLiability(id: string): Observable<Liability> {
    return this.http
      .get<ApiResponse<Liability>>(`${this.apiUrl}/liabilities/${id}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to fetch liability'))
        )
      );
  }

  createLiability(data: CreateLiabilityRequest): Observable<Liability> {
    return this.http
      .post<ApiResponse<Liability>>(`${this.apiUrl}/liabilities`, data, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to create liability'))
        )
      );
  }

  updateLiability(id: string, data: UpdateLiabilityRequest): Observable<Liability> {
    return this.http
      .patch<ApiResponse<Liability>>(`${this.apiUrl}/liabilities/${id}`, data, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to update liability'))
        )
      );
  }

  deleteLiability(id: string, hardDelete = false): Observable<void> {
    const url = hardDelete
      ? `${this.apiUrl}/liabilities/${id}?hard=true`
      : `${this.apiUrl}/liabilities/${id}`;

    return this.http
      .delete<void>(url, { withCredentials: true })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to delete liability'))
        )
      );
  }

  // ============ Balances ============

  getBalanceDates(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.apiUrl}/balances`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to fetch balance dates'))
        )
      );
  }

  getBalancesForDate(date: string): Observable<{
    accounts: (Balance & { account: Account })[];
    liabilities: (Balance & { liability: Liability })[];
    date: string;
  }> {
    return this.http
      .get<
        ApiResponse<{
          accounts: (Balance & { account: Account })[];
          liabilities: (Balance & { liability: Liability })[];
          date: string;
        }>
      >(`${this.apiUrl}/balances`, {
        params: { date },
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to fetch balances'))
        )
      );
  }

  createBalance(data: CreateBalanceRequest): Observable<Balance> {
    return this.http
      .post<ApiResponse<Balance>>(`${this.apiUrl}/balances`, data, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to create balance'))
        )
      );
  }

  bulkUpdateBalances(data: BulkUpdateBalancesRequest): Observable<Balance[]> {
    return this.http
      .post<ApiResponse<Balance[]>>(`${this.apiUrl}/balances/bulk`, data, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to update balances'))
        )
      );
  }

  deleteBalance(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/balances/${id}`, {
        withCredentials: true,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to delete balance'))
        )
      );
  }

  // ============ Net Worth ============

  getNetWorth(date?: string): Observable<NetWorthData> {
    const url = date
      ? `${this.apiUrl}/net-worth?date=${encodeURIComponent(date)}`
      : `${this.apiUrl}/net-worth`;

    return this.http
      .get<ApiResponse<NetWorthData>>(url, { withCredentials: true })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to calculate net worth'))
        )
      );
  }

  getNetWorthHistory(): Observable<NetWorthData[]> {
    return this.http
      .get<ApiResponse<NetWorthData[]>>(`${this.apiUrl}/net-worth`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || 'Failed to fetch net worth history'))
        )
      );
  }
}
