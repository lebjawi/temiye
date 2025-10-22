import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '@core/services/announcement.service';
import { Announcement, CreateAnnouncementDto, UpdateAnnouncementDto } from '@core/models/announcement.model';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss'],
})
export class AnnouncementsComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private announcementService = inject(AnnouncementService);

  announcements: Announcement[] = [];
  loading = false;
  showCreateModal = false;
  showEditModal = false;
  editingAnnouncement: Announcement | null = null;

  newAnnouncement: CreateAnnouncementDto = {
    title: '',
    content: '',
    isPinned: false,
    expiresAt: undefined,
  };

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.announcementService.getAllAnnouncements().subscribe({
      next: (announcements) => {
        // Sort: pinned first, then by date
        this.announcements = announcements.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load announcements: ${errorMessage}`);
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newAnnouncement = {
      title: '',
      content: '',
      isPinned: false,
      expiresAt: undefined,
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createAnnouncement(): void {
    if (!this.newAnnouncement.title || !this.newAnnouncement.content) {
      this.bannerService.showWarning('Title and content are required');
      return;
    }

    this.announcementService.createAnnouncement(this.newAnnouncement).subscribe({
      next: () => {
        this.bannerService.showSuccess('Announcement created successfully');
        this.loadAnnouncements();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating announcement:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to create announcement: ${errorMessage}`);
      },
    });
  }

  editAnnouncement(announcement: Announcement): void {
    this.editingAnnouncement = announcement;
    this.newAnnouncement = {
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().substring(0, 16)
        : undefined,
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingAnnouncement = null;
  }

  updateAnnouncement(): void {
    if (!this.editingAnnouncement) return;

    const updateData: UpdateAnnouncementDto = {
      title: this.newAnnouncement.title,
      content: this.newAnnouncement.content,
      isPinned: this.newAnnouncement.isPinned,
      expiresAt: this.newAnnouncement.expiresAt || null,
    };

    this.announcementService.updateAnnouncement(this.editingAnnouncement.id, updateData).subscribe({
      next: () => {
        this.bannerService.showSuccess('Announcement updated successfully');
        this.loadAnnouncements();
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error updating announcement:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to update announcement: ${errorMessage}`);
      },
    });
  }

  togglePin(announcement: Announcement): void {
    const action = announcement.isPinned ? 'unpin' : 'pin';
    const serviceCall = announcement.isPinned
      ? this.announcementService.unpinAnnouncement(announcement.id)
      : this.announcementService.pinAnnouncement(announcement.id);

    serviceCall.subscribe({
      next: () => {
        this.bannerService.showSuccess(`Announcement ${action}ned successfully`);
        this.loadAnnouncements();
      },
      error: (error) => {
        console.error(`Error ${action}ning announcement:`, error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to ${action} announcement: ${errorMessage}`);
      },
    });
  }

  deleteAnnouncement(announcement: Announcement): void {
    if (confirm(`Delete announcement "${announcement.title}"? This action cannot be undone.`)) {
      this.announcementService.deleteAnnouncement(announcement.id).subscribe({
        next: () => {
          this.bannerService.showSuccess('Announcement deleted successfully');
          this.loadAnnouncements();
        },
        error: (error) => {
          console.error('Error deleting announcement:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to delete announcement: ${errorMessage}`);
        },
      });
    }
  }

  isExpired(announcement: Announcement): boolean {
    if (!announcement.expiresAt) return false;
    return new Date(announcement.expiresAt) < new Date();
  }

  getDaysUntilExpiry(announcement: Announcement): number | null {
    if (!announcement.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(announcement.expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
