import {
  Component,
  OnInit,
  HostListener,
  Pipe,
  PipeTransform,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LoadingController,
  ModalController,
  NavController,
  Platform,
} from '@ionic/angular';
import { BookService } from '../services/book.service';
import { AlertService } from '../services/alert.service';
import { Share } from '@capacitor/share';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ApiResponse,
  BookResponse,
  ReviewResponse,
} from '../Model/ApiResponse';
import { TokenService } from '../services/token.service';

// Truncate pipe for template
@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(
    value: string,
    limit = 25,
    completeWords = false,
    ellipsis = '...'
  ) {
    if (!value) return '';
    if (value.length <= limit) return value;

    if (completeWords) {
      limit = value.substr(0, limit).lastIndexOf(' ');
    }
    return `${value.substr(0, limit)}${ellipsis}`;
  }
}

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.page.html',
  styleUrls: ['./book-details.page.scss'],
  standalone: false,
})
export class BookDetailsPage implements OnInit {
  book: BookResponse | null = null;
  similarBooks: BookResponse[] = [];
  isBookmarked = false;
  headerScrolled = false;
  hideHeader = false;
  lastScrollTop = 0;
  bookId!: string;
  isLoading = false;
  isLoadingPageCount = false;
  private static pdfPageCache = new Map<string, number>();
  pdfFile: string | Uint32Array = '';
  base64ToUint8Array(base64: string): Uint8Array {
    const raw = atob(base64);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertService: AlertService,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef
  ) {}

  getStarsArray(rating: number = 0): string[] {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const totalStars = 5;

    const starsArray: string[] = [];

    for (let i = 0; i < fullStars; i++) {
      starsArray.push('star'); // full star
    }

    if (halfStar) {
      starsArray.push('star-half'); // half star
    }

    while (starsArray.length < totalStars) {
      starsArray.push('star-outline'); // empty star
    }

    return starsArray;
  }

  goBack() {
    this.navCtrl.back();
  }

  readBook() {
    if (this.book && this.book.id) {
      this.navCtrl.navigateForward(['/read-book', this.book.id]);
    } else {
      console.log('No book available to read');
    }
  }

  openBook(book: any) {
    this.navCtrl.navigateForward(['/book-details', book.id]);
  }

