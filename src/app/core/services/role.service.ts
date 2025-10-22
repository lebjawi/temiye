import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Role, CreateRoleDto, UpdateRoleDto } from '../models/role.model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private apiService = inject(ApiService);

  /**
   * Get all roles
   */
  getAllRoles(): Observable<Role[]> {
    return this.apiService
      .get<ApiResponse<Role[]>>('/roles')
      .pipe(map((response) => response.data));
  }

  /**
   * Get role by ID
   */
  getRoleById(id: string): Observable<Role> {
    return this.apiService
      .get<ApiResponse<Role>>(`/roles/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Create new role
   */
  createRole(data: CreateRoleDto): Observable<Role> {
    return this.apiService
      .post<ApiResponse<Role>>('/roles', data)
      .pipe(map((response) => response.data));
  }

  /**
   * Update role
   */
  updateRole(id: string, data: UpdateRoleDto): Observable<Role> {
    return this.apiService
      .put<ApiResponse<Role>>(`/roles/${id}`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Delete role
   */
  deleteRole(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/roles/${id}`);
  }

  /**
   * Get roles by hierarchy level
   */
  getRolesByLevel(level: number): Observable<Role[]> {
    return this.apiService
      .get<ApiResponse<Role[]>>(`/roles/level/${level}`)
      .pipe(map((response) => response.data));
  }
}
