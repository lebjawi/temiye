import { Announcement } from '../entities/Announcement';
import { AnnouncementRepository } from '../repositories/announcement.repository';
import { CreateAnnouncementDTO } from '../dtos/CreateAnnouncementDTO';
import { NotFoundError } from '../../../shared/errors/NotFoundError';

export class AnnouncementService {
  constructor(private announcementRepository: AnnouncementRepository) {}

  async createAnnouncement(data: any, author: string): Promise<Announcement> {
    const dto = new CreateAnnouncementDTO(data);
    dto.validate();

    const announcementData = dto.toEntity(author);
    const announcement = Announcement.create(announcementData);
    return this.announcementRepository.create(announcement.toFirestore());
  }

  async getAnnouncementById(id: string): Promise<Announcement> {
    const announcement = await this.announcementRepository.findById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }
    return announcement;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepository.findAll();
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepository.findActive();
  }

  async getPinnedAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepository.findPinned();
  }

  async updateAnnouncement(id: string, updates: any): Promise<Announcement> {
    await this.getAnnouncementById(id);
    return this.announcementRepository.update(id, updates);
  }

  async deleteAnnouncement(id: string, deletedBy: string): Promise<void> {
    await this.getAnnouncementById(id);
    await this.announcementRepository.softDelete(id, deletedBy);
  }
}