  async ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.bookId = id;
        setTimeout(async () => {
          await this.loadBookPdf(this.bookId);
          this.loadBookDetails(id);
          this.loadSimilarBooks();
        }, 10);
      } else {
        this.navCtrl.navigateBack('/dashboard');
      }
    });
  }

  // Handle scroll events for header show/hide
  onScroll(event: any) {
    const scrollTop = event.detail?.scrollTop || 0;
    this.headerScrolled = scrollTop > 50;

    // Hide/show header based on scroll direction
    if (scrollTop > this.lastScrollTop && scrollTop > 100) {
      this.hideHeader = true;
    } else {
      this.hideHeader = false;
    }

    // For iOS bounce effect
    if (scrollTop <= 0) {
      this.hideHeader = false;
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

   arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32 KB per chunk (safe)
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
  }

  
  async loadBookPdf(id: string) {
    this.isLoading = true;
    try {
      const response = await fetch(`http://freeelib.runasp.net/api/Books/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TokenService.getToken()}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      let pdfBytes = new Uint8Array(arrayBuffer);
      let paddedBuffer: ArrayBuffer;
  
      if (pdfBytes.byteLength % 4 !== 0) {
        const paddedLength = Math.ceil(pdfBytes.byteLength / 4) * 4;
        const padded = new Uint8Array(paddedLength);
        padded.set(pdfBytes);
        paddedBuffer = padded.buffer;
      } else {
        paddedBuffer = pdfBytes.buffer;
      }
      const pdfUint32 = new Uint32Array(paddedBuffer);
      this.pdfFile = pdfUint32; 
    } catch (error) {
      console.error('Error streaming PDF:', error);
      await this.showErrorAlert('Failed to load PDF.');
    } finally {
      this.isLoading = false;
    }
  }
  

  loadBookDetails(id: string) {
    this.isLoading = true;
    this.bookService
      .getBookById(id)
      .pipe(
        map((response: ApiResponse<BookResponse>) => {
          if (response?.data) {
            this.book = response.data;
            if (!this.book.reviews) {
              this.book.reviews = [];
            }
            this.getFavoriteStatus();
          }
          this.isLoading = false;
        }),
        catchError(async (error) => {
          console.error('Error loading book details:', error);
          await this.showErrorAlert(
            'Failed to load book details. Please try again.'
          );
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe();
  }

  async shareBook() {
    try {
      await Share.share({
        title: this.book?.title,
        text: `Check out "${this.book?.title}" by ${this.book?.author}`,
        url: window.location.href,
        dialogTitle: 'Share this book',
      });
    } catch (error) {
      console.error('Error sharing book:', error);
    }
  }

  async showSuccessAlert(message: string) {
    await this.alertService.showSuccess(message);
  }

  async showErrorAlert(message: string) {
    await this.alertService.showError(message);
  }

  getInitials(title: string): string {
    if (!title) return 'BK';
    return title
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getGradientClass(title: string): string {
    if (!title) return 'gradient-1';
    // Simple hash function to generate consistent gradient classes
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradientIndex = Math.abs(hash) % 5;
    return `gradient-${gradientIndex + 1}`;
  }

  startReading() {
    // Navigate to PDF reader page
    if (this.book && this.book.id) {
      this.navCtrl.navigateForward(['/read-book', this.book.id]);
    } else {
      console.log('No book available to read');
    }
  }

  toggleBookmark() {
    this.toggleFavorite();
  }

  openRatingModal() {
    // Ideally use a modal or alert controller
    alert('Rating feature coming soon!');
  }

  loadSimilarBooks() {
    // Load similar books based on genre or author
    this.bookService
      .getPopularBooks()
      .subscribe((response: ApiResponse<BookResponse[]>) => {
        this.similarBooks = response.data?.slice(0, 6) || []; // Show first 6 as similar
      });
  }

  getActualPages(): number {
    // Use actual PDF pages if available
    if (this.book?.totalPages && this.book.totalPages > 0) {
      return this.book.totalPages;
    }

    // Check cache first
    if (this.book?.id) {
      const cached = BookDetailsPage.pdfPageCache.get(this.book.id.toString());
      if (cached) {
        this.book.totalPages = cached;
        return cached;
      }
    }
    
    if (this.pdfFile && !this.book?.totalPages && !this.isLoadingPageCount) {
      this.loadPdfPageCountAsync();
    }

    // Return estimation immediately while loading
    if (!this.book?.title) return 250;
    const titleLength = this.book.title.length;
    return Math.round(200 + titleLength * 10);
  }

  private loadPdfPageCountAsync(): void {
    if (!this.pdfFile || this.book?.totalPages || this.isLoadingPageCount)
      return;

    this.isLoadingPageCount = true;

    // Use setTimeout to make it non-blocking
    setTimeout(async () => {
      try {
        await this.loadPdfPageCount();
      } catch (error) {
        console.error('Error loading PDF page count:', error);
      } finally {
        this.isLoadingPageCount = false;
      }
    }, 100);
  }

  private async loadPdfPageCount(): Promise<void> {
    if (!this.pdfFile || this.book?.totalPages) return;

    try {
      // Load PDF.js if not already loaded
      if (!(window as any).pdfjsLib) {
        await this.loadPdfJs();
      }

      // Only load first few pages to get metadata quickly
      let pdfData: Uint8Array;
      const content = this.pdfFile;

      if (typeof content === 'string') {
        let base64 = content;
        if (base64.includes(',')) base64 = base64.split(',')[1];
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        pdfData = arr;
      } else if (content instanceof ArrayBuffer) {
        pdfData = new Uint8Array(content);
      } else if (content instanceof Uint8Array) {
        pdfData = content;
      } else if (content instanceof Uint32Array) {
        const buffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
        pdfData = new Uint8Array(buffer);
      } else {
        throw new Error('Unsupported PDF format');
      }

      const pdfjs = (window as any).pdfjsLib;
      const loadingTask = pdfjs.getDocument({
        data: pdfData,
        disableAutoFetch: true, // Don't fetch all pages
        disableRange: true, // Don't use range requests
        stopAtErrors: true, // Stop on first error
      });

      const pdfDoc = await loadingTask.promise;
      const pageCount = pdfDoc.numPages || 0;

      // Cache the result
      if (this.book?.id) {
        BookDetailsPage.pdfPageCache.set(this.book.id.toString(), pageCount);
      }

      // Update book with actual page count
      if (this.book) {
        this.book.totalPages = pageCount;
      }
      console.log(`PDF metadata loaded: ${pageCount} pages`);

      // Cleanup immediately
      await pdfDoc.cleanup();
      await pdfDoc.destroy();

      // Trigger change detection to update UI
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading PDF page count:', error);
      // Silently fail - will use estimation instead
    }
  }

  private async loadPdfJs(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import * as pdfjsLib from '../../assets/pdf.min.mjs';
        pdfjsLib.GlobalWorkerOptions.workerSrc = '../../assets/pdf.worker.mjs';
        window.pdfjsLib = pdfjsLib;
        window.dispatchEvent(new CustomEvent('pdfjsLoaded'));
      `;

      const onLoad = () => {
        setTimeout(() => {
          if ((window as any).pdfjsLib) {
            resolve();
          } else {
            reject(new Error('PDF.js failed to load'));
          }
        }, 100);
      };

      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      window.addEventListener('pdfjsLoaded', onLoad, { once: true });
      document.head.appendChild(script);
    });
  }

  getReadingTime(): number {
    // Calculate reading time: average 2 minutes per page for technical books, 1.5 for fiction
    const pages = this.getActualPages();
    const minutesPerPage = this.book?.genres?.some((g) =>
      ['Technical', 'Science', 'Education', 'Reference'].includes(g.name)
    )
      ? 2.5
      : 1.8;

    return Math.round(pages * minutesPerPage);
  }

  getFormattedReadingTime(): string {
    const totalMinutes = this.getReadingTime();
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  seeAllBooks() {
    this.router.navigate(['/see-all-books']);
  }

  private getFavoriteStatus() {
    this.bookService
      .checkFavoriteAsync({
        userId: TokenService.getUserId() ?? '',
        bookId: this.bookId?.toString() ?? '',
      })
      .subscribe((res: any) => {
        debugger;
        this.isBookmarked = res.data;
        this.cdr.detectChanges();
      });
  }

  toggleFavorite() {
    this.bookService
      .toggleFavoritesAsync({
        userId: TokenService.getUserId() ?? '',
        bookId: this.bookId?.toString() ?? '',
      })
      .subscribe(() => {
        this.getFavoriteStatus();
      });
  }
}
