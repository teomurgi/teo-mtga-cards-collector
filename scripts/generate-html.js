const fs = require('fs');
const path = require('path');

function generateHTML() {
  console.log('📄 Generating HTML page...');
  
  // Read the JSONL file
  const jsonlPath = path.join(__dirname, '../docs/mtg_cards.jsonl');
  const jsonlData = fs.readFileSync(jsonlPath, 'utf8');
  
  // Parse cards (first 1000 for demo, full data available via download)
  const allCards = jsonlData.split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  
  // Generate statistics
  const { stats, githubStats } = generateStats(allCards);
  
  // Save stats as JSON for GitHub Actions
  fs.writeFileSync(
    path.join(__dirname, '../docs/collection-stats.json'),
    JSON.stringify(githubStats, null, 2)
  );
  
  // Generate preview cards (first 1000)
  const previewCards = allCards.slice(0, 1000);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MTG Arena Cards Collection</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <style>
        .mana-symbol { font-size: 0.8em; }
        .rarity-common { color: #000; }
        .rarity-uncommon { color: #c0c0c0; }
        .rarity-rare { color: #ffd700; }
        .rarity-mythic { color: #ff4500; }
        .source-both { background-color: #d4edda; }
        .source-lands_only { background-color: #fff3cd; }
        .card-image { width: 30px; height: 42px; object-fit: cover; border-radius: 3px; }
        .stats-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .update-time { font-size: 0.9em; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container-fluid py-4">
        <div class="row mb-4">
            <div class="col">
                <h1 class="display-4">🃏 MTG Arena Cards Collection</h1>
                <p class="lead">Comprehensive database merging 17Lands and Scryfall data</p>
                <p class="update-time">
                    📅 Last Updated: <strong>${new Date().toLocaleString()}</strong> | 
                    🔄 Auto-updated daily at 6 AM UTC
                </p>
            </div>
        </div>
        
        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <h3>${stats.total.toLocaleString()}</h3>
                        <p class="mb-0">Total Cards</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <h3>${stats.bothSources.toLocaleString()}</h3>
                        <p class="mb-0">Matched Cards</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <h3>${((stats.bothSources / stats.total) * 100).toFixed(1)}%</h3>
                        <p class="mb-0">Match Rate</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <h3>${stats.splitCards.toLocaleString()}</h3>
                        <p class="mb-0">Split Cards</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Download Section -->
        <div class="row mb-4">
            <div class="col">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">📥 Download Complete Dataset</h5>
                        <p class="card-text">Get the full collection as JSONL format for your projects.</p>
                        <a href="mtg_cards.jsonl" class="btn btn-primary" download>
                            Download mtg_cards.jsonl (${(fs.statSync(jsonlPath).size / 1024 / 1024).toFixed(1)} MB)
                        </a>
                        <a href="https://github.com/teomurgi/teo-mtga-cards-collector" class="btn btn-outline-secondary ms-2">
                            View Source Code
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Cards Table -->
        <div class="row">
            <div class="col">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">📋 Cards Preview (First 1,000 cards - Download full dataset above)</h5>
                    </div>
                    <div class="card-body">
                        <table id="cardsTable" class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Mana Cost</th>
                                    <th>Type</th>
                                    <th>Set</th>
                                    <th>Rarity</th>
                                    <th>Source</th>
                                    <th>Arena ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${previewCards.map(card => `
                                    <tr class="source-${card.source}">
                                        <td>
                                            ${card.image_uris_normal ? 
                                                `<img src="${card.image_uris_normal}" class="card-image" alt="${card.name}" loading="lazy">` : 
                                                '🃏'
                                            }
                                        </td>
                                        <td><strong>${escapeHtml(card.name)}</strong></td>
                                        <td>${card.mana_cost || ''}</td>
                                        <td>${escapeHtml(card.type_line || '')}</td>
                                        <td>
                                            <span class="badge bg-secondary">${card.set_code?.toUpperCase()}</span>
                                            ${card.set_name ? `<br><small>${escapeHtml(card.set_name)}</small>` : ''}
                                        </td>
                                        <td>
                                            <span class="rarity-${card.rarity}">${capitalize(card.rarity || 'unknown')}</span>
                                        </td>
                                        <td>
                                            <span class="badge ${card.source === 'both' ? 'bg-success' : 'bg-warning'}">${card.source}</span>
                                        </td>
                                        <td>${card.arena_id || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <footer class="mt-5 pt-4 border-top">
            <div class="row">
                <div class="col-md-6">
                    <p class="text-muted">
                        🛠️ Built with <a href="https://github.com/teomurgi/teo-mtga-cards-collector">MTG Arena Cards Collector</a><br>
                        📊 Data from <a href="https://17lands.com">17Lands</a> and <a href="https://scryfall.com">Scryfall</a>
                    </p>
                </div>
                <div class="col-md-6 text-end">
                    <p class="text-muted">
                        👨‍💻 By <a href="https://github.com/teomurgi">Matteo Murgida</a><br>
                        🔄 Updated automatically via GitHub Actions
                    </p>
                </div>
            </div>
        </footer>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
    
    <script>
        $(document).ready(function() {
            $('#cardsTable').DataTable({
                pageLength: 25,
                responsive: true,
                order: [[1, 'asc']], // Sort by name
                columnDefs: [
                    { orderable: false, targets: [0] }, // Image column not sortable
                    { searchable: false, targets: [0] } // Image column not searchable
                ]
            });
        });
    </script>
</body>
</html>`;

  // Write the HTML file
  fs.writeFileSync(path.join(__dirname, '../docs/index.html'), html);
  console.log('✅ HTML page generated successfully!');
}

function generateStats(cards) {
  const total = cards.length;
  const bothSources = cards.filter(c => c.source === 'both').length;
  const landsOnly = cards.filter(c => c.source === 'lands_only').length;
  const splitCards = cards.filter(c => c.name && c.name.includes(' // ')).length;
  
  // Return simple stats object for HTML
  const stats = {
    total,
    bothSources,
    landsOnly,
    splitCards
  };
  
  // Also create GitHub Actions compatible format
  const githubStats = [
    { total: total.toString() },
    { source: 'both', count: bothSources.toString() },
    { source: 'lands_only', count: landsOnly.toString() }
  ];
  
  return { stats, githubStats };
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, '../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

generateHTML();
