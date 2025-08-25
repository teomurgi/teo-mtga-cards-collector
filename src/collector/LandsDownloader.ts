import { promises as fs } from 'fs';
import path from 'path';
import { LandsCard } from '../types/Card';
import { Logger } from '../utils/Logger';
import csv from 'csv-parser';
import { Readable } from 'stream';

export class LandsDownloader {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache');
  }

  async download(url: string): Promise<LandsCard[]> {
    await this.ensureCacheDir();
    
    const fileName = this.getFileNameFromUrl(url);
    const filePath = path.join(this.cacheDir, fileName);
    
    // Check if cached file exists
    try {
      await fs.access(filePath);
      Logger.debug(`Using cached 17Lands data from: ${filePath}`);
      const csvText = await fs.readFile(filePath, 'utf-8');
      return await this.parseCSV(csvText);
    } catch {
      // File doesn't exist, download it
      Logger.debug(`Fetching 17Lands data from: ${url}`);
    }
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      
      // Cache the CSV data
      await fs.writeFile(filePath, csvText);
      Logger.debug(`Cached 17Lands data to: ${filePath}`);
      
      const cards = await this.parseCSV(csvText);
      
      Logger.debug(`Successfully parsed ${cards.length} 17Lands cards`);
      return cards;
      
    } catch (error) {
      Logger.error('Failed to download 17Lands data:', error);
      throw error;
    }
  }

  private async parseCSV(csvText: string): Promise<LandsCard[]> {
    return new Promise((resolve, reject) => {
      const cards: LandsCard[] = [];
      const stream = Readable.from([csvText]);
      let rowCount = 0;
      let validCount = 0;
      let invalidCount = 0;
      
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          rowCount++;
          try {
            // Map CSV columns to our interface
            const arenaId = parseInt(row.arena_id || row.id, 10);
            
            if (!arenaId || isNaN(arenaId)) {
              invalidCount++;
              Logger.debug(`Row ${rowCount}: Invalid arena_id: ${row.arena_id || row.id}`);
              return;
            }
            
            const card: LandsCard = {
              arena_id: arenaId,
              name: row.name?.trim(),
              expansion: row.expansion?.trim(),
              rarity: row.rarity?.trim()?.toLowerCase(),
              color_identity: row.color_identity?.trim() || '',
              mana_value: parseFloat(row.mana_value) || 0,
              types: row.types?.trim() || '',
              is_booster: row.is_booster === 'True' || row.is_booster === true
            };

            // Validate required fields
            if (!card.name || !card.expansion) {
              invalidCount++;
              Logger.debug(`Row ${rowCount}: Missing required fields - name: ${card.name}, expansion: ${card.expansion}`);
              return;
            }

            cards.push(card);
            validCount++;
          } catch (error) {
            invalidCount++;
            Logger.warn(`Row ${rowCount}: Error parsing CSV row:`, row, error);
          }
        })
        .on('end', () => {
          Logger.debug(`CSV parsing complete: ${rowCount} total rows, ${validCount} valid cards, ${invalidCount} invalid/skipped`);
          Logger.debug(`Parsed ${cards.length} valid cards from CSV`);
          resolve(cards);
        })
        .on('error', reject);
    });
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
    
    if (fileName.includes('.csv')) {
      return fileName;
    }
    
    return '17lands-cards.csv';
  }
}
