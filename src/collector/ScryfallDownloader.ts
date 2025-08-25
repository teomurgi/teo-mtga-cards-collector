import { promises as fs } from 'fs';
import path from 'path';
import { ScryfallCard } from '../types/Card';
import { Logger } from '../utils/Logger';

export class ScryfallDownloader {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache');
  }

  async download(url: string): Promise<ScryfallCard[]> {
    await this.ensureCacheDir();
    
    const fileName = this.getFileNameFromUrl(url);
    const filePath = path.join(this.cacheDir, fileName);
    
    // Check if cached file exists
    try {
      await fs.access(filePath);
      Logger.debug(`Using cached Scryfall data from: ${filePath}`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as ScryfallCard[];
    } catch {
      // File doesn't exist, download it
      Logger.debug(`Fetching Scryfall data from: ${url}`);
    }
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as ScryfallCard[];
      
      if (!Array.isArray(data)) {
        throw new Error('Expected JSON array from Scryfall API');
      }

      // Cache the data
      await fs.writeFile(filePath, JSON.stringify(data));
      Logger.debug(`Cached Scryfall data to: ${filePath}`);

      Logger.debug(`Successfully parsed ${data.length} Scryfall cards`);
      return data;
    } catch (error) {
      throw new Error(`Failed to download Scryfall data: ${error}`);
    }
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create cache directory: ${error}`);
    }
  }

  private getFileNameFromUrl(url: string): string {
    // Extract filename from URL or create a descriptive name
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (fileName.includes('.json')) {
      return fileName;
    }
    
    return 'scryfall-cards.json';
  }
}