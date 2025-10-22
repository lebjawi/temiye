import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { User, CreateUserDto, UpdateUserDto } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiService = inject(ApiService);

  /**
   * Get all users with pagination
   */
  getAllUsers(page: number = 1, limit: number = 20): Observable<User[]> {
    return this.apiService
      .get<ApiResponse<User[]>>(`/users?page=${page}&limit=${limit}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User> {
    return this.apiService
      .get<ApiResponse<User>>(`/users/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Update user profile
   */
  updateUser(id: string, data: UpdateUserDto): Observable<User> {
    return this.apiService
      .put<ApiResponse<User>>(`/users/${id}`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Approve pending user
   */
  approveUser(id: string): Observable<User> {
    return this.apiService
      .post<ApiResponse<User>>(`/users/${id}/approve`, {})
      .pipe(map((response) => response.data));
  }

  /**
   * Ban user
   */
  banUser(id: string): Observable<User> {
    return this.apiService
      .post<ApiResponse<User>>(`/users/${id}/ban`, {})
      .pipe(map((response) => response.data));
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): Observable<User[]> {
    return this.apiService
      .get<ApiResponse<User[]>>('/users/pending')
      .pipe(map((response) => response.data));
  }

  /**
   * Create new user (admin registration)
   */
  createUser(data: CreateUserDto): Observable<User> {
    return this.apiService
      .post<ApiResponse<User>>('/users', data)
      .pipe(map((response) => response.data));
  }

  /**
   * Assign role to user
   */
  assignRole(userId: string, roleId: string): Observable<User> {
    return this.apiService
      .put<ApiResponse<User>>(`/users/${userId}/role`, { roleRef: roleId })
      .pipe(map((response) => response.data));
  }

  /**
   * Assign tier to user
   */
  assignTier(userId: string, tierId: string): Observable<User> {
    return this.apiService
      .put<ApiResponse<User>>(`/users/${userId}/tier`, { tierRef: tierId })
      .pipe(map((response) => response.data));
  }

  /**
   * Delete user
   */
  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/users/${id}`);
  }
}
