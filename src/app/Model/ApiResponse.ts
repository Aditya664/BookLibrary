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
    genres: GenreResponse[];
    reviews: ReviewResponse[];
    pdfFile?: Uint8Array; // or `ArrayBuffer` if you're dealing with binary data in Angular
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
  