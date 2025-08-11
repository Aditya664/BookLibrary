import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse, BookResponse, GenreResponseWithBooks, FavoriteRequestDto, FavoriteResponseDto, ReadingProgressRequestDto, ReadingProgressResponseDto } from '../Model/ApiResponse';

@Injectable({providedIn: 'root'})

export class BookService {
    private apiUrl ="http://freeelib.runasp.net";
    constructor(private http: HttpClient) { }
  
    getAllGenres():Observable<ApiResponse<GenreResponseWithBooks[]>> {
      return this.http.get<ApiResponse<GenreResponseWithBooks[]>>(`${this.apiUrl}/api/Books/getAllGenres`, {});
    }
  
    getPopularBooks(): Observable<ApiResponse<BookResponse[]>> {
        return this.http.get<ApiResponse<BookResponse[]>>(`${this.apiUrl}/api/Books/getAllBooks`).pipe(
          map((response) => {
            const sortedBooks = response.data?.sort((a, b) => b.rating - a.rating) ?? [];
            return {
              success: response.success,
              message: response.message,
              data: sortedBooks
            };
          })
        );
      }


      getRecentlyAddedBooks(): Observable<ApiResponse<BookResponse[]>> {
        return this.http.get<ApiResponse<BookResponse[]>>(`${this.apiUrl}/api/Books/getAllBooks`).pipe(
          map((response) => {
            const recentBooks = (response.data ?? [])
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5); // Get top 5 most recent
      
            return {
              success: response.success,
              message: response.message,
              data: recentBooks
            };
          })
        );
      }

      getAllBooks(): Observable<ApiResponse<BookResponse[]>> {
        return this.http.get<ApiResponse<BookResponse[]>>(`${this.apiUrl}/api/Books/getAllBooks`);
      }

      getBookById(id: string): Observable<ApiResponse<BookResponse>> {
        return this.http.get<ApiResponse<BookResponse>>(`${this.apiUrl}/api/Books/${id}`);
      }

      getBooksByGenreAsync(genreId: number): Observable<ApiResponse<BookResponse[]>> {
        return this.http.get<ApiResponse<BookResponse[]>>(`${this.apiUrl}/api/Books/genre/${genreId}`);
      }

      addBookToFavoritesAsync(request: FavoriteRequestDto): Observable<ApiResponse<FavoriteResponseDto>> {
        return this.http.post<ApiResponse<FavoriteResponseDto>>(`${this.apiUrl}/api/Books/favorites`, request);
      }

      getUserFavoritesAsync(userId: string): Observable<ApiResponse<FavoriteResponseDto[]>> {
        return this.http.get<ApiResponse<FavoriteResponseDto[]>>(`${this.apiUrl}/api/Books/user/${userId}/favorites`);
      }

      updateReadingProgress(userId: string, request: ReadingProgressRequestDto): Observable<ApiResponse<ReadingProgressResponseDto>> {
        return this.http.put<ApiResponse<ReadingProgressResponseDto>>(`${this.apiUrl}/api/Books/user/${userId}/reading-progress`, request);
      }

      getReadingProgress(userId: string, bookId: number): Observable<ApiResponse<ReadingProgressResponseDto>> {
        return this.http.get<ApiResponse<ReadingProgressResponseDto>>(`${this.apiUrl}/api/Books/user/${userId}/reading-progress/${bookId}`);
      }

      getUserReadingProgress(userId: string): Observable<ApiResponse<ReadingProgressResponseDto[]>> {
        return this.http.get<ApiResponse<ReadingProgressResponseDto[]>>(`${this.apiUrl}/api/Books/user/${userId}/reading-progress`);
      }

      getLastReadBook(userId: string): Observable<ApiResponse<ReadingProgressResponseDto>> {
        return this.http.get<ApiResponse<ReadingProgressResponseDto>>(`${this.apiUrl}/api/Books/user/${userId}/reading-progress`);
      }
}