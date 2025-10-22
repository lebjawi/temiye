import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Election, CreateElectionDto, UpdateElectionDto } from '../models/election.model';

@Injectable({
  providedIn: 'root',
})
export class ElectionService {
  private apiService = inject(ApiService);

  getAllElections(): Observable<Election[]> {
    return this.apiService
      .get<ApiResponse<Election[]>>('/elections')
      .pipe(map((response) => response.data));
  }

  getElectionById(id: string): Observable<Election> {
    return this.apiService
      .get<ApiResponse<Election>>(`/elections/${id}`)
      .pipe(map((response) => response.data));
  }

  createElection(data: CreateElectionDto): Observable<Election> {
    return this.apiService
      .post<ApiResponse<Election>>('/elections', data)
      .pipe(map((response) => response.data));
  }

  updateElection(id: string, data: UpdateElectionDto): Observable<Election> {
    return this.apiService
      .put<ApiResponse<Election>>(`/elections/${id}`, data)
      .pipe(map((response) => response.data));
  }

  startVoting(id: string): Observable<Election> {
    return this.apiService
      .post<ApiResponse<Election>>(`/elections/${id}/start-voting`, {})
      .pipe(map((response) => response.data));
  }

  closeVoting(id: string): Observable<Election> {
    return this.apiService
      .post<ApiResponse<Election>>(`/elections/${id}/close-voting`, {})
      .pipe(map((response) => response.data));
  }

  archiveElection(id: string): Observable<Election> {
    return this.apiService
      .post<ApiResponse<Election>>(`/elections/${id}/archive`, {})
      .pipe(map((response) => response.data));
  }

  deleteElection(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/elections/${id}`);
  }
}
