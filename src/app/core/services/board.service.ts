import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { Board, CreateBoardDto, UpdateBoardDto, AddBoardMemberDto } from '../models/board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private apiService = inject(ApiService);

  /**
   * Get all boards
   */
  getAllBoards(): Observable<Board[]> {
    return this.apiService
      .get<ApiResponse<Board[]>>('/boards')
      .pipe(map((response) => response.data));
  }

  /**
   * Get board by ID
   */
  getBoardById(id: string): Observable<Board> {
    return this.apiService
      .get<ApiResponse<Board>>(`/boards/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Create new board
   */
  createBoard(data: CreateBoardDto): Observable<Board> {
    return this.apiService
      .post<ApiResponse<Board>>('/boards', data)
      .pipe(map((response) => response.data));
  }

  /**
   * Update board
   */
  updateBoard(id: string, data: UpdateBoardDto): Observable<Board> {
    return this.apiService
      .put<ApiResponse<Board>>(`/boards/${id}`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Add member to board
   */
  addMember(boardId: string, data: AddBoardMemberDto): Observable<Board> {
    return this.apiService
      .post<ApiResponse<Board>>(`/boards/${boardId}/members`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Remove member from board
   */
  removeMember(boardId: string, userId: string): Observable<Board> {
    return this.apiService
      .delete<ApiResponse<Board>>(`/boards/${boardId}/members/${userId}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Archive board
   */
  archiveBoard(boardId: string, reason?: string): Observable<Board> {
    return this.apiService
      .post<ApiResponse<Board>>(`/boards/${boardId}/archive`, { reason })
      .pipe(map((response) => response.data));
  }

  /**
   * Delete board
   */
  deleteBoard(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/boards/${id}`);
  }
}
