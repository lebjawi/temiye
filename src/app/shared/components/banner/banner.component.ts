import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Banner {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent {
  banners: Banner[] = [];
  private bannerIdCounter = 0;

  /**
   * Show a success banner
   * @param message - The message to display
   * @param duration - Auto-dismiss timeout in milliseconds (default: 5000)
   */
  showSuccess(message: string, duration = 5000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error banner
   * @param message - The error message to display
   * @param duration - Auto-dismiss timeout in milliseconds (default: 5000)
   */
  showError(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a warning banner
   * @param message - The warning message to display
   * @param duration - Auto-dismiss timeout in milliseconds (default: 5000)
   */
  showWarning(message: string, duration = 5000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show an info banner
   * @param message - The info message to display
   * @param duration - Auto-dismiss timeout in milliseconds (default: 5000)
   */
  showInfo(message: string, duration = 5000): void {
    this.show(message, 'info', duration);
  }

  private show(message: string, type: Banner['type'], duration: number): void {
    const banner: Banner = {
      id: ++this.bannerIdCounter,
      message,
      type,
      duration,
    };
    this.banners.push(banner);

    if (duration) {
      setTimeout(() => {
        this.removeBanner(banner.id);
      }, duration);
    }
  }

  removeBanner(id: number): void {
    this.banners = this.banners.filter((b) => b.id !== id);
  }

  getBannerClass(type: Banner['type']): string {
    const classes = {
      success: 'banner-success',
      error: 'banner-error',
      warning: 'banner-warning',
      info: 'banner-info',
    };
    return classes[type];
  }

  getIcon(type: Banner['type']): string {
    const icons = {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return icons[type];
  }
}
