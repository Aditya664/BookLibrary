import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Platform, LoadingController, ToastController } from '@ionic/angular';
import { BookService } from '../services/book.service';
import { BookResponse, ReadingProgressRequestDto } from '../Model/ApiResponse';
import { TokenService } from '../services/token.service';

// PDF.js types (we'll load it dynamically)
declare var pdfjsLib: any;

@Component({
  selector: 'app-read-book',
  templateUrl: './read-book.page.html',
  styleUrls: ['./read-book.page.scss'],
  standalone:false
})
export class ReadBookPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfContainer', { static: false }) pdfContainer!: ElementRef<HTMLDivElement>;

  book!: BookResponse;
  bookId!: string;
  isLoading = false;
  pdfDoc: any = null;
  currentPage = 1;
  totalPages = 0;
  scale = 1.0;
  rotation = 0;
  isFullscreen = false;
  
  // Reading settings
  brightness = 100;
  fontSize = 16;
  fontFamily = 'Arial';
  backgroundColor = '#ffffff';
  textColor = '#000000';
  nightMode = false;
  
  // UI state
  showControls = true;
  showSettings = false;
  isRendering = false;
  
  // New features
  bookmarks: number[] = [];
  searchTerm = '';
  searchResults: any[] = [];
  currentSearchIndex = -1;
  isSearching = false;
  
  // Reading progress tracking
  readingProgress: number = 0;
  progressInterval: any;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private platform: Platform,
    private bookService: BookService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    console.log('ReadBookPage initializing...');
    this.route.params.subscribe(params => {
      this.bookId = params['id'];
      console.log(`Book ID from route: ${this.bookId}`);
      if (this.bookId) {
        this.loadBook();
      } else {
        console.error('No book ID found in route parameters.');
      }
    });
  }

  ngAfterViewInit() {
    this.loadPdfJs();
  }

  async loadPdfJs() {
    try {
      // Load PDF.js from CDN
      if (typeof pdfjsLib === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      this.showToast('Error loading PDF reader');
    }
  }

  async loadBook() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading book...'
    });
    await loading.present();

    try {
      this.bookService.getBookById(this.bookId).subscribe({
        next: (response) => {
          this.book = response.data;
          console.log('Book data loaded successfully:', this.book);
          loading.dismiss();
          if (this.book.pdfFile) {
            this.loadPdf();
          } else {
            this.showToast('No PDF file available for this book');
          }
        },
        error: (error) => {
          console.error('Error loading book:', error);
          loading.dismiss();
          this.showToast('Error loading book');
        }
      });
    } catch (error) {
      loading.dismiss();
      this.showToast('Error loading book');
    }
  }

  async loadPdf() {
    if (!this.book?.pdfFile || typeof pdfjsLib === 'undefined') {
      this.showToast('PDF reader not ready');
      return;
    }

    try {
      this.isLoading = true;
      
      // Convert base64 string to Uint8Array
      let pdfData: Uint8Array;
      const pdfFile: Uint8Array | string = this.book.pdfFile;
      
      if (typeof pdfFile === 'string') {
        // Handle base64 string - remove data URL prefix if present
        let base64String: string = pdfFile;
        const dataUrlPrefix = 'data:application/pdf;base64,';
        if (base64String.indexOf(dataUrlPrefix) === 0) {
          base64String = base64String.slice(dataUrlPrefix.length);
        }
        const binaryString = atob(base64String);
        pdfData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pdfData[i] = binaryString.charCodeAt(i);
        }
      } else if (pdfFile instanceof Uint8Array) {
        // Handle Uint8Array directly
        pdfData = pdfFile;
      } else {
        throw new Error('Invalid PDF data format');
      }

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.renderPage(1);
      
      // Load reading progress after PDF is loaded
      this.loadReadingProgress();
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showToast('Error loading PDF file');
    } finally {
      this.isLoading = false;
    }
  }

  async renderPage(pageNum: number) {
    if (!this.pdfDoc || this.isRendering) return;

    this.isRendering = true;
    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Calculate scale based on container width
      const containerWidth = this.pdfContainer.nativeElement.clientWidth - 40; // padding
      const viewport = page.getViewport({ scale: 1, rotation: this.rotation });
      const baseScale = containerWidth / viewport.width;
      
      // Ensure minimum effective scale to prevent blur
      const effectiveScale = Math.max(baseScale * this.scale, 0.75);
      
      const scaledViewport = page.getViewport({ scale: effectiveScale, rotation: this.rotation });
      
      // Set canvas size with device pixel ratio for crisp rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      const outputScale = devicePixelRatio;
      
      canvas.width = Math.floor(scaledViewport.width * outputScale);
      canvas.height = Math.floor(scaledViewport.height * outputScale);
      canvas.style.width = Math.floor(scaledViewport.width) + 'px';
      canvas.style.height = Math.floor(scaledViewport.height) + 'px';
      
      // Configure context for crisp rendering
      context.save();
      context.scale(outputScale, outputScale);
      
      // Disable image smoothing for crisp text rendering at low zoom levels
      if (effectiveScale < 1.0) {
        context.imageSmoothingEnabled = false;
      } else {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
      }
      
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };
      
      await page.render(renderContext).promise;
      context.restore();
      this.currentPage = pageNum;

      // Centralized call to update reading progress
      console.log(`Page rendered: ${pageNum}. Triggering progress update.`);
      this.updateReadingProgress();
    } catch (error) {
      console.error('Error rendering page:', error);
      this.showToast('Error rendering page');
    } finally {
      this.isRendering = false;
    }
  }

  // Navigation methods
  goBack() {
    this.navCtrl.back();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.renderPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.renderPage(this.currentPage + 1);
    }
  }

  goToPage(page: any) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.totalPages) {
      this.renderPage(pageNum);
    }
  }

  // Zoom methods
  zoomIn() {
    this.scale = Math.min(this.scale + 0.25, 3.0);
    this.renderPage(this.currentPage);
  }

  zoomOut() {
    this.scale = Math.max(this.scale - 0.25, 0.5);
    this.renderPage(this.currentPage);
  }

  fitToWidth() {
    if (!this.pdfDoc) return;
    
    this.pdfDoc.getPage(this.currentPage).then((page: any) => {
      const containerWidth = this.pdfContainer.nativeElement.clientWidth - 40; // padding
      const viewport = page.getViewport({ scale: 1, rotation: this.rotation });
      const widthScale = containerWidth / viewport.width;
      this.scale = Math.max(widthScale, 0.75); // Ensure minimum scale to prevent blur
      this.renderPage(this.currentPage);
    });
  }

  resetZoom() {
    this.scale = 1.0;
    this.renderPage(this.currentPage);
  }

  fitToHeight() {
    if (!this.pdfDoc) return;
    
    this.pdfDoc.getPage(this.currentPage).then((page: any) => {
      const containerHeight = this.pdfContainer.nativeElement.clientHeight - 120; // padding + controls
      const viewport = page.getViewport({ scale: 1, rotation: this.rotation });
      const heightScale = containerHeight / viewport.height;
      this.scale = Math.max(heightScale, 0.75);
      this.renderPage(this.currentPage);
    });
  }

  // Rotation methods
  rotateLeft() {
    this.rotation = (this.rotation - 90) % 360;
    this.renderPage(this.currentPage);
  }

  rotateRight() {
    this.rotation = (this.rotation + 90) % 360;
    this.renderPage(this.currentPage);
  }

  // UI methods
  toggleControls() {
    this.showControls = !this.showControls;
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  toggleNightMode() {
    this.nightMode = !this.nightMode;
    if (this.nightMode) {
      this.backgroundColor = '#1a1a1a';
      this.textColor = '#ffffff';
    } else {
      this.backgroundColor = '#ffffff';
      this.textColor = '#000000';
    }
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  // Bookmark methods
  toggleBookmark() {
    const index = this.bookmarks.indexOf(this.currentPage);
    if (index > -1) {
      this.bookmarks.splice(index, 1);
      this.showToast('Bookmark removed');
    } else {
      this.bookmarks.push(this.currentPage);
      this.bookmarks.sort((a, b) => a - b);
      this.showToast('Page bookmarked');
    }
  }

  isBookmarked(): boolean {
    return this.bookmarks.includes(this.currentPage);
  }

  goToBookmark(pageNum: number) {
    this.renderPage(pageNum);
  }

  // Search methods
  async searchInPdf(term: string) {
    if (!this.pdfDoc || !term.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    this.searchResults = [];
    this.searchTerm = term.toLowerCase();

    try {
      for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
        const page = await this.pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ').toLowerCase();
        
        if (pageText.includes(this.searchTerm)) {
          this.searchResults.push({
            page: pageNum,
            text: pageText.substring(0, 100) + '...'
          });
        }
      }
      
      if (this.searchResults.length > 0) {
        this.currentSearchIndex = 0;
        this.showToast(`Found ${this.searchResults.length} results`);
      } else {
        this.showToast('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showToast('Search failed');
    } finally {
      this.isSearching = false;
    }
  }

  nextSearchResult() {
    if (this.searchResults.length === 0) return;
    
    this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchResults.length;
    const result = this.searchResults[this.currentSearchIndex];
    this.renderPage(result.page);
  }

  previousSearchResult() {
    if (this.searchResults.length === 0) return;
    
    this.currentSearchIndex = this.currentSearchIndex <= 0 ? 
      this.searchResults.length - 1 : this.currentSearchIndex - 1;
    const result = this.searchResults[this.currentSearchIndex];
    this.renderPage(result.page);
  }

  // Touch/gesture handlers for mobile
  onCanvasClick(event: any) {
    const rect = this.pdfCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const canvasWidth = rect.width;
    
    // Tap left side to go to previous page, right side for next page
    if (x < canvasWidth / 3) {
      this.previousPage();
    } else if (x > (canvasWidth * 2) / 3) {
      this.nextPage();
    } else {
      this.toggleControls();
    }
  }

  // Reading progress tracking methods
  updateReadingProgress() {
    debugger
    console.log('--- Attempting to update reading progress ---');
    const token = localStorage.getItem('token');
    const userId = TokenService.getUserId();
    console.log(`Token from localStorage: ${token ? 'Exists' : 'NULL'}`);
    console.log(`User ID from TokenService: ${userId}`);

    if (!userId || !this.book) {
      console.warn('Cannot update progress: Missing userId or book data.', { userId: userId, bookExists: !!this.book });
      return;
    }

    const progressData: ReadingProgressRequestDto = {
      bookId: this.book.id,
      currentPage: this.currentPage,
      totalPages: this.totalPages
    };

    this.bookService.updateReadingProgress(userId, progressData).subscribe({
      next: (response) => {
        if (response.success) {
          this.readingProgress = (this.currentPage / this.totalPages) * 100;
          console.log('Reading progress updated:', response.data);
        }
      },
      error: (error) => {
        console.error('Error updating reading progress:', error);
      }
    });
  }

  loadReadingProgress() {
    const userId = TokenService.getUserId();
    if (!userId || !this.book) {
      return;
    }

    this.bookService.getReadingProgress(userId, this.book.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const progress = response.data;
          this.readingProgress = progress.percentage;
          // Resume from last read page if available
          if (progress.currentPage > 1 && progress.currentPage <= this.totalPages) {
            this.renderPage(progress.currentPage);
          }
          console.log('Reading progress loaded:', progress);
        }
      },
      error: (error) => {
        console.error('Error loading reading progress:', error);
      }
    });
  }

  ngOnDestroy() {
    // Clean up any intervals or subscriptions
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }
}
