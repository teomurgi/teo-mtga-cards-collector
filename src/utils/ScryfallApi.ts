import { Logger } from './Logger';

interface ScryfallBulkData {
  object: string;
  type: string;
  download_uri: string;
  updated_at: string;
  name: string;
  description: string;
  size: number;
  content_type: string;
  content_encoding: string;
}

interface ScryfallBulkDataResponse {
  object: string;
  data: ScryfallBulkData[];
}

export class ScryfallApi {
  private static readonly BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
  private static readonly DEFAULT_CARDS_TYPE = 'default_cards';
  
  /**
   * Fetches the latest Scryfall default cards download URL
   * @returns Promise<string> The latest download URL
   */
  static async getLatestDefaultCardsUrl(): Promise<string> {
    try {
      Logger.debug('Fetching latest Scryfall bulk data information...');
      
      const response = await fetch(this.BULK_DATA_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch bulk data: ${response.status} ${response.statusText}`);
      }
      
      const bulkData: ScryfallBulkDataResponse = await response.json();
      
      // Find the default_cards entry
      const defaultCardsData = bulkData.data.find(
        item => item.type === this.DEFAULT_CARDS_TYPE
      );
      
      if (!defaultCardsData) {
        throw new Error('Default cards bulk data not found in Scryfall API response');
      }
      
      Logger.debug(`Found latest default cards: ${defaultCardsData.download_uri}`);
      Logger.debug(`Last updated: ${defaultCardsData.updated_at}`);
      Logger.debug(`File size: ${(defaultCardsData.size / 1024 / 1024).toFixed(1)} MB`);
      
      return defaultCardsData.download_uri;
      
    } catch (error) {
      Logger.error('Failed to fetch latest Scryfall URL:', error);
      
      // Fallback to a recent known URL if API fails
      const fallbackUrl = 'https://data.scryfall.io/default-cards/default-cards-20250825090922.json';
      Logger.warn(`Using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }
  
  /**
   * Extracts the timestamp from a Scryfall download URL
   * @param url The Scryfall download URL
   * @returns The extracted timestamp or null if not found
   */
  static extractTimestamp(url: string): string | null {
    const match = url.match(/default-cards-(\d{14})\.json$/);
    return match ? match[1] : null;
  }
  
  /**
   * Formats a Scryfall timestamp into a readable date
   * @param timestamp The timestamp string (YYYYMMDDHHMMSS)
   * @returns Formatted date string
   */
  static formatTimestamp(timestamp: string): string {
    if (timestamp.length !== 14) {
      return timestamp;
    }
    
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10);
    const minute = timestamp.substring(10, 12);
    const second = timestamp.substring(12, 14);
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
  }
}
