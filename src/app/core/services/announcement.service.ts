import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Announcement, CreateAnnouncementDto, UpdateAnnouncementDto } from '../models/announcement.model';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiService = inject(ApiService);

  getAllAnnouncements(): Observable<Announcement[]> {
    return this.apiService
      .get<ApiResponse<Announcement[]>>('/announcements')
      .pipe(map((response) => response.data));
  }

  getAnnouncementById(id: string): Observable<Announcement> {
    return this.apiService
      .get<ApiResponse<Announcement>>(`/announcements/${id}`)
      .pipe(map((response) => response.data));
  }

  createAnnouncement(data: CreateAnnouncementDto): Observable<Announcement> {
    return this.apiService
      .post<ApiResponse<Announcement>>('/announcements', data)
      .pipe(map((response) => response.data));
  }

  updateAnnouncement(id: string, data: UpdateAnnouncementDto): Observable<Announcement> {
    return this.apiService
      .put<ApiResponse<Announcement>>(`/announcements/${id}`, data)
      .pipe(map((response) => response.data));
  }

  deleteAnnouncement(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/announcements/${id}`);
  }

  pinAnnouncement(id: string): Observable<Announcement> {
    return this.apiService
      .post<ApiResponse<Announcement>>(`/announcements/${id}/pin`, {})
      .pipe(map((response) => response.data));
  }

  unpinAnnouncement(id: string): Observable<Announcement> {
    return this.apiService
      .post<ApiResponse<Announcement>>(`/announcements/${id}/unpin`, {})
      .pipe(map((response) => response.data));
  }
}
