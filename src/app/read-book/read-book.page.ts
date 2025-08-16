import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NavController,
  Platform,
  LoadingController,
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { BookService } from '../services/book.service';
import { TokenService } from '../services/token.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { ReadingProgressRequestDto } from '../Model/ApiResponse';
import { Subscription, Subject } from 'rxjs';
import { SubscriptionModalComponent } from './subscription-modal.component';
// NOTE: using window.pdfjsLib dynamic loader approach to avoid bundling issues.
// Make sure pdfjs-dist is available via npm or CDN in your environment.

@Component({
  selector: 'app-read-book',
  templateUrl: './read-book.page.html',
  styleUrls: ['./read-book.page.scss'],
  standalone: false,
})
export class ReadBookPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pdfCanvas', { static: false })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfContainer', { static: false })
  pdfContainer!: ElementRef<HTMLDivElement>;

  book: any = null;
  bookId: string | null = null;

  // UI State
  isLoading = false;
  showControls = true;
  showSettings = false;
  isRendering = false;
  headerScrolled = false;
  isFullscreen = false;
  nightMode = false;
  trayCollapsed = false;
  private lastScrollPosition = 0;
  private scrollThreshold = 50; // pixels to scroll before hiding/showing controls

  // Settings
  brightness = 100;
  backgroundColor = '#ffffff';
  textColor = '#000000';
  fontSize = 16;
  fontFamily = 'Arial';

  // PDF state
  pdfDoc: any = null;
  currentPage = 1;
  userId: string | null = null;
  private autoSaveInterval: any;
  private lastSavedPage = 0;
  private isSavingProgress = false;
  private lastSavedProgress = 0;
  private lastReadPage = 1; // Track the last read page for navigation
  currentPageChange = new Subject<number>();
  totalPages = 0;
  scale = 1.0;
  rotation = 0;
  pageRendering = false;
  pageIsRendered = false;
  pageNumPending: number | null = null;
  sessionStart!: number;

  // Search & bookmarks
  bookmarks: number[] = [];
  searchTerm = '';
  searchResults: Array<{ page: number; text: string }> = [];
  currentSearchIndex = -1;
  isSearching = false;

  // Progress tracking
  readingProgress = 0; // percent
  progressInterval: any = null;
  progressCleanup: (() => void) | null = null;

  // Event listener references (so we can remove them)
  private boundOnScroll: any = null;
  private boundOnResize: any = null;
  private boundFullscreenHandler: any = null;
  private platformPauseSub: Subscription | null = null;
  private subscriptionExpired = false;
  // store cleanup functions
  private pdfjsLoaded = false;
  private workerVersion = '5.4.54'; // change if you change CDN version

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private bookService: BookService,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {
    this.checkPlatform();
  }

  async startReading(): Promise<void> {
    await this.platform.ready();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.bookId = id;
        this.loadBook();
      }
    });
  }

  // ngOnDestroy(): void {
  //   // End session on closing
  //   this.readingService.endSession(this.bookId).subscribe();
  // }
  // ---------------------------
  // Lifecycle
  // ---------------------------
  async ngOnInit() {
    this.sessionStart = Date.now();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.bookId = id;
        this.bookService
          .checkUsage(TokenService.getUserId() ?? '')
          .subscribe((res: any) => {
            if (!res.hasTimeLeft) {
              console.log('limit exceeded');
              setTimeout(async () => {
                this.openSubscriptionModal();
              }, 10);
            } else {
              this.bookService
                .startSession(
                  TokenService.getUserId() ?? '',
                  this.bookId?.toString() ?? ''
                )
                .subscribe(() => {
                  this.loadBook();
                });
            }
          });
      }
    });
  }

  ngAfterViewInit() {
    // load pdf.js once the view is ready
    this.loadPdfJs().catch((err) => {
      console.error('Failed to load pdfjs:', err);
      this.showToast('PDF viewer failed to initialize');
    });
  }

  async ngOnDestroy() {
    console.log('ReadBookPage destroy');

    // Attempt final save
    if (this.userId && this.book && this.currentPage !== this.lastSavedPage) {
      try {
        await this.saveReadingProgress();
      } catch (err) {
        console.error('Final save error:', err);
      }
    }

    // cleanup progress tracking
    if (this.progressCleanup) {
      try {
        this.progressCleanup();
      } catch (e) {
        console.error('Error during progress cleanup:', e);
      } finally {
        this.progressCleanup = null;
      }
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // remove event listeners (use stored references)
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.boundOnScroll);
      window.removeEventListener('resize', this.boundOnResize);
    }
    document.removeEventListener(
      'fullscreenchange',
      this.boundFullscreenHandler
    );
    document.removeEventListener(
      'webkitfullscreenchange',
      this.boundFullscreenHandler
    );
    document.removeEventListener(
      'mozfullscreenchange',
      this.boundFullscreenHandler
    );
    document.removeEventListener(
      'MSFullscreenChange',
      this.boundFullscreenHandler
    );

    // unsubscribe platform pause
    if (this.platformPauseSub) {
      this.platformPauseSub.unsubscribe();
      this.platformPauseSub = null;
    }

    // exit fullscreen
    if (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement
    ) {
      try {
        await this.toggleFullscreen();
      } catch (e) {
        console.warn('Failed to exit fullscreen on destroy', e);
      }
    }

    // cleanup pdf doc
    if (this.pdfDoc) {
      try {
        await this.pdfDoc.cleanup();
        await this.pdfDoc.destroy();
      } catch (e) {
        console.error('Error destroying pdfDoc', e);
      } finally {
        this.pdfDoc = null;
      }
    }

    // clear canvas
    try {
      if (this.pdfCanvas?.nativeElement) {
        const canvas = this.pdfCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 1;
        canvas.height = 1;
      }
    } catch (e) {
      console.error('Error clearing canvas', e);
    }
    const sessionMinutes = Math.floor((Date.now() - this.sessionStart) / 60000);
    this.bookService
      .endSession(
        TokenService.getUserId() ?? '',
        this.bookId ?? '',
        sessionMinutes.toString()
      )
      .subscribe();
    console.log('Cleanup complete');
  }

  // ---------------------------
  // Helpers & Initialization
  // ---------------------------
  private resetStateForNewBook() {
    this.book = null;
    this.pdfDoc = null;
    this.currentPage = 1;
    this.lastSavedPage = 1;
    this.readingProgress = 0;
    this.totalPages = 0;
    this.searchResults = [];
    this.bookmarks = [];
    this.pageIsRendered = false;
    this.pageRendering = false;
    this.pageNumPending = null;
  }

  private checkPlatform() {
    // convenience
    // this.isMobile example is not stored as property since you can call platform.is when needed
  }

  private async initializeApp() {
    try {
      if (this.platform.is('capacitor')) {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#000000' });
        await ScreenOrientation.lock({ orientation: 'portrait' });
      }
    } catch (e) {
      console.warn('Platform init error', e);
    }

    // subscribe to pause for saving
    try {
      this.platformPauseSub = this.platform.pause.subscribe(() => {
        if (this.currentPage !== this.lastSavedPage) {
          this.saveReadingProgress().catch((err) =>
            console.error('Error saving on pause', err)
          );
        }
      });
    } catch (e) {
      // subscribe may not exist in some contexts - ignore gracefully
    }
  }

  // ---------------------------
  // PDF.js loader
  // ---------------------------
  private async loadPdfJs(): Promise<void> {
    // Check if already loaded
    if (this.pdfjsLoaded) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      // Use the ES modules version
      const script = document.createElement('script');
      script.type = 'module';

      // Inline script to handle the module import
      script.textContent = `
        import * as pdfjsLib from '../../assets/pdf.min.mjs';
        
        // Set worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = '../../assets/pdf.worker.mjs';
        
        // Expose to window for legacy code
        window.pdfjsLib = pdfjsLib;
        
        // Dispatch event when loaded
        window.dispatchEvent(new CustomEvent('pdfjsLoaded'));
      `;

      // Handle load event
      const onLoad = () => {
        // Add a small delay to ensure the module is fully initialized
        setTimeout(() => {
          if (
            (window as any)['pdfjsLib'] &&
            (window as any)['pdfjsLib'].getDocument
          ) {
            this.pdfjsLoaded = true;
            console.log('PDF.js loaded successfully');
            resolve();
          } else {
            reject(new Error('PDF.js API not available after load'));
          }
        }, 100);
      };

      // Handle errors
      script.onerror = (error) => {
        console.error('Failed to load PDF.js module:', error);
        reject(new Error('Failed to load PDF viewer. Please try again.'));
      };

      // Listen for our custom event
      window.addEventListener('pdfjsLoaded', onLoad, { once: true });

      // Add to document
      document.head.appendChild(script);
    });
  }

  // ---------------------------
  // Load book & PDF content
  // ---------------------------
  // Toggle tray collapse state
  toggleTray() {
    this.trayCollapsed = !this.trayCollapsed;
  }

  // Handle scroll events for auto-hiding controls
  onScroll(event: any) {
    if (this.isFullscreen) return;

    const currentScroll = event.detail.scrollTop;
    const scrollDiff = currentScroll - this.lastScrollPosition;

    // Only show/hide if scrolled more than threshold
    if (Math.abs(scrollDiff) > this.scrollThreshold) {
      this.showControls = scrollDiff < 0 || currentScroll < 50;
      this.lastScrollPosition = currentScroll;
    }

    // Update header state
    this.headerScrolled = currentScroll > 10;
  }

  async loadBook() {
    if (!this.bookId) return;
    const loading = await this.loadingCtrl.create({
      message: 'Loading book...',
      spinner: 'crescent',
    });
    await loading.present();

    // Reset tray state when loading new book
    this.trayCollapsed = false;

    try {
      // First ensure view is initialized
      if (!this.pdfCanvas) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Load book details
      const response: any = await this.bookService
        .getBookById(this.bookId)
        .toPromise();
      if (!response?.success || !response.data) {
        throw new Error('Failed to load book details');
      }
      this.book = response.data;

      // Get user ID
      const uId = TokenService.getUserId ? TokenService.getUserId() : null;
      if (uId) {
        this.userId = uId;
      }

      // Wait for pdfjs to be available
      if (!this.pdfjsLoaded) {
        await this.loadPdfJs();
      }

      // Ensure view is ready
      if (!this.pdfCanvas?.nativeElement) {
        console.warn('PDF canvas not ready, retrying...');
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Load PDF content first
      await this.loadPdf();

      // Now load reading progress after PDF is loaded
      if (this.userId) {
        await this.loadReadingProgress();
      }
    } catch (err) {
      console.error('Error in loadBook', err);
      this.showToast('Error loading book');
    } finally {
      loading.dismiss();
    }
  }

  async loadPdf(): Promise<void> {
    if (!this.book?.pdfFile) {
      this.showToast('No PDF content available for this book');
      throw new Error('No PDF content');
    }
    this.isLoading = true;

    // Reset PDF doc if it exists
    if (this.pdfDoc) {
      try {
        await this.pdfDoc.cleanup();
        await this.pdfDoc.destroy();
      } catch (e) {
        console.warn('Error cleaning up previous PDF', e);
      }
      this.pdfDoc = null;
    }

    try {
      // Prepare pdf data (base64 or ArrayBuffer/Uint8Array)
      let pdfData: Uint8Array;
      const content = this.book.pdfFile;

      if (typeof content === 'string') {
        // handle potential data URL
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
      } else {
        throw new Error('Unsupported PDF format');
      }

      // use pdfjs from window
      const pdfjs = (window as any).pdfjsLib;
      if (!pdfjs) throw new Error('pdfjsLib not loaded');

      const loadingTask = pdfjs.getDocument({
        data: pdfData,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${this.workerVersion}/cmaps/`,
        cMapPacked: true,
        disableAutoFetch: false,
        disableRange: false,
        useWorkerFetch: true,
      });

      loadingTask.onProgress = (p: { loaded: number; total?: number }) => {
        if (p.total) {
          const percent = Math.round((p.loaded / p.total) * 100);
          console.log(`PDF load progress ${percent}%`);
        }
      };

      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages || 0;
      console.log('PDF loaded pages:', this.totalPages);

      // For single-page PDFs, ensure we render the page
      if (this.totalPages === 1) {
        this.currentPage = 1;
        await this.renderPage(1);
      }

      // Setup progress tracking
      if (!this.progressCleanup) {
        this.progressCleanup = this.setupProgressTracking();
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      this.showToast('Failed to load PDF');
      // cleanup pdfDoc if something went wrong
      if (this.pdfDoc) {
        try {
          await this.pdfDoc.cleanup();
          await this.pdfDoc.destroy();
        } catch (e) {}
        this.pdfDoc = null;
      }
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  // ---------------------------
  // Rendering
  // ---------------------------
  async renderPage(pageNum: number) {
    if (!this.pdfDoc) {
      console.warn('No PDF document loaded');
      return;
    }

    // Validate page number
    if (pageNum < 1 || pageNum > this.totalPages) {
      console.warn(`Invalid page number: ${pageNum}`);
      return;
    }

    // Ensure canvas is available
    if (!this.pdfCanvas?.nativeElement) {
      console.warn('Canvas element not available, retrying...');
      this.pageNumPending = pageNum;
      setTimeout(() => this.renderPage(pageNum), 100);
      return;
    }

    // Queue page if already rendering
    if (this.isRendering) {
      this.pageNumPending = pageNum;
      return;
    }

    this.isRendering = true;
    this.pageIsRendered = false;

    try {
      // Get the page
      const page = await this.pdfDoc.getPage(pageNum);
      const canvas = this.pdfCanvas?.nativeElement;

      if (!canvas) {
        throw new Error('PDF canvas element not found');
      }

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2D context from canvas');
      }

      // Calculate viewport
      const container = this.pdfContainer?.nativeElement;
      const containerWidth = container
        ? Math.max(200, container.clientWidth - 40)
        : 800;

      // Get the viewport at 100% scale to calculate the proper scale
      const viewport = page.getViewport({
        scale: 1.0,
        rotation: this.rotation,
      });

      // Calculate scale to fit width by default
      let desiredScale = this.scale;
      if (this.scale === 1.0) {
        desiredScale = (containerWidth / viewport.width) * 0.95; // 95% to add some padding
        desiredScale = Math.max(0.5, Math.min(desiredScale, 2.0)); // Keep within reasonable bounds
      }

      // Get the final viewport with the desired scale and rotation
      const scaledViewport = page.getViewport({
        scale: desiredScale,
        rotation: this.rotation,
      });

      // Handle high DPI displays
      const outputScale = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(scaledViewport.width);
      const displayHeight = Math.floor(scaledViewport.height);
      const canvasWidth = Math.floor(displayWidth * outputScale);
      const canvasHeight = Math.floor(displayHeight * outputScale);

      // Only resize if dimensions have changed
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
      }

      // Clear and set background
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = this.nightMode ? '#121212' : '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Save context state before transformations
      context.save();

      // Apply device pixel ratio
      context.scale(outputScale, outputScale);

      // Show loading message for large pages
      if (displayWidth * displayHeight > 4000000) {
        context.fillStyle = this.nightMode ? '#ffffff80' : '#00000080';
        context.font = '16px Arial';
        context.textAlign = 'center';
        context.fillText(
          'Rendering page...',
          displayWidth / 2,
          displayHeight / 2
        );
      }

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
        intent: 'display',
        enableWebGL: true,
        renderInteractiveForms: false,
      };

      // Perform the actual rendering
      await page.render(renderContext).promise;

      // Restore context state
      context.restore();

      // Update component state
      this.currentPage = pageNum;
      this.pageIsRendered = true;
      this.scale = desiredScale;

      // Update progress and notify
      this.updateReadingProgressLocal();
      this.currentPageChange.next(this.currentPage);
      this.lastSavedPage = this.lastSavedPage || this.currentPage;

      console.log(
        `Rendered page ${pageNum} at ${Math.round(desiredScale * 100)}%`
      );
    } catch (err) {
      console.error('Render error', err);
      this.showToast(`Error displaying page ${pageNum}`);
      if (pageNum !== 1) {
        // try fallback
        await this.renderPage(1);
      }
    } finally {
      this.isRendering = false;
      // if a pending render was requested while rendering, run it now
      if (this.pageNumPending && this.pageNumPending !== this.currentPage) {
        const next = this.pageNumPending;
        this.pageNumPending = null;
        this.renderPage(next).catch((e) =>
          console.error('Pending render failed', e)
        );
      }
    }
  }

  async navigateToPage(pageNum: number, showLoader = true): Promise<void> {
    // Validate page number
    if (pageNum < 1 || pageNum > this.totalPages) {
      console.warn(
        `Invalid page number: ${pageNum}. Must be between 1 and ${this.totalPages}`
      );
      return;
    }

    // Don't do anything if we're already on this page
    if (pageNum === this.currentPage && this.pageIsRendered) {
      return;
    }

    try {
      // Update current page and render
      this.currentPage = pageNum;
      await this.renderPage(pageNum);

      // Update progress bar in UI
      if (this.totalPages > 0) {
        this.readingProgress = Math.round(
          (this.currentPage / this.totalPages) * 100
        );
      }

      // Save progress when navigating to a new page
      // Only save if we have a valid user and book ID
      if (this.userId && this.bookId) {
        // Don't show loader for page turns to avoid UI flicker
        // The save operation will still happen in the background
        this.saveReadingProgress(false);
      }
    } catch (error) {
      console.error('Error navigating to page:', error);
      this.showToast('Failed to load page');
      throw error; // Re-throw to allow caller to handle if needed
    }
  }

  // ---------------------------
  // Navigation & UI
  // ---------------------------
  goBack() {
    this.navCtrl.back();
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  async toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    this.showControls = !this.isFullscreen;

    if (this.platform.is('cordova')) {
      const { StatusBar } = await import('@capacitor/status-bar');

      if (this.isFullscreen) {
        await StatusBar.hide();
      } else {
        await StatusBar.show();
      }
    }

    // Force reflow and re-render after a short delay
    setTimeout(() => {
      if (this.pdfContainer?.nativeElement) {
        this.pdfContainer.nativeElement.style.display = 'none';
        this.pdfContainer.nativeElement.offsetHeight; // Force reflow
        this.pdfContainer.nativeElement.style.display = 'flex';
      }
      this.renderPage(this.currentPage);
    }, 150);
  }

  previousPage() {
    if (this.currentPage > 1) this.renderPage(this.currentPage - 1);
  }

  nextPage() {
    if (this.currentPage < this.totalPages)
      this.renderPage(this.currentPage + 1);
  }

  goToPage(page: any) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.totalPages) {
      this.renderPage(pageNum);
    }
  }

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
      const containerWidth = Math.max(
        200,
        (this.pdfContainer?.nativeElement?.clientWidth || 600) - 40
      );
      const viewport = page.getViewport({ scale: 1, rotation: this.rotation });
      const widthScale = containerWidth / viewport.width;
      this.scale = Math.max(widthScale, 0.75);
      this.renderPage(this.currentPage);
    });
  }

  fitToHeight() {
    if (!this.pdfDoc) return;
    this.pdfDoc.getPage(this.currentPage).then((page: any) => {
      const containerHeight = Math.max(
        200,
        (this.pdfContainer?.nativeElement?.clientHeight || 600) - 120
      );
      const viewport = page.getViewport({ scale: 1, rotation: this.rotation });
      const heightScale = containerHeight / viewport.height;
      this.scale = Math.max(heightScale, 0.75);
      this.renderPage(this.currentPage);
    });
  }

  resetZoom() {
    this.scale = 1.0;
    this.renderPage(this.currentPage);
  }

  rotateLeft() {
    this.rotation = (this.rotation - 90 + 360) % 360;
    this.renderPage(this.currentPage);
  }

  rotateRight() {
    this.rotation = (this.rotation + 90) % 360;
    this.renderPage(this.currentPage);
  }

  toggleControls() {
    this.showControls = !this.showControls;
  }

  toggleNightMode() {
    this.nightMode = !this.nightMode;
    this.backgroundColor = this.nightMode ? '#1a1a1a' : '#ffffff';
    this.textColor = this.nightMode ? '#ffffff' : '#000000';
    // re-render to apply background
    this.renderPage(this.currentPage);
  }

  // ---------------------------
  // Bookmarks
  // ---------------------------
  toggleBookmark() {
    if (!this.bookId) return;
    this.bookService
      .addBookToFavoritesAsync({
        bookId: this.book?.id.toString() ?? '',
        userId: TokenService.getUserId() ?? '',
      })
      .subscribe(() => {
        const index = this.bookmarks.indexOf(this.currentPage);
        if (index > -1) {
          this.bookmarks.splice(index, 1);
          this.showToast('Bookmark removed');
        } else {
          this.bookmarks.push(this.currentPage);
          this.bookmarks.sort((a, b) => a - b);
          this.showToast('Page bookmarked');
        }
      });
  }

  isBookmarked(): boolean {
    return this.bookId ? this.bookmarks.includes(this.currentPage) : false;
  }

  goToBookmark(pageNum: number) {
    this.renderPage(pageNum);
  }

  // ---------------------------
  // Search
  // ---------------------------
  async searchInPdf(term: string) {
    if (!this.pdfDoc || !term?.trim()) {
      this.searchResults = [];
      return;
    }
    this.isSearching = true;
    this.searchResults = [];
    this.searchTerm = term.toLowerCase();

    try {
      for (let p = 1; p <= this.totalPages; p++) {
        const page = await this.pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((i: any) => i.str)
          .join(' ')
          .toLowerCase();
        if (pageText.includes(this.searchTerm)) {
          this.searchResults.push({
            page: p,
            text: pageText.substring(0, 200) + '...',
          });
        }
      }

      if (this.searchResults.length > 0) {
        this.currentSearchIndex = 0;
        this.showToast(`Found ${this.searchResults.length} result(s)`);
        this.renderPage(this.searchResults[0].page);
      } else {
        this.showToast('No results found');
      }
    } catch (err) {
      console.error('Search failed', err);
      this.showToast('Search failed');
    } finally {
      this.isSearching = false;
    }
  }

  nextSearchResult() {
    if (this.searchResults.length === 0) return;
    this.currentSearchIndex =
      (this.currentSearchIndex + 1) % this.searchResults.length;
    const r = this.searchResults[this.currentSearchIndex];
    this.renderPage(r.page);
  }

  previousSearchResult() {
    if (this.searchResults.length === 0) return;
    this.currentSearchIndex =
      (this.currentSearchIndex - 1 + this.searchResults.length) %
      this.searchResults.length;
    const r = this.searchResults[this.currentSearchIndex];
    this.renderPage(r.page);
  }

  // ---------------------------
  // Canvas touch
  // ---------------------------
  onCanvasClick(event: any) {
    try {
      const rect = this.pdfCanvas.nativeElement.getBoundingClientRect();
      const x = (event.clientX ?? event.touches?.[0]?.clientX) - rect.left;
      const canvasWidth = rect.width;
      if (x < canvasWidth / 3) this.previousPage();
      else if (x > (canvasWidth * 2) / 3) this.nextPage();
      else this.toggleControls();
    } catch (e) {
      // ignore
    }
  }

  // ---------------------------
  // Reading progress: load/save
  // ---------------------------
  private async loadReadingProgress(): Promise<void> {
    if (!this.bookId) {
      console.warn('No book ID available for loading progress');
      return;
    }

    // Get user ID if not available
    if (!this.userId) {
      this.userId = TokenService.getUserId ? TokenService.getUserId() : null;
      if (!this.userId) {
        console.warn('No user ID available for progress');
        return;
      }
    }

    let loading: HTMLIonLoadingElement | null = null;

    try {
      // Only show loading if we don't have a current page yet or we're on the first page
      if (this.currentPage <= 1) {
        loading = await this.loadingCtrl.create({
          message: 'Loading your progress...',
          spinner: 'crescent',
          duration: 2000,
          showBackdrop: false,
          cssClass: 'progress-loading',
          translucent: true,
        });
        await loading.present();
      }

      const response = await this.bookService
        .getReadingProgress(this.userId, +this.bookId)
        .toPromise();

      if (response?.success && response.data) {
        const progress = response.data;
        const savedPage = progress.currentPage || 1;

        // Only update if we have a valid saved page
        if (savedPage > 0) {
          console.log(
            `Loaded progress: page ${savedPage}/${this.totalPages} (${
              progress.percentage || 0
            }%)`
          );

          // Update progress and last read page
          this.readingProgress = progress.percentage || 0;
          this.lastReadPage = savedPage;

          // Only update current page if we're not already on it
          if (savedPage !== this.currentPage) {
            // Make sure we have a valid page number
            const targetPage = Math.max(
              1,
              Math.min(savedPage, this.totalPages)
            );

            // Update current page without triggering a save
            this.currentPage = targetPage;

            // Render the page
            await this.renderPage(targetPage);

            // Update the progress bar
            this.readingProgress = Math.round(
              (targetPage / this.totalPages) * 100
            );

            console.log(`Navigated to saved page: ${targetPage}`);
          }
        }
      } else {
        // If no progress found, ensure we're on the first page
        if (this.currentPage !== 1) {
          console.log('No saved progress found, going to first page');
          this.currentPage = 1;
          await this.renderPage(1);
        }
      }
    } catch (error) {
      console.error('Error loading reading progress:', error);
      // Fall back to first page on error
      if (this.currentPage !== 1) {
        this.currentPage = 1;
        await this.renderPage(1);
      }
    } finally {
      if (loading) {
        try {
          await loading.dismiss();
        } catch (e) {
          console.warn('Error dismissing loading:', e);
        }
      }
    }
  }

  private async saveReadingProgress(showLoader = true): Promise<void> {
    // Validate we have everything we need
    if (!this.userId) {
      console.warn('Cannot save progress: No user ID');
      return;
    }

    if (!this.bookId) {
      console.warn('Cannot save progress: No book ID');
      return;
    }

    // Don't save if we're already saving or if page hasn't changed
    if (this.isSavingProgress || this.currentPage === this.lastSavedPage) {
      return;
    }

    this.isSavingProgress = true;
    let loading: HTMLIonLoadingElement | null = null;

    try {
      // Only show loader if explicitly requested and not already showing one
      if (showLoader && !this.loadingCtrl.getTop()) {
        loading = await this.loadingCtrl.create({
          message: 'Saving progress...',
          duration: 2000,
          spinner: 'crescent',
          showBackdrop: false,
          cssClass: 'progress-saving',
          translucent: true,
        });
        await loading.present();
      }

      // Calculate progress percentage
      const progress = Math.min(
        100,
        Math.round((this.currentPage / this.totalPages) * 100)
      );

      // Update progress on server
      await this.bookService
        .updateReadingProgress(this.userId, {
          bookId: +this.bookId,
          currentPage: this.currentPage,
          totalPages: this.totalPages,
        } as ReadingProgressRequestDto)
        .toPromise();

      // Update local state
      this.lastSavedPage = this.currentPage;
      this.readingProgress = progress;

      // Update loading message if shown
      if (loading) {
        loading.message = 'Progress saved!';
        loading.duration = 1000;
      }

      console.log(
        `Progress saved: page ${this.currentPage}/${this.totalPages} (${progress}%)`
      );
    } catch (error) {
      console.error('Error saving reading progress:', error);

      // Show error to user if we have a loading indicator
      if (loading) {
        loading.message = 'Failed to save progress';
        loading.duration = 2000;
      } else {
        // If no loading indicator, show a brief toast
        this.showToast('Failed to save progress');
      }
    } finally {
      // Clean up loading indicator
      if (loading) {
        try {
          await loading.dismiss();
        } catch (e) {
          console.warn('Error dismissing loading:', e);
        }
      }
      this.isSavingProgress = false;
    }

    this.isSavingProgress = true;
    try {
      const payload: ReadingProgressRequestDto = {
        bookId: +this.book.id,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
      };
      await this.bookService
        .updateReadingProgress(this.userId, payload)
        .toPromise();
      this.lastSavedPage = this.currentPage;
      this.readingProgress =
        this.totalPages > 0
          ? Math.round((this.currentPage / this.totalPages) * 100)
          : 0;
      console.log('Progress saved', payload);
    } catch (err) {
      console.error('Save reading progress error', err);
      this.showToast('Failed to save reading progress');
    } finally {
      this.isSavingProgress = false;
    }
  }

  // local progress update (non-network)
  private updateReadingProgressLocal() {
    if (!this.userId || !this.book) return;
    const percent =
      this.totalPages > 0
        ? Math.round((this.currentPage / this.totalPages) * 100)
        : 0;
    this.readingProgress = percent;
    // send network update (debounced or immediate depending on your needs)
    // we'll call service via updateReadingProgressLocal to avoid double-save with progressInterval
    this.bookService
      .updateReadingProgress(this.userId, {
        bookId: +this.book.id,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
      })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.lastSavedPage = this.currentPage;
          }
        },
        error: (err: any) => {
          console.warn('Non-blocking save failed', err);
        },
      });
  }

  // ---------------------------
  // Progress auto-save & cleanup
  // ---------------------------
  private setupProgressTracking(): () => void {
    console.log('setupProgressTracking');
    // clear existing
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // guard
    if (!this.userId || !this.book?.id) {
      console.warn('Skipping progress tracking: missing user or book id');
      return () => {};
    }

    // auto-save every 30s if page changed
    this.isLoading = true;
    this.progressInterval = window.setInterval(() => {
      if (this.currentPage !== this.lastSavedPage) {
        this.saveReadingProgress().catch((e) =>
          console.error('Auto-save failed', e)
        );
      }
    }, 30000);

    // visibility change -> save immediately when hidden
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (this.currentPage !== this.lastSavedPage) {
          this.saveReadingProgress().catch((e) =>
            console.error('Visibility save failed', e)
          );
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // platform pause handled via subscription already in initializeApp

    // cleanup function
    return () => {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      // final save
      if (this.currentPage !== this.lastSavedPage) {
        this.saveReadingProgress().catch((e) =>
          console.error('Final save in cleanup failed', e)
        );
      }
    };
  }

  // ---------------------------
  // Utilities & events
  // ---------------------------
  // private onScroll(event: any) {
  //   const scrollTop = event?.detail?.scrollTop ?? (window.pageYOffset || document.documentElement.scrollTop || 0);
  //   this.headerScrolled = scrollTop > 50;
  // }

  private onWindowResize() {
    if (this.pdfDoc && this.pageIsRendered) {
      this.renderPage(this.currentPage).catch((e) =>
        console.error('Resize render failed', e)
      );
    }
  }

  private onFullscreenChange() {
    this.isFullscreen = !!(
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
  }

  // ---------------------------
  // Small helpers
  // ---------------------------
  truncateText(text: string, limit = 20) {
    if (!text) return '';
    return text.length <= limit ? text : text.substring(0, limit) + '...';
  }

  async showToast(message: string) {
    const t = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
    });
    await t.present();
  }

  async openSubscriptionModal() {
    const modal = await this.modalCtrl.create({
      component: SubscriptionModalComponent, // 👈 use the component class
      cssClass: 'subscription-modal-wrapper',
    });
    await modal.present();
  }
}
