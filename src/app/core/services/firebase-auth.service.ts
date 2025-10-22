import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, UserCredential } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { User as FirebaseUser } from 'firebase/auth';
import { OurLogs } from '@shared/utils/our-logs.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private auth = inject(Auth);
  private googleProvider = new GoogleAuthProvider();

  // Observable of current user
  user$: Observable<FirebaseUser | null> = user(this.auth);

  constructor() {
    OurLogs.info('[FirebaseAuthService] Service initialized');

    // Log auth state changes
    this.user$.subscribe((user) => {
      if (user) {
        OurLogs.debug('[FirebaseAuthService] Auth state changed - User signed in', {
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified,
        });
      } else {
        OurLogs.debug('[FirebaseAuthService] Auth state changed - User signed out');
      }
    });
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<UserCredential> {
    OurLogs.info('[FirebaseAuthService] signInWithGoogle called');

    try {
      OurLogs.debug('[FirebaseAuthService] Opening Google OAuth popup');
      const credential = await signInWithPopup(this.auth, this.googleProvider);

      OurLogs.success('[FirebaseAuthService] Google sign-in successful', {
        email: credential.user.email,
        uid: credential.user.uid,
        displayName: credential.user.displayName,
        providerId: credential.providerId,
      });

      return credential;
    } catch (error: any) {
      OurLogs.error('[FirebaseAuthService] Google sign-in failed', {
        code: error.code,
        message: error.message,
        error,
      });
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    OurLogs.info('[FirebaseAuthService] signOut called');

    try {
      await signOut(this.auth);
      OurLogs.success('[FirebaseAuthService] Sign out successful');
    } catch (error: any) {
      OurLogs.error('[FirebaseAuthService] Sign out failed', { error });
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseUser | null {
    const currentUser = this.auth.currentUser;

    OurLogs.debug('[FirebaseAuthService] getCurrentUser called', {
      hasUser: !!currentUser,
      email: currentUser?.email,
      uid: currentUser?.uid,
    });

    return currentUser;
  }

  /**
   * Get ID token
   */
  async getIdToken(): Promise<string | null> {
    OurLogs.debug('[FirebaseAuthService] getIdToken called');

    const user = this.getCurrentUser();
    if (!user) {
      OurLogs.warn('[FirebaseAuthService] Cannot get ID token - No user signed in');
      return null;
    }

    try {
      const token = await user.getIdToken();
      OurLogs.success('[FirebaseAuthService] ID token retrieved', {
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 20)}...`,
      });
      return token;
    } catch (error: any) {
      OurLogs.error('[FirebaseAuthService] Failed to get ID token', { error });
      throw error;
    }
  }
}
