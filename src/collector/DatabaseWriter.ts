import * as duckdb from 'duckdb';
import { MergedCard } from '../types/Card';
import { Logger } from '../utils/Logger';

export class DatabaseWriter {
  async writeToDatabase(cards: MergedCard[], databasePath: string): Promise<void> {
    const db = new duckdb.Database(databasePath);
    
    try {
      await this.createTablesAndIndexes(db);
      await this.insertCards(db, cards);
    } finally {
      db.close();
    }
  }

  async write(cards: MergedCard[], databasePath: string): Promise<void> {
    return this.writeToDatabase(cards, databasePath);
  }

  async showInfo(databasePath: string): Promise<void> {
    const db = new duckdb.Database(databasePath);
    
    try {
      // Get total count
      const totalCount = await this.query(db, 'SELECT COUNT(*) as total FROM cards');
      Logger.info(`\nTotal Cards:`);
      Logger.info(`  ${JSON.stringify({total: totalCount[0].total.toString()})}`);
      
      // Get cards by source
      const sourceBreakdown = await this.query(db, 'SELECT source, COUNT(*) as count FROM cards GROUP BY source ORDER BY count DESC');
      Logger.info(`\nCards by Source:`);
      sourceBreakdown.forEach(row => Logger.info(`  ${JSON.stringify({source: row.source, count: row.count.toString()})}`));
      
      // Get top 10 sets
      const setBreakdown = await this.query(db, 'SELECT set_code, set_name, COUNT(*) as count FROM cards GROUP BY set_code, set_name ORDER BY count DESC LIMIT 10');
      Logger.info(`\nCards by Set (Top 10):`);
      setBreakdown.forEach(row => Logger.info(`  ${JSON.stringify({set_code: row.set_code, set_name: row.set_name, count: row.count.toString()})}`));
      
      // Get rarity breakdown
      const rarityBreakdown = await this.query(db, 'SELECT rarity, COUNT(*) as count FROM cards GROUP BY rarity ORDER BY count DESC');
      Logger.info(`\nCards by Rarity:`);
      rarityBreakdown.forEach(row => Logger.info(`  ${JSON.stringify({rarity: row.rarity, count: row.count.toString()})}`));
      
      // Arena ID coverage
      const arenaIdCoverage = await this.query(db, 'SELECT COUNT(*) as with_arena_id FROM cards WHERE arena_id IS NOT NULL');
      Logger.info(`\nArena ID Coverage:`);
      Logger.info(`  ${JSON.stringify({with_arena_id: arenaIdCoverage[0].with_arena_id.toString()})}`);
      
    } finally {
      db.close();
    }
  }

