export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
  }
  
  export interface LoginResponse{
    jwtToken:string;
  }

  export interface GenreResponseWithBooks{
    id:number;
    name:string;
    iconName:string;
    books:{id:number;bookName:string;}
  }

  export interface BookResponse {
    id: number;
    image: string;
    title: string;
    author: string;
    rating: number;
    description: string;
    language?: string;
    genres: GenreResponse[];
    reviews: ReviewResponse[];
    pdfFile?: Uint8Array | string; // Can be either Uint8Array or base64 string from API
    pdfFileName?: string;
    createdAt: string; // ISO string when received from API
  }
  
  export interface GenreResponse {
    id: number;
    name: string;
  }
  
  export interface ReviewResponse {
    user: string;
    comment: string;
  }

  export interface FavoriteRequestDto {
    userId: number;
    bookId: number;
  }

  export interface FavoriteResponseDto {
    id: number;
    userId: number;
    bookId: number;
    book: BookResponse;
    createdAt: string;
  }

  export interface ReadingProgressRequestDto {
    bookId: number;
    currentPage: number;
    totalPages: number;
  }

  export interface ReadingProgressResponseDto {
    bookId: number;
    userId: number;
    currentPage: number;
    totalPages: number;
    percentage: number;
    lastUpdated: string;
    book: BookResponse;
  }