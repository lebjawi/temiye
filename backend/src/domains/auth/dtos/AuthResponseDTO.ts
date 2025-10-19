/**
 * Standardized authentication response
 */
export class AuthResponseDTO {
  token: string;
  user?: any;
  admin?: any;
  expiresAt: Date;

  constructor(data: { token: string; user?: any; admin?: any; expiresInDays: number }) {
    this.token = data.token;
    this.user = data.user;
    this.admin = data.admin;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + data.expiresInDays);
    this.expiresAt = expiryDate;
  }

  toJSON() {
    return {
      token: this.token,
      ...(this.user && { user: this.user }),
      ...(this.admin && { admin: this.admin }),
      expiresAt: this.expiresAt.toISOString()
    };
  }
}
