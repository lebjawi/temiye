import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Admin, CreateAdminDto } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiService = inject(ApiService);

  /**
   * Get all admins
   */
  getAllAdmins(): Observable<Admin[]> {
    return this.apiService
      .get<ApiResponse<Admin[]>>('/admins')
      .pipe(map((response) => response.data));
  }

  /**
   * Get admin by ID
   */
  getAdminById(id: string): Observable<Admin> {
    return this.apiService
      .get<ApiResponse<Admin>>(`/admins/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Create new admin
   */
  createAdmin(data: CreateAdminDto): Observable<Admin> {
    return this.apiService
      .post<ApiResponse<Admin>>('/admins', data)
      .pipe(map((response) => response.data));
  }

  /**
   * Get pending admin approvals
   */
  getPendingApprovals(): Observable<Admin[]> {
    return this.apiService
      .get<ApiResponse<Admin[]>>('/admins/pending')
      .pipe(map((response) => response.data));
  }

  /**
   * Approve pending admin
   */
  approveAdmin(id: string, reason?: string): Observable<Admin> {
    return this.apiService
      .post<ApiResponse<Admin>>(`/admins/${id}/approve`, { reason })
      .pipe(map((response) => response.data));
  }

  /**
   * Reject pending admin
   */
  rejectAdmin(id: string, reason: string): Observable<Admin> {
    return this.apiService
      .post<ApiResponse<Admin>>(`/admins/${id}/reject`, { reason })
      .pipe(map((response) => response.data));
  }

  /**
   * Delete admin
   */
  deleteAdmin(id: string): Observable<void> {
    return this.apiService
      .delete<ApiResponse<void>>(`/admins/${id}`)
      .pipe(map(() => undefined));
  }
}
