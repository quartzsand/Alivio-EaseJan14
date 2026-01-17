// client/services/InjectionTrackingService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InjectionSite } from '../constants/InjectionSites';

interface InjectionRecord {
  id: string;
  siteId: string;
  siteName: string;
  timestamp: string;
  medicationType?: string;
  painRating?: number;
  notes?: string;
}

interface SiteUsageStats {
  siteId: string;
  totalUses: number;
  lastUsed: string | null;
  averagePainRating: number;
}

export class InjectionTrackingService {
  private static readonly STORAGE_KEY = 'injection_records';

  static async recordInjection(
    site: InjectionSite, 
    medicationType?: string,
    painRating?: number,
    notes?: string
  ): Promise<void> {
    const record: InjectionRecord = {
      id: Date.now().toString(),
      siteId: site.id,
      siteName: site.name,
      timestamp: new Date().toISOString(),
      medicationType,
      painRating,
      notes
    };

    const existingRecords = await this.getRecords();
    const updatedRecords = [record, ...existingRecords];

    await AsyncStorage.setItem(
      this.STORAGE_KEY, 
      JSON.stringify(updatedRecords)
    );
  }

  static async getRecords(): Promise<InjectionRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving injection records:', error);
      return [];
    }
  }

  static async getSiteUsageStats(): Promise<SiteUsageStats[]> {
    const records = await this.getRecords();
    const siteMap = new Map<string, InjectionRecord[]>();

    // Group records by site
    records.forEach(record => {
      const siteRecords = siteMap.get(record.siteId) || [];
      siteRecords.push(record);
      siteMap.set(record.siteId, siteRecords);
    });

    // Calculate stats for each site
    const stats: SiteUsageStats[] = [];
    siteMap.forEach((siteRecords, siteId) => {
      const painRatings = siteRecords
        .map(r => r.painRating)
        .filter(rating => rating !== undefined) as number[];

      const averagePainRating = painRatings.length > 0 
        ? painRatings.reduce((sum, rating) => sum + rating, 0) / painRatings.length
        : 0;

      stats.push({
        siteId,
        totalUses: siteRecords.length,
        lastUsed: siteRecords[0]?.timestamp || null,
        averagePainRating
      });
    });

    return stats.sort((a, b) => b.totalUses - a.totalUses);
  }

  static async suggestBestSite(
    availableSites: InjectionSite[]
  ): Promise<InjectionSite | null> {
    const stats = await this.getSiteUsageStats();

    if (stats.length === 0) {
      // If no history, suggest thigh as it's versatile
      return availableSites.find(site => site.id === 'thigh') || availableSites[0];
    }

    // Find the site with lowest average pain rating that hasn't been used recently
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const site of availableSites) {
      const siteStat = stats.find(s => s.siteId === site.id);

      if (!siteStat) {
        // Never used this site - good option
        return site;
      }

      const lastUsed = siteStat.lastUsed ? new Date(siteStat.lastUsed) : null;
      if (!lastUsed || lastUsed < oneDayAgo) {
        // Not used recently
        return site;
      }
    }

    // If all sites used recently, return the one with lowest pain rating
    const bestStat = stats
      .filter(stat => availableSites.some(site => site.id === stat.siteId))
      .sort((a, b) => a.averagePainRating - b.averagePainRating)[0];

    return availableSites.find(site => site.id === bestStat?.siteId) || null;
  }
}