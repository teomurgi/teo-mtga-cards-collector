# MTG Arena Cards Collector

A high-performance TypeScript tool that creates the most comprehensive MTG Arena card database by intelligently merging 17Lands and Scryfall data sources.

## 🎯 What This Does

This tool solves the challenge of getting complete MTG Arena card data by combining the best of both worlds:

- **17Lands** provides authoritative Arena IDs and current meta information
- **Scryfall** offers rich card details, Oracle text, images, and pricing

The result: A unified JSONL database with **22,174 cards** and **88.7% cross-source matching** accuracy.

## ✨ Key Features

- 🎯 **Smart Matching**: Exact name+set matching with Arena ID fallback for 100% split card coverage
- 🚀 **High Performance**: Processes 100K+ cards in seconds with intelligent caching
- 📊 **Complete Coverage**: All Arena cards including digital-only and transform cards
- 🔍 **Rich Metadata**: Oracle text, images, pricing, legalities, and tournament data
- 📁 **JSONL Output**: Easy to process, stream-friendly format
- 🛠️ **Type-Safe**: Full TypeScript implementation with comprehensive error handling

## 🎮 Perfect For

- **Arena Players**: Get complete card metadata for deck building tools
- **Data Scientists**: Analyze MTG meta trends with combined datasets  
- **Developers**: Build apps with comprehensive card information
- **Collectors**: Track pricing and availability across all printings

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Collect latest card data
npm run collect

# View collection statistics  
npm run info
```

This generates `mtg_cards.jsonl` with 22,174 cards including:
- 19,671 cards matched across both sources (88.7%)
- 683 split/transform cards with 100% coverage
- Complete Arena metadata + Scryfall enrichment

## 📈 Matching Performance

Our advanced matching algorithm achieves exceptional accuracy:

```
✅ Primary Matches (exact name+set): 18,743 cards
🎯 Arena ID Fallback: 928 additional matches  
🎴 Split Cards: 683/683 (100% coverage)
📊 Total Success Rate: 88.7%
```

Unmatched cards are mostly legitimate exceptions:
- Transform card back faces (tracked separately by 17Lands)
- Arena-exclusive digital cards (Y-series sets)
- Different printings across sources

## 📋 Usage

### Basic Collection

```bash
# Collect with latest data (recommended)
npm run collect

# Enable detailed logging
npm run collect -- --verbose

# Custom output filename
npm run collect -- --output my_collection.jsonl
```

### Advanced Usage

```bash
# Use specific data URLs
npm run dev -- collect \
  --scryfall-url "https://data.scryfall.io/default-cards/default-cards-20250825090922.json" \
  --lands-url "https://17lands-public.s3.amazonaws.com/analysis_data/cards/cards.csv" \
  --output "my_cards.jsonl"

# View collection statistics
npm run dev -- info mtg_cards.jsonl
```

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `collect` | Download and merge card data | `npm run collect` |
| `info <file>` | Show collection statistics | `npm run info` |

### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--scryfall-url` | Custom Scryfall JSON URL | Latest daily export |
| `--lands-url` | Custom 17Lands CSV URL | Latest cards.csv |
| `--output` | Output filename | `mtg_cards.jsonl` |
| `--verbose` | Detailed logging | `false` |

## 🗃️ Data Sources

### 17Lands CSV
- **URL**: `https://17lands-public.s3.amazonaws.com/analysis_data/cards/cards.csv`
- **Provides**: Arena IDs, set codes, rarity, booster pack inclusion
- **Role**: Master source for Arena ID mapping and meta information

### Scryfall JSON  
- **URL**: `https://data.scryfall.io/default-cards/default-cards-*.json`
- **Provides**: Oracle text, mana costs, images, pricing, legalities, comprehensive metadata
- **Role**: Enrichment source for detailed card information

## 📄 Output Format

Each line in the JSONL file represents a complete card with merged data:

```json
{
  "arena_id": 95336,
  "name": "Solitary Study // Endless Corridor", 
  "mana_cost": "{2}{W}",
  "type_line": "Enchantment — Room",
  "oracle_text": "When this Room enters, scry 1...",
  "set_code": "y25",
  "set_name": "Arena 2025",
  "rarity": "rare",
  "colors": ["W"],
  "image_uris_normal": "https://cards.scryfall.io/normal/...",
  "prices_usd": "0.25",
  "legalities_standard": "legal",
  "source": "both"
}
```

### Data Fields

| Category | Fields |
|----------|--------|
| **Identity** | `arena_id`, `name`, `id`, `collector_number` |
| **Game Mechanics** | `mana_cost`, `cmc`, `type_line`, `oracle_text`, `power`, `toughness` |
| **Colors** | `colors`, `color_identity`, `keywords` |
| **Set Information** | `set_code`, `set_name`, `rarity`, `digital` |
| **Visuals** | `artist`, `flavor_text`, `image_uris_normal`, `image_uris_large` |
| **Market** | `prices_usd`, `prices_usd_foil` |
| **Legalities** | `legalities_standard`, `legalities_modern`, `legalities_commander` |
| **Metadata** | `source`, `created_at`, `foil`, `nonfoil`, `is_booster` |

## 🌐 Live Data & GitHub Pages

This repository automatically publishes updated card data daily:

**🔗 Live Site**: https://teomurgi.github.io/teo-mtga-cards-collector/

### Features:
- 📊 **Interactive Card Browser** with search, filtering, and sorting
- 📈 **Real-time Statistics** showing collection metrics  
- 📥 **Direct Download** of the complete JSONL dataset
- 🔄 **Daily Updates** via GitHub Actions at 6 AM UTC
- 📱 **Mobile Responsive** design with Bootstrap 5

### GitHub Actions Automation

The workflow automatically:
1. Collects latest data from 17Lands and Scryfall
2. Generates updated JSONL file
3. Creates interactive HTML interface
4. Publishes to GitHub Pages
5. Creates releases with downloadable data

To enable this for your fork:
1. Go to **Settings** → **Pages** → **Source** → **GitHub Actions**
2. Push any change to trigger the first run
3. Data will update daily automatically

## 🔧 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode with hot reload
npm run dev

# Code quality
npm run lint
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Statistics

- **Total Cards**: 22,174
- **Matched Cards**: 19,671 (88.7%)
- **Split Cards**: 683 (100% coverage)
- **Data Sources**: 2 (17Lands + Scryfall)
- **Output Format**: JSONL (streaming-friendly)
- **Performance**: ~2 seconds for full collection

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Matteo Murgida**  
📧 teomurgi@gmail.com  
🐙 [@teomurgi](https://github.com/teomurgi)

---

*Built with ❤️ for the MTG Arena community*