  private async createTablesAndIndexes(db: duckdb.Database): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create the cards table with id as PRIMARY KEY (VARCHAR)
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS cards (
          id VARCHAR PRIMARY KEY,
          arena_id INTEGER NOT NULL,
          name VARCHAR NOT NULL,
          mana_cost VARCHAR,
          cmc REAL,
          type_line VARCHAR,
          oracle_text VARCHAR,
          colors VARCHAR,
          color_identity VARCHAR,
          keywords VARCHAR,
          set_code VARCHAR NOT NULL,
          set_name VARCHAR,
          rarity VARCHAR NOT NULL,
          collector_number VARCHAR,
          artist VARCHAR,
          flavor_text VARCHAR,
          prices_usd REAL,
          prices_usd_foil REAL,
          image_uris_normal VARCHAR,
          image_uris_large VARCHAR,
          scryfall_uri VARCHAR,
          legalities_standard VARCHAR,
          legalities_modern VARCHAR,
          legalities_commander VARCHAR,
          digital BOOLEAN,
          foil BOOLEAN,
          nonfoil BOOLEAN,
          is_booster BOOLEAN NOT NULL,
          source VARCHAR NOT NULL,
          created_at TIMESTAMP NOT NULL
        )
      `;
      
      db.exec(createTableSQL, (err) => {
        if (err) {
          reject(new Error(`Failed to create table: ${err.message}`));
          return;
        }
        
        // Create indexes for common queries
        const indexes = [
          'CREATE INDEX IF NOT EXISTS idx_arena_id ON cards(arena_id)',
          'CREATE INDEX IF NOT EXISTS idx_name ON cards(name)',
          'CREATE INDEX IF NOT EXISTS idx_set_code ON cards(set_code)',
          'CREATE INDEX IF NOT EXISTS idx_rarity ON cards(rarity)',
          'CREATE INDEX IF NOT EXISTS idx_source ON cards(source)',
          'CREATE INDEX IF NOT EXISTS idx_is_booster ON cards(is_booster)'
        ];
        
        let indexCount = 0;
        for (const indexSQL of indexes) {
          db.exec(indexSQL, (err) => {
            if (err) {
              reject(new Error(`Failed to create index: ${err.message}`));
              return;
            }
            
            indexCount++;
            if (indexCount === indexes.length) {
              resolve();
            }
          });
        }
      });
    });
  }

  private async insertCards(db: duckdb.Database, cards: MergedCard[]): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.debug(`Starting to insert ${cards.length} cards into database...`);
      
      // Prepare the insert statement
      const insertSQL = `
        INSERT OR REPLACE INTO cards (
          id, arena_id, name, mana_cost, cmc, type_line, oracle_text,
          colors, color_identity, keywords, set_code, set_name, rarity,
          collector_number, artist, flavor_text, prices_usd, prices_usd_foil,
          image_uris_normal, image_uris_large, scryfall_uri,
          legalities_standard, legalities_modern, legalities_commander,
          digital, foil, nonfoil, is_booster, source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const stmt = db.prepare(insertSQL);
      
      let insertCount = 0;
      let errorCount = 0;
      let processedCount = 0;
      
      const processCard = (card: MergedCard) => {
        stmt.run(
          card.id,
          card.arena_id,
          card.name,
          card.mana_cost || null,
          card.cmc || null,
          card.type_line || null,
          card.oracle_text || null,
          card.colors ? JSON.stringify(card.colors) : null,
          card.color_identity ? JSON.stringify(card.color_identity) : null,
          card.keywords ? JSON.stringify(card.keywords) : null,
          card.set_code,
          card.set_name || null,
          card.rarity,
          card.collector_number || null,
          card.artist || null,
          card.flavor_text || null,
          card.prices_usd || null,
          card.prices_usd_foil || null,
          card.image_uris_normal || null,
          card.image_uris_large || null,
          card.scryfall_uri || null,
          card.legalities_standard || null,
          card.legalities_modern || null,
          card.legalities_commander || null,
          card.digital || null,
          card.foil || null,
          card.nonfoil || null,
          card.is_booster,
          card.source,
          card.created_at,
          (err: any) => {
            processedCount++;
            
            if (err) {
              errorCount++;
              Logger.debug(`Error inserting card ${card.id} (${card.name}): ${err.message || err}`);
              Logger.debug(`Card data: ${JSON.stringify(card, null, 2)}`);
              if (errorCount > 100) {  // Increased threshold to see more errors
                reject(new Error(`Too many insert errors (${errorCount})`));
                return;
              }
            } else {
              insertCount++;
              
              if (insertCount % 1000 === 0) {
                Logger.debug(`Inserted ${insertCount} cards so far...`);
              }
            }
            
            // Check if we're done
            if (processedCount === cards.length) {
              stmt.finalize((err) => {
                if (err) {
                  reject(new Error(`Failed to finalize statement: ${err}`));
                } else {
                  Logger.debug(`Database insertion complete: ${insertCount} cards inserted, ${errorCount} errors`);
                  resolve();
                }
              });
            }
          }
        );
      };
      
      // Process all cards
      for (const card of cards) {
        processCard(card);
      }
    });
  }

  private async query(db: duckdb.Database, sql: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(sql, (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}
