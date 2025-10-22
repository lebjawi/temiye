import { Injectable } from '@angular/core';

interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  /**
   * Set item with optional expiry
   */
  setItem<T>(key: string, value: T, expiryMinutes?: number): void {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: expiryMinutes ? Date.now() + expiryMinutes * 60 * 1000 : null,
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Get item with expiry check
   */
  getItem<T>(key: string): T | null {
    const itemJson = localStorage.getItem(key);
    if (!itemJson) return null;

    try {
      const item: StorageItem<T> = JSON.parse(itemJson);

      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Error parsing localStorage item:', error);
      return null;
    }
  }

  /**
   * Remove item
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all storage
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Check if item exists and is valid
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}
