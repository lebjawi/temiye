import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { FormsModule } from '@angular/forms';
import { TierService } from '@core/services/tier.service';
import { Tier, CreateTierDto, UpdateTierDto } from '@core/models/tier.model';

@Component({
  selector: 'app-tiers',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './tiers.component.html',
  styleUrls: ['./tiers.component.scss'],
})
export class TiersComponent implements OnInit {
  @ViewChild(BannerComponent) private bannerService!: BannerComponent;

  private tierService = inject(TierService);

  tiers: Tier[] = [];
  loading = false;
  showCreateModal = false;
  editingTier: Tier | null = null;

  newTier: CreateTierDto = {
    id: '',
    name: '',
    level: 1,
    features: [],
    description: '',
  };

  // For managing features in the form
  newFeature = '';

  ngOnInit(): void {
    this.loadTiers();
  }

  loadTiers(): void {
    this.loading = true;
    this.tierService.getAllTiers().subscribe({
      next: (tiers) => {
        this.tiers = tiers.sort((a, b) => a.level - b.level);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tiers:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
        this.bannerService.showError(`Failed to load tiers: ${errorMessage}`);
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.editingTier = null;
    this.resetForm();
  }

  resetForm(): void {
    this.newTier = {
      id: '',
      name: '',
      level: 1,
      features: [],
      description: '',
    };
    this.newFeature = '';
  }

  addFeature(): void {
    if (this.newFeature.trim()) {
      this.newTier.features.push(this.newFeature.trim());
      this.newFeature = '';
    }
  }

  removeFeature(index: number): void {
    this.newTier.features.splice(index, 1);
  }

  createTier(): void {
    if (!this.newTier.id.trim() || !this.newTier.name.trim()) {
      this.bannerService.showWarning('Tier ID and name are required');
      return;
    }

    this.tierService.createTier(this.newTier).subscribe({
      next: () => {
        this.bannerService.showSuccess(`Tier "${this.newTier.name}" created successfully`);
        this.loadTiers();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating tier:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to create tier: ${errorMessage}`);
      },
    });
  }

  editTier(tier: Tier): void {
    this.editingTier = tier;
    this.newTier = {
      id: tier.id,
      name: tier.name,
      level: tier.level,
      features: [...tier.features],
      description: tier.description,
    };
    this.showCreateModal = true;
  }

  updateTier(): void {
    if (!this.editingTier) return;

    const updateData: UpdateTierDto = {
      name: this.newTier.name,
      features: this.newTier.features,
      description: this.newTier.description,
    };

    this.tierService.updateTier(this.editingTier.id, updateData).subscribe({
      next: () => {
        this.bannerService.showSuccess(`Tier "${this.newTier.name}" updated successfully`);
        this.loadTiers();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error updating tier:', error);
        const errorMessage = error?.error?.message || error?.message || 'Unknown error';
        this.bannerService.showError(`Failed to update tier: ${errorMessage}`);
      },
    });
  }

  deleteTier(tier: Tier): void {
    if (tier.isPredefined) {
      this.bannerService.showWarning('Cannot delete predefined tiers');
      return;
    }

    if (confirm(`Delete tier "${tier.name}"? This action cannot be undone.`)) {
      this.tierService.deleteTier(tier.id).subscribe({
        next: () => {
          this.bannerService.showSuccess(`Tier "${tier.name}" deleted successfully`);
          this.loadTiers();
        },
        error: (error) => {
          console.error('Error deleting tier:', error);
          const errorMessage = error?.error?.message || error?.message || 'Unknown error';
          this.bannerService.showError(`Failed to delete tier: ${errorMessage}`);
        },
      });
    }
  }

  getLevelBadgeClass(level: number): string {
    const classes: Record<number, string> = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-yellow-100 text-yellow-800',
    };
    return classes[level] || 'bg-gray-100 text-gray-800';
  }
}
