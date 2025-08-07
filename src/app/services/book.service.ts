import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse, BookResponse, GenreResponseWithBooks } from '../Model/ApiResponse';

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
            debugger
            const filteredBooks = response.data?.filter(book => book.rating > 2) ?? [];
            return {
              success: response.success,
              message: response.message,
              data: filteredBooks
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
      
    
}