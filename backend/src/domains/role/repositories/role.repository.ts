import { Firestore } from 'firebase-admin/firestore';
import { Role } from '../entities/Role';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { COLLECTIONS } from '../../../shared/config/firebase.config';

/**
 * RoleRepository - Firestore interactions for Role domain
 *
 * Responsibility: Database queries only (no business logic)
 * Collection: 'roles'
 */
export class RoleRepository {
  private readonly collectionName = COLLECTIONS.ROLES;

  constructor(private db: Firestore) {}

  /**
   * Create new role
   */
  async create(roleData: Record<string, any>, roleId: string): Promise<Role> {
    // Use custom ID (not auto-generated)
    await this.db.collection(this.collectionName).doc(roleId).set(roleData);

    return this.toEntity({ id: roleId, ...roleData });
  }

  /**
   * Find role by ID
   */
  async findById(id: string): Promise<Role | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  /**
   * Find role by name (unique query)
   */
  async findByName(name: string): Promise<Role | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('name', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  /**
   * Get all roles
   */
  async findAll(): Promise<Role[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('level', 'desc') // Order by hierarchy (superadmin first)
      .get();

    return snapshot.docs.map(doc =>
      this.toEntity({ id: doc.id, ...doc.data() })
    );
  }

  /**
   * Update role
   */
  async update(id: string, updates: Partial<Record<string, any>>): Promise<Role> {
    const docRef = this.db.collection(this.collectionName).doc(id);

    // Check if exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundError('Role not found');
    }

    // Update
    await docRef.update(updates);

    // Fetch and return updated document
    const updatedDoc = await docRef.get();
    return this.toEntity({ id: updatedDoc.id, ...updatedDoc.data() });
  }

  /**
   * Delete role
   */
  async delete(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).delete();
  }

  /**
   * Get roles by level
   */
  async findByLevel(level: number): Promise<Role[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('level', '==', level)
      .get();

    return snapshot.docs.map(doc =>
      this.toEntity({ id: doc.id, ...doc.data() })
    );
  }

  /**
   * Count users with this role (for deletion check)
   * Note: This requires access to users collection
   */
  async countUsersWithRole(roleId: string): Promise<number> {
    const snapshot = await this.db
      .collection(COLLECTIONS.USERS)
      .where('role', '==', roleId)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Transform Firestore document to Role entity
   */
  private toEntity(data: any): Role {
    return new Role({
      id: data.id,
      name: data.name,
      permissions: data.permissions || [],
      description: data.description,
      level: data.level,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date())
    });
  }
}
