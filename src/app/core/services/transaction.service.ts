import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Transaction, CreateTransactionDto, DeleteTransactionDto } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private apiService = inject(ApiService);

  /**
   * Get all transactions
   */
  getAllTransactions(): Observable<Transaction[]> {
    return this.apiService
      .get<ApiResponse<Transaction[]>>('/transactions')
      .pipe(map((response) => response.data));
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Observable<Transaction> {
    return this.apiService
      .get<ApiResponse<Transaction>>(`/transactions/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Create new transaction (immutable)
   */
  createTransaction(data: CreateTransactionDto): Observable<Transaction> {
    return this.apiService
      .post<ApiResponse<Transaction>>('/transactions', data)
      .pipe(map((response) => response.data));
  }

  /**
   * Soft delete transaction (superadmin only)
   */
  deleteTransaction(id: string, reason: string): Observable<{ success: boolean; message: string }> {
    const data: DeleteTransactionDto = { reason };
    return this.apiService.patch<{ success: boolean; message: string }>(`/transactions/${id}/delete`, data);
  }
}
