import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';

interface SystemSettings {
  siteName: string;
  communityName: string;
  adminEmail: string;
  maxUsersPerPage: number;
  allowSelfRegistration: boolean;
  requireApproval: boolean;
  maintenanceMode: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private apiService = inject(ApiService);

  loading = false;
  saving = false;
  activeTab: 'general' | 'users' | 'notifications' | 'security' = 'general';

  settings: SystemSettings = {
    siteName: 'Tenmiye',
    communityName: 'El Gheddiya, Teganet',
    adminEmail: 'admin@tenmiye.org',
    maxUsersPerPage: 20,
    allowSelfRegistration: true,
    requireApproval: true,
    maintenanceMode: false,
  };

  originalSettings: SystemSettings = { ...this.settings };

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    // In a real app, fetch settings from backend
    // For now, use default values
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }

  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  hasChanges(): boolean {
    return JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
  }

  saveSettings(): void {
    this.saving = true;

    // In a real app, send to backend
    setTimeout(() => {
      this.originalSettings = { ...this.settings };
      this.saving = false;
      this.bannerService.showSuccess('Settings saved successfully!');
    }, 1000);
  }

  resetSettings(): void {
    if (confirm('Reset all settings to defaults?')) {
      this.settings = { ...this.originalSettings };
      this.bannerService.showInfo('Settings reset to previous saved values');
    }
  }
}
