import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { ApiResponse, BookResponse, GenreResponseWithBooks, FavoriteRequestDto, FavoriteResponseDto, ReadingProgressRequestDto, ReadingProgressResponseDto, FavoriteListResponseDto } from '../Model/ApiResponse';

export interface SearchParams {
  query?: string;
  genreId?: number;
  language?: string;
  sortBy?: 'title' | 'author' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

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

      getBookPdf(id: string): Observable<ApiResponse<Blob>> {
        return this.http.get<ApiResponse<Blob>>(`${this.apiUrl}/api/Books/${id}/pdf`, {
          responseType: 'blob' as 'json' 
        });
      }
      
      getBooksByGenreAsync(genreId: number): Observable<ApiResponse<BookResponse[]>> {
        return this.http.get<ApiResponse<BookResponse[]>>(`${this.apiUrl}/api/Books/genre/${genreId}`);
      }

      toggleFavoritesAsync(request: FavoriteRequestDto): Observable<ApiResponse<FavoriteResponseDto>> {
        return this.http.post<ApiResponse<FavoriteResponseDto>>(`${this.apiUrl}/api/Books/toggleFavorites`, request);
      }

      checkFavoriteAsync(request: FavoriteRequestDto): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/api/Books/checkFavorites`, request);
      }

      getUserFavoritesAsync(userId: string): Observable<ApiResponse<FavoriteListResponseDto[]>> {
        return this.http.get<ApiResponse<FavoriteListResponseDto[]>>(`${this.apiUrl}/api/Books/user/${userId}/favorites`);
      }

      removeFromFavorites(userId: string, bookId: string): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(
          `${this.apiUrl}/api/Books/user/${userId}/favorites/${bookId}`
        );
      }

      updateReadingProgress(userId: string, request: ReadingProgressRequestDto): Observable<ApiResponse<ReadingProgressResponseDto>> {
        return this.http.put<ApiResponse<ReadingProgressResponseDto>>(`${this.apiUrl}/api/Books/user/${userId}/reading-progress`, request);
      }

      getReadingProgress(userId: string, bookId: number): Observable<ApiResponse<ReadingProgressResponseDto>> {
        return this.http.get<ApiResponse<ReadingProgressResponseDto>>(`${this.apiUrl}/api/Books/user/${userId}/reading-progress/${bookId}`);
      }

      getUserReadingProgress(userId: string): Observable<ApiResponse<ReadingProgressResponseDto[]>> {
        return this.http.get<ApiResponse<ReadingProgressResponseDto[]>>(`${this.apiUrl}/api/Books/user/${userId}/reading-history`);
      }

      getLastReadBook(userId: string): Observable<ApiResponse<ReadingProgressResponseDto>> {
        return this.http.get<ApiResponse<ReadingProgressResponseDto>>(`${this.apiUrl}/api/Books/user/${userId}/reading-progress`);
      }

      startSession(userId: string, bookId: string): Observable<any> {
        return this.http.post(
          `${this.apiUrl}/api/Books/start?userId=${userId}&bookId=${bookId}`,
          {}, // empty body
          { responseType: 'text' }
        );
      }
    
      // End session (when closing book)
      endSession(userId: string, bookId: string,sessionMinutes:string): Observable<any> {
        return this.http.post(
          `${this.apiUrl}/api/Books/end?userId=${userId}&bookId=${bookId}&sessionMinutes=${sessionMinutes}`,
          {}, // empty body
          { responseType: 'text' }
        );
      }
      
      // Check usage (whether limit exceeded or not)
      checkUsage(userId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/api/Books/check?userId=${userId}`);
      }

      /**
       * Search for books with various filters
       * @param params Search parameters
       */
      searchBooks(params: SearchParams): Observable<ApiResponse<BookResponse[]>> {
        // Start building query parameters
        let httpParams = new HttpParams();

        // Add search query if provided
        if (params.query) {
          httpParams = httpParams.set('search', params.query);
        }

        // Add genre filter if provided
        if (params.genreId !== undefined) {
          httpParams = httpParams.set('genreId', params.genreId.toString());
        }

        // Add language filter if provided
        if (params.language) {
          httpParams = httpParams.set('language', params.language);
        }

        // Add sorting parameters if provided
        if (params.sortBy) {
          httpParams = httpParams.set('sortBy', params.sortBy);
          httpParams = httpParams.set('sortOrder', params.sortOrder || 'desc');
        }

        // Add pagination parameters if provided
        if (params.page !== undefined) {
          httpParams = httpParams.set('page', params.page.toString());
        }
        if (params.limit !== undefined) {
          httpParams = httpParams.set('limit', params.limit.toString());
        }

        return this.http.get<ApiResponse<BookResponse[]>>(
          `${this.apiUrl}/api/Books/search`,
          { params: httpParams }
        ).pipe(
          catchError(error => {
            console.error('Error searching books:', error);
            // Return empty result on error to prevent breaking the UI
            return of({
              success: false,
              message: 'Failed to search books',
              data: []
            });
          })
        );
      }

}