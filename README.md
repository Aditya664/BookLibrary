# BookLibrary - Modern E-Book Reader

![BookLibrary Banner](https://via.placeholder.com/1200x400/4a90e2/ffffff?text=BookLibrary+Modern+E-Book+Reader)

A modern, feature-rich e-book reader application built with Ionic, Angular, and PDF.js. BookLibrary offers a seamless reading experience with a beautiful, user-friendly interface.

## 📱 Features

### 📚 Modern Dashboard
- Clean, card-based layout with glass morphism effects
- Top 10 books by language section
- Personalized reading recommendations
- Quick access to recent reads

### 📖 Advanced PDF Reader
- Smooth page navigation with gestures
- Collapsible control tray for distraction-free reading
- Zoom and fit-to-screen options
- Search within documents
- Table of contents navigation
- Bookmarking and annotations

### 🔍 Smart Search & Filter
- Search across your entire library
- Filter by language, category, and reading progress
- Quick access to recently viewed books

### 🎨 Customizable Reading Experience
- Multiple reading themes (light, dark, sepia)
- Adjustable font size and typeface
- Customizable brightness and contrast
- Night mode for comfortable reading in low light

### 🔄 Sync & Backup
- Cloud sync across devices
- Automatic backup of reading progress
- Export/import bookmarks and notes

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm 8+
- Ionic CLI 6+
- Angular CLI 13+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/BookLibrary.git
   cd BookLibrary
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   ionic serve
   ```

4. For Android/iOS builds:
   ```bash
   # Add platforms
   ionic capacitor add android
   ionic capacitor add ios
   
   # Build and sync
   ionic build
   npx cap sync
   ```
## 🛠 Technical Stack

- **Frontend Framework**: Angular 13+
- **UI Framework**: Ionic 6+
- **PDF Rendering**: PDF.js
- **State Management**: RxJS
- **Styling**: SCSS with CSS Variables
- **Build Tool**: Angular CLI
- **Mobile**: Capacitor 4+

## 📂 Project Structure

```
src/
├── app/
│   ├── core/               # Core module (services, guards, interceptors)
│   ├── shared/             # Shared components, directives, pipes
│   ├── dashboard/          # Dashboard page
│   ├── read-book/          # PDF reader component
│   ├── book-details/       # Book details page
│   ├── see-all-books/      # All books listing
│   ├── profile/            # User profile
│   └── tabs/               # Main navigation tabs
├── assets/                # Static assets
├── theme/                 # Global styles and variables
└── environments/          # Environment configurations
```

## 🌟 Key Features in Detail

### PDF Reader
- Smooth page transitions
- Text selection and highlighting
- Dictionary lookup
- Night mode
- Customizable reading themes
- Page thumbnails
- Search within document
- Bookmark management

### User Experience
- Gesture-based navigation
- Offline reading support
- Cross-platform compatibility
- Responsive design
- Accessibility features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ionic Framework](https://ionicframework.com/)
- [Angular](https://angular.io/)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [Capacitor](https://capacitorjs.com/)

---

Made with ❤️ by Aditya Deshmukh
