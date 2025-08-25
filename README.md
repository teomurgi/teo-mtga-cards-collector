# Teo's MTG Arena Cards Collector

A specialized Node.js TypeScript tool for merging 17Lands CSV data with Scryfall JSON data to create a comprehensive MTG card collection in JSONL format.

## Purpose

This tool is designed to create the most complete and accurate MTG Arena card collection by combining:

- **17Lands CSV Data**: Authoritative Arena ID mappings and current card metadata from [17lands.com](https://17lands.com)
- **Scryfall JSON Data**: Rich card information including Oracle text, images, pricing, and legalities from [Scryfall](https://scryfall.com)

The result is a JSONL (JSON Lines) file that provides both the precision of 17Lands' Arena data and the comprehensiveness of Scryfall's card details.

## Features

- ✅ Downloads latest data from both 17Lands and Scryfall APIs
- ✅ Intelligent merging by Arena ID and name/set combinations  
- ✅ Preserves all card variants and booster information
- ✅ Creates JSONL file for easy data processing and analysis
- ✅ Comprehensive command-line interface
- ✅ Detailed merge statistics and collection analysis
- ✅ TypeScript for type safety and better development experience

## Installation

```bash
npm install
```

## Usage

### Collect Cards Collection

```bash
# Use default URLs (latest data)
npm run collect

# Or use custom URLs
npm run dev -- collect --scryfall-url "https://data.scryfall.io/default-cards/default-cards-20250825090922.json" --lands-url "https://17lands-public.s3.amazonaws.com/analysis_data/cards/cards.csv" --output "my_cards.jsonl"

# Enable verbose logging
npm run dev -- collect --verbose
```

### Show Collection Information

```bash
npm run dev -- info mtg_cards.jsonl
```

## Commands

- `collect` - Download and merge data from 17Lands and Scryfall
- `info <file>` - Show statistics about a JSONL collection file

## Options

- `--scryfall-url <url>` - Custom Scryfall JSON URL
- `--lands-url <url>` - Custom 17Lands CSV URL  
- `--output <file>` - Output JSONL filename (default: mtg_cards.jsonl)
- `--verbose` - Enable detailed logging

## Data Sources

### 17Lands CSV
- **URL**: https://17lands-public.s3.amazonaws.com/analysis_data/cards/cards.csv
- **Provides**: Arena IDs, current set codes, rarity, booster information
- **Used as**: Master source for Arena ID mapping

### Scryfall JSON  
- **URL**: https://data.scryfall.io/default-cards/default-cards-20250825090922.json
- **Provides**: Oracle text, mana costs, images, pricing, legalities
- **Used as**: Enrichment source for detailed card information

## JSONL Format

The generated JSONL file contains one JSON object per line, each representing a card with:

- **Core**: id, arena_id, name, mana_cost, cmc, type_line, oracle_text
- **Colors**: colors, color_identity, keywords  
- **Set Info**: set_code, set_name, rarity, collector_number
- **Art**: artist, flavor_text, image_uris_normal, image_uris_large
- **Pricing**: prices_usd, prices_usd_foil
- **Legalities**: legalities_standard, legalities_modern, legalities_commander
- **Flags**: digital, foil, nonfoil, is_booster
- **Metadata**: source, created_at

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Lint code
npm run lint

# Type check
npm run type-check
```

## Author

Matteo Murgida <teomurgi@gmail.com>

## License

MIT
