import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Tier, CreateTierDto, UpdateTierDto } from '../models/tier.model';

@Injectable({
  providedIn: 'root',
})
export class TierService {
  private apiService = inject(ApiService);

  /**
   * Get all tiers
   */
  getAllTiers(): Observable<Tier[]> {
    return this.apiService
      .get<ApiResponse<Tier[]>>('/tiers')
      .pipe(map((response) => response.data));
  }

  /**
   * Get tier by ID
   */
  getTierById(id: string): Observable<Tier> {
    return this.apiService
      .get<ApiResponse<Tier>>(`/tiers/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Create new tier
   */
  createTier(data: CreateTierDto): Observable<Tier> {
    return this.apiService
      .post<ApiResponse<Tier>>('/tiers', data)
      .pipe(map((response) => response.data));
  }

  /**
   * Update tier
   */
  updateTier(id: string, data: UpdateTierDto): Observable<Tier> {
    return this.apiService
      .put<ApiResponse<Tier>>(`/tiers/${id}`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Delete tier
   */
  deleteTier(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/tiers/${id}`);
  }
}
