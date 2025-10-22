import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { OurLogs } from './shared/utils/our-logs.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import * as AdminAuthActions from '@store/admin-auth/admin-auth.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BannerComponent],
  template: `
    <app-banner></app-banner>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent implements OnInit {
  private store = inject(Store);

  ngOnInit() {
    // Load user from storage on app initialization (before routing)
    this.store.dispatch(AdminAuthActions.loadUserFromStorage());

    this.demonstrateOurLogs();
  }

  private demonstrateOurLogs() {
    // Display all log types for demonstration
    OurLogs.group('🎨 Tenmiye - OurLogs Demo');

    // 1. Info log (blue)
    OurLogs.info('Application initialized successfully');

    // 2. Success log (green)
    OurLogs.success('Connected to Firebase', { status: 'online' });

    // 3. Warning log (orange)
    OurLogs.warn('Using development environment');

    // 4. Error log (red)
    OurLogs.error('Example error log', {
      code: 'DEMO_ERROR',
      message: 'This is just a demo'
    });

    // 5. Debug log (purple)
    OurLogs.debug('Debug information', {
      version: '1.0.0',
      buildTime: new Date().toISOString()
    });

    // 6. Custom styled log
    OurLogs.custom('Custom styled message', {
      prefix: '[CUSTOM]',
      color: '#FF1744',
      backgroundColor: '#FFE0E6',
      style: {
        fontWeight: 'bold',
        fontSize: '14px',
        border: '2px solid #FF1744'
      }
    });

    // 7. Log with timestamp
    OurLogs.custom('Message with timestamp', {
      showTimestamp: true,
      showLevel: true
    });

    // 8. Table log
    const sampleData = [
      { id: 1, name: 'Ahmed', role: 'Admin' },
      { id: 2, name: 'Fatima', role: 'Member' },
      { id: 3, name: 'Omar', role: 'Board' }
    ];
    OurLogs.table(sampleData, ['name', 'role']);

    // 9. Logger instance demo
    const moduleLogger = OurLogs.createLogger('[AuthModule]');
    moduleLogger.info('Module-specific logger example');

    OurLogs.groupEnd();

    // Standalone log after the group
    OurLogs.success('Check the console above to see all log types! 🎉');
  }
}
