const fs = require('fs');
const path = require('path');

function generateHTML() {
  console.log('📄 Generating enhanced HTML page with card details and search...');
  
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
  
  // Generate preview cards (first 1000) with full card data for details
  const previewCards = allCards.slice(0, 1000);
  const totalCards = allCards.length;
  const isPreviewMode = previewCards.length < totalCards;
  
  // Create card lookup object for details modal (will be expanded for full dataset)
  const cardLookup = {};
  previewCards.forEach(card => {
    cardLookup[`${card.arena_id}_${card.set_code}`] = card;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MTG Arena Cards Collection</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
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
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background-color: #f8f9fa; }
        .modal-card-image { max-width: 200px; border-radius: 8px; }
        .mana-cost { font-family: 'Courier New', monospace; font-weight: bold; }
        .oracle-text { line-height: 1.4; }
        .card-detail-header { background: linear-gradient(135deg, #343a40 0%, #495057 100%); color: white; }
        .search-box { 
            background: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            padding: 15px;
        }
        .advanced-search { 
            background: #f8f9fa; 
            border-radius: 6px; 
            padding: 15px; 
            margin-top: 10px; 
        }
        .badge-source { font-size: 0.75em; }
    </style>
</head>
<body>
    <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
            <div class="col">
                <h1 class="display-4">🃏 MTG Arena Cards Collection</h1>
                <p class="lead">Comprehensive database merging 17Lands and Scryfall data with 99.70% match rate</p>
                <p class="update-time">
                    📅 Last Updated: <strong>${new Date().toLocaleString()}</strong> | 
                    🔄 Auto-updated daily at 6 AM UTC
                </p>
            </div>
        </div>
        
        <!-- Enhanced Search Box -->
        <div class="search-box">
            <div class="row">
                <div class="col-md-8">
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                        <input type="text" class="form-control" id="globalSearch" placeholder="Search cards by name, type, text, or set...">
                    </div>
                </div>
                <div class="col-md-4">
                    <button class="btn btn-outline-secondary w-100" type="button" data-bs-toggle="collapse" data-bs-target="#advancedSearch">
                        <i class="fas fa-filter"></i> Advanced Filters
                    </button>
                </div>
            </div>
            
            <div class="collapse advanced-search" id="advancedSearch">
                <div class="row mt-3">
                    <div class="col-md-3">
                        <label class="form-label">Rarity</label>
                        <select class="form-select" id="rarityFilter">
                            <option value="">All Rarities</option>
                            <option value="common">Common</option>
                            <option value="uncommon">Uncommon</option>
                            <option value="rare">Rare</option>
                            <option value="mythic">Mythic</option>
                            <option value="token">Token</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Source</label>
                        <select class="form-select" id="sourceFilter">
                            <option value="">All Sources</option>
                            <option value="both">Both Sources</option>
                            <option value="lands_only">17Lands Only</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Mana Cost</label>
                        <input type="text" class="form-control" id="manaCostFilter" placeholder="e.g., {2}{R}">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Set</label>
                        <input type="text" class="form-control" id="setFilter" placeholder="Set code">
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col">
                        <button class="btn btn-primary btn-sm" onclick="applyAdvancedFilters()">Apply Filters</button>
                        <button class="btn btn-secondary btn-sm ms-2" onclick="clearAdvancedFilters()">Clear All</button>
                    </div>
                </div>
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
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-1" id="tableTitle">
                                📋 <span id="dataMode">${isPreviewMode ? 'Preview Mode' : 'Full Collection'}</span> 
                                - <span id="cardCount">${previewCards.length.toLocaleString()}</span> cards
                            </h5>
                            <small class="text-muted" id="tableSubtitle">
                                ${isPreviewMode ? 
                                    `Showing first ${previewCards.length.toLocaleString()} of ${totalCards.toLocaleString()} total cards • Click any row for details` : 
                                    `Showing all ${totalCards.toLocaleString()} cards • Click any row for details`
                                }
                            </small>
                        </div>
                        ${isPreviewMode ? `
                        <div>
                            <button class="btn btn-outline-primary" id="loadFullButton" onclick="loadFullDataset()">
                                <i class="fas fa-expand-arrows-alt"></i> Load All ${totalCards.toLocaleString()} Cards
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    <div class="card-body">
                        <!-- Data Mode Alert -->
                        <div class="alert alert-info d-flex align-items-center" id="dataModeAlert">
                            <i class="fas fa-info-circle me-2"></i>
                            <div>
                                <strong id="alertTitle">${isPreviewMode ? 'Preview Mode Active' : 'Full Dataset Loaded'}</strong>
                                <div id="alertMessage">
                                    ${isPreviewMode ? 
                                        `Currently showing the first ${previewCards.length.toLocaleString()} cards for faster loading. Use search to find specific cards, or load the full dataset to browse all ${totalCards.toLocaleString()} cards.` :
                                        `All ${totalCards.toLocaleString()} cards are loaded and searchable.`
                                    }
                                </div>
                            </div>
                            ${isPreviewMode ? `
                            <button class="btn btn-sm btn-outline-primary ms-auto" onclick="loadFullDataset()">
                                Load Full Dataset
                            </button>
                            ` : ''}
                        </div>
                        
                        <div class="table-responsive">
                            <table id="cardsTable" class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Mana Cost</th>
                                        <th>Type</th>
                                        <th>Rarity</th>
                                        <th>Set</th>
                                        <th>Source</th>
                                        <th>Arena ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${previewCards.map(card => `
                                        <tr class="clickable-row" data-card-id="${card.arena_id}_${card.set_code}">
                                            <td>
                                                ${card.image_uris_normal ? 
                                                    `<img src="${card.image_uris_normal}" class="card-image" alt="${escapeHtml(card.name)}" loading="lazy">` : 
                                                    '<div class="card-image bg-light d-flex align-items-center justify-content-center"><i class="fas fa-image text-muted"></i></div>'
                                                }
                                            </td>
                                            <td><strong>${escapeHtml(card.name)}</strong></td>
                                            <td><span class="mana-cost">${escapeHtml(card.mana_cost || '')}</span></td>
                                            <td>${escapeHtml(card.type_line || card.types || '')}</td>
                                            <td><span class="rarity-${card.rarity}">${capitalize(card.rarity || 'unknown')}</span></td>
                                            <td>
                                                <span class="badge bg-secondary">${card.set_code}</span>
                                                ${card.set_name ? `<br><small>${escapeHtml(card.set_name)}</small>` : ''}
                                            </td>
                                            <td>
                                                <span class="badge badge-source ${card.source === 'both' ? 'bg-success' : 'bg-warning'}">${card.source === 'both' ? 'Matched' : '17Lands'}</span>
                                            </td>
                                            <td>${card.arena_id}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card Detail Modal -->
        <div class="modal fade" id="cardDetailModal" tabindex="-1" aria-labelledby="cardDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header card-detail-header">
                        <h5 class="modal-title" id="cardDetailModalLabel">Card Details</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="cardDetailBody">
                        <!-- Card details will be populated here -->
                    </div>
                    <div class="modal-footer">
                        <a href="#" id="scryfallLink" class="btn btn-outline-primary" target="_blank">
                            <i class="fas fa-external-link-alt"></i> View on Scryfall
                        </a>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <footer class="mt-5 py-4 border-top">
            <div class="row">
                <div class="col-md-6">
                    <p class="text-muted mb-2">
                        🛠️ Built with <a href="https://github.com/teomurgi/teo-mtga-cards-collector">MTG Arena Cards Collector</a><br>
                        📊 Data from <a href="https://17lands.com/">17Lands</a> and <a href="https://scryfall.com/">Scryfall</a><br>
                        🔄 Updated daily via GitHub Actions
                    </p>
                </div>
                <div class="col-md-6 text-end">
                    <p class="text-muted mb-2">
                        👨‍💻 By <a href="https://github.com/teomurgi">Matteo Murgida</a><br>
                        ⭐ <a href="https://github.com/teomurgi/teo-mtga-cards-collector">Star on GitHub</a>
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
        // Card lookup data for modal
        const cardLookup = ${JSON.stringify(cardLookup, null, 2)};
        
        // Dataset state management
        let isFullDatasetLoaded = ${!isPreviewMode};
        let allCardsData = null;
        let currentTable = null;
        
        // Total cards count for UI updates
        const totalCardsCount = ${totalCards};
        const previewCardsCount = ${previewCards.length};
        
        $(document).ready(function() {
            // Initialize DataTable with enhanced search
            currentTable = $('#cardsTable').DataTable({
                pageLength: 25,
                responsive: true,
                order: [[1, 'asc']], // Sort by name
                columnDefs: [
                    { orderable: false, targets: [0] }, // Image column not sortable
                    { searchable: false, targets: [0] } // Image column not searchable
                ],
                dom: 'lrtip' // Remove default search box since we have custom one
            });
            
            // Global search functionality
            $('#globalSearch').on('keyup', function() {
                currentTable.search(this.value).draw();
            });
            
            // Row click handler for card details
            $('#cardsTable tbody').on('click', 'tr.clickable-row', function() {
                const cardId = $(this).data('card-id');
                const card = cardLookup[cardId];
                if (card) {
                    showCardDetails(card);
                } else if (!isFullDatasetLoaded) {
                    // Card not in preview, suggest loading full dataset
                    showCardNotInPreview();
                }
            });
        });
        
        function loadFullDataset() {
            const loadButton = document.getElementById('loadFullButton');
            const alertTitle = document.getElementById('alertTitle');
            const alertMessage = document.getElementById('alertMessage');
            
            // Show loading state
            loadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadButton.disabled = true;
            
            // Fetch full JSONL data
            fetch('mtg_cards.jsonl')
                .then(response => response.text())
                .then(data => {
                    // Parse all cards
                    allCardsData = data.split('\\n')
                        .filter(line => line.trim())
                        .map(line => JSON.parse(line));
                    
                    // Update card lookup with all cards
                    allCardsData.forEach(card => {
                        cardLookup[\`\${card.arena_id}_\${card.set_code}\`] = card;
                    });
                    
                    // Destroy current table
                    currentTable.destroy();
                    
                    // Replace table body with all cards
                    const tbody = document.querySelector('#cardsTable tbody');
                    tbody.innerHTML = generateTableRows(allCardsData);
                    
                    // Reinitialize DataTable
                    currentTable = $('#cardsTable').DataTable({
                        pageLength: 25,
                        responsive: true,
                        order: [[1, 'asc']],
                        columnDefs: [
                            { orderable: false, targets: [0] },
                            { searchable: false, targets: [0] }
                        ],
                        dom: 'lrtip'
                    });
                    
                    // Update global search
                    $('#globalSearch').off('keyup').on('keyup', function() {
                        currentTable.search(this.value).draw();
                    });
                    
                    // Update UI state
                    isFullDatasetLoaded = true;
                    updateUIForFullDataset();
                    
                    console.log(\`✅ Loaded full dataset: \${allCardsData.length.toLocaleString()} cards\`);
                })
                .catch(error => {
                    console.error('Failed to load full dataset:', error);
                    loadButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to Load';
                    loadButton.disabled = false;
                    
                    // Show error alert
                    const alert = document.getElementById('dataModeAlert');
                    alert.className = 'alert alert-danger d-flex align-items-center';
                    alertTitle.textContent = 'Failed to Load Full Dataset';
                    alertMessage.textContent = 'There was an error loading the complete collection. Please try again or download the JSONL file directly.';
                });
        }
        
        function updateUIForFullDataset() {
            // Update header
            document.getElementById('dataMode').textContent = 'Full Collection';
            document.getElementById('cardCount').textContent = totalCardsCount.toLocaleString();
            document.getElementById('tableSubtitle').textContent = \`Showing all \${totalCardsCount.toLocaleString()} cards • Click any row for details\`;
            
            // Update alert
            const alert = document.getElementById('dataModeAlert');
            alert.className = 'alert alert-success d-flex align-items-center';
            document.getElementById('alertTitle').textContent = 'Full Dataset Loaded';
            document.getElementById('alertMessage').textContent = \`All \${totalCardsCount.toLocaleString()} cards are now loaded and searchable.\`;
            
            // Hide load button
            const loadButton = document.getElementById('loadFullButton');
            if (loadButton) loadButton.style.display = 'none';
            
            // Remove load button from alert
            const alertLoadButton = alert.querySelector('button');
            if (alertLoadButton) alertLoadButton.remove();
        }
        
        function generateTableRows(cards) {
            return cards.map(card => \`
                <tr class="clickable-row" data-card-id="\${card.arena_id}_\${card.set_code}">
                    <td>
                        \${card.image_uris_normal ? 
                            \`<img src="\${card.image_uris_normal}" class="card-image" alt="\${escapeHtml(card.name)}" loading="lazy">\` : 
                            '<div class="card-image bg-light d-flex align-items-center justify-content-center"><i class="fas fa-image text-muted"></i></div>'
                        }
                    </td>
                    <td><strong>\${escapeHtml(card.name)}</strong></td>
                    <td><span class="mana-cost">\${escapeHtml(card.mana_cost || '')}</span></td>
                    <td>\${escapeHtml(card.type_line || card.types || '')}</td>
                    <td><span class="rarity-\${card.rarity}">\${capitalize(card.rarity || 'unknown')}</span></td>
                    <td>
                        <span class="badge bg-secondary">\${card.set_code}</span>
                        \${card.set_name ? \`<br><small>\${escapeHtml(card.set_name)}</small>\` : ''}
                    </td>
                    <td>
                        <span class="badge badge-source \${card.source === 'both' ? 'bg-success' : 'bg-warning'}">\${card.source === 'both' ? 'Matched' : '17Lands'}</span>
                    </td>
                    <td>\${card.arena_id}</td>
                </tr>
            \`).join('');
        }
        
        function showCardNotInPreview() {
            // Show a modal suggesting to load full dataset
            const modal = new bootstrap.Modal(document.getElementById('cardDetailModal'));
            document.getElementById('cardDetailModalLabel').textContent = 'Card Not in Preview';
            document.getElementById('cardDetailBody').innerHTML = \`
                <div class="text-center py-4">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>Card Details Not Available in Preview Mode</h5>
                    <p class="text-muted">This card is not included in the first \${previewCardsCount.toLocaleString()} cards shown in preview mode.</p>
                    <button class="btn btn-primary" onclick="modal.hide(); loadFullDataset();">
                        <i class="fas fa-expand-arrows-alt"></i> Load Full Dataset (\${totalCardsCount.toLocaleString()} cards)
                    </button>
                </div>
            \`;
            document.getElementById('scryfallLink').style.display = 'none';
            modal.show();
        }
        
        function showCardDetails(card) {
            const modalBody = document.getElementById('cardDetailBody');
            const scryfallLink = document.getElementById('scryfallLink');
            
            // Prepare card details HTML
            const detailsHTML = \`
                <div class="row">
                    <div class="col-md-4">
                        \${card.image_uris_normal ? 
                            \`<img src="\${card.image_uris_normal}" class="modal-card-image img-fluid" alt="\${card.name}">\` : 
                            '<div class="modal-card-image bg-light d-flex align-items-center justify-content-center"><i class="fas fa-image fa-3x text-muted"></i></div>'
                        }
                    </div>
                    <div class="col-md-8">
                        <h4>\${card.name}</h4>
                        <p class="mb-2">
                            <strong>Mana Cost:</strong> <span class="mana-cost">\${card.mana_cost || 'N/A'}</span>
                            <span class="ms-3"><strong>CMC:</strong> \${card.cmc || 'N/A'}</span>
                        </p>
                        <p class="mb-2"><strong>Type:</strong> \${card.type_line || card.types || 'Unknown'}</p>
                        <p class="mb-2">
                            <strong>Rarity:</strong> <span class="rarity-\${card.rarity}">\${capitalize(card.rarity || 'unknown')}</span>
                            <span class="ms-3"><strong>Set:</strong> \${card.set_code} - \${card.set_name || 'Unknown Set'}</span>
                        </p>
                        <p class="mb-2">
                            <strong>Source:</strong> 
                            <span class="badge \${card.source === 'both' ? 'bg-success' : 'bg-warning'}">\${card.source === 'both' ? 'Both Sources' : '17Lands Only'}</span>
                            <span class="ms-3"><strong>Arena ID:</strong> \${card.arena_id}</span>
                        </p>
                        \${card.oracle_text ? \`
                            <div class="mt-3">
                                <strong>Oracle Text:</strong>
                                <div class="oracle-text border rounded p-2 mt-1 bg-light">
                                    \${card.oracle_text.replace(/\\n/g, '<br>')}
                                </div>
                            </div>
                        \` : ''}
                        \${card.flavor_text ? \`
                            <div class="mt-3">
                                <strong>Flavor Text:</strong>
                                <div class="text-muted fst-italic">"\${card.flavor_text}"</div>
                            </div>
                        \` : ''}
                        \${card.artist ? \`<p class="mt-3 mb-1"><strong>Artist:</strong> \${card.artist}</p>\` : ''}
                        \${card.collector_number ? \`<p class="mb-1"><strong>Collector Number:</strong> \${card.collector_number}</p>\` : ''}
                        \${card.prices_usd ? \`<p class="mb-1"><strong>Price (USD):</strong> $\${card.prices_usd}</p>\` : ''}
                    </div>
                </div>
                
                \${card.keywords && card.keywords.length > 0 ? \`
                    <div class="row mt-3">
                        <div class="col-12">
                            <strong>Keywords:</strong>
                            <div class="mt-1">
                                \${card.keywords.map(keyword => \`<span class="badge bg-info me-1">\${keyword}</span>\`).join('')}
                            </div>
                        </div>
                    </div>
                \` : ''}
                
                \${card.legalities_standard || card.legalities_modern || card.legalities_commander ? \`
                    <div class="row mt-3">
                        <div class="col-12">
                            <strong>Legalities:</strong>
                            <div class="mt-1">
                                \${card.legalities_standard ? \`<span class="badge bg-secondary me-1">Standard: \${card.legalities_standard}</span>\` : ''}
                                \${card.legalities_modern ? \`<span class="badge bg-secondary me-1">Modern: \${card.legalities_modern}</span>\` : ''}
                                \${card.legalities_commander ? \`<span class="badge bg-secondary me-1">Commander: \${card.legalities_commander}</span>\` : ''}
                            </div>
                        </div>
                    </div>
                \` : ''}
            \`;
            
            modalBody.innerHTML = detailsHTML;
            
            // Set Scryfall link if available
            if (card.scryfall_uri) {
                scryfallLink.href = card.scryfall_uri;
                scryfallLink.style.display = 'inline-block';
            } else {
                scryfallLink.style.display = 'none';
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('cardDetailModal'));
            modal.show();
        }
        
        function applyAdvancedFilters() {
            const rarity = document.getElementById('rarityFilter').value;
            const source = document.getElementById('sourceFilter').value;
            const manaCost = document.getElementById('manaCostFilter').value;
            const setCode = document.getElementById('setFilter').value;
            
            // Combine filters
            let searchTerms = [];
            if (rarity) searchTerms.push(rarity);
            if (source) searchTerms.push(source === 'both' ? 'Matched' : '17Lands');
            if (manaCost) searchTerms.push(manaCost);
            if (setCode) searchTerms.push(setCode.toUpperCase());
            
            currentTable.search(searchTerms.join(' ')).draw();
        }
        
        function clearAdvancedFilters() {
            document.getElementById('rarityFilter').value = '';
            document.getElementById('sourceFilter').value = '';
            document.getElementById('manaCostFilter').value = '';
            document.getElementById('setFilter').value = '';
            document.getElementById('globalSearch').value = '';
            
            currentTable.search('').draw();
        }
        
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;

  // Write the HTML file
  fs.writeFileSync(path.join(__dirname, '../docs/index.html'), html);
  console.log('✅ Enhanced HTML page generated successfully!');
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
