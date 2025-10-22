import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BannerComponent } from './components/banner/banner.component';

/**
 * SharedModule
 *
 * This module exports all shared functionality including:
 * - Components (BannerComponent)
 * - Models (User, Role, Tier, Admin)
 * - Utilities (OurLogs logging service)
 * - Common Angular modules (CommonModule, FormsModule, ReactiveFormsModule)
 *
 * Import this module in any feature module to get access to all shared functionality.
 *
 * @example
 * ```typescript
 * import { SharedModule } from '@shared/shared.module';
 *
 * @NgModule({
 *   imports: [SharedModule],
 *   // ...
 * })
 * export class FeatureModule { }
 * ```
 *
 * @example
 * Using BannerComponent in a component:
 * ```typescript
 * import { Component, ViewChild } from '@angular/core';
 * import { BannerComponent } from '@shared/components/banner/banner.component';
 *
 * export class MyComponent {
 *   @ViewChild(BannerComponent) banner!: BannerComponent;
 *
 *   showMessage() {
 *     this.banner.showSuccess('Operation successful!');
 *   }
 * }
 * ```
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BannerComponent
  ],
  exports: [
    // Re-export Angular common modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Export shared components
    BannerComponent
  ]
})
export class SharedModule { }
