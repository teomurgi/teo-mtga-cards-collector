const fs = require('fs');
const path = require('path');

function generateHTML() {
  console.log('📄 Generating enhanced HTML page with beautiful styling...');
  
  // Read the JSONL file
  const jsonlPath = path.join(__dirname, '../docs/mtga_cards.jsonl');
  const jsonlData = fs.readFileSync(jsonlPath, 'utf8');
  
  // Parse cards for statistics
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

  const totalCards = allCards.length;
  const fileSize = (fs.statSync(jsonlPath).size / 1024 / 1024).toFixed(1);
  const generationDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MTG Arena Cards Collection - Magic The Gathering Card Database & Explorer</title>
    <meta name="description" content="Comprehensive Magic The Gathering Arena card collection database. Browse, search and explore MTG cards with detailed stats, rarity filters, and interactive features. Unofficial MTG card explorer.">
    <meta name="keywords" content="MTG, Magic The Gathering, MTG Arena, Magic cards, card database, MTG collection, Magic card explorer, MTG card search, Magic card browser, trading cards, Wizards of the Coast, MTG stats, card rarity, mana cost, Magic spells">
    <meta name="author" content="MTG Arena Cards Collector">
    <meta property="og:title" content="MTG Arena Cards Collection - Magic The Gathering Database">
    <meta property="og:description" content="Explore thousands of Magic The Gathering Arena cards with advanced search and filtering capabilities.">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="MTG Arena Cards Collection">
    <meta name="twitter:description" content="Interactive Magic The Gathering Arena card database and explorer.">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .main-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            margin: 20px auto;
            max-width: 1400px;
        }
        
        .header-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 20px 20px 0 0;
            padding: 30px;
            text-align: center;
        }
        
        .header-section h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .stats-card {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            transition: transform 0.3s ease;
        }
        
        .stats-card:hover {
            transform: translateY(-5px);
        }
        
        .download-card {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border: none;
            border-radius: 15px;
            color: white;
            transition: transform 0.3s ease;
        }
        
        .download-card:hover {
            transform: translateY(-3px);
        }
        
        .browser-card {
            background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
            border: none;
            border-radius: 15px;
            color: white;
            transition: all 0.3s ease;
        }
        
        .browser-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(0,123,255,0.4);
        }
        
        .filter-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        
        .form-control, .form-select {
            border-radius: 10px;
            border: 2px solid #e9ecef;
            transition: all 0.3s ease;
        }
        
        .form-control:focus, .form-select:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .table-container {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .table {
            margin-bottom: 0;
        }
        
        .table thead th {
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            color: white;
            border: none;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 15px 10px;
        }
        
        .table tbody tr {
            transition: all 0.3s ease;
        }
        
        .table tbody tr:hover {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            transform: scale(1.01);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .card-image {
            width: 40px;
            height: 56px;
            object-fit: cover;
            border-radius: 8px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            transition: transform 0.3s ease;
        }
        
        .card-image:hover {
            transform: scale(1.5);
            z-index: 1000;
            position: relative;
        }
        
        .rarity-mythic { 
            color: #ff6b35; 
            font-weight: bold; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .rarity-rare { 
            color: #ffd700; 
            font-weight: bold; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .rarity-uncommon { 
            color: #c0c0c0; 
            font-weight: bold; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .rarity-common { 
            color: #666; 
            font-weight: 500;
        }
        
        .mana-cost {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.9em;
        }
        
        .type-line {
            font-style: italic;
            color: #495057;
        }
        
        .clickable-row {
            cursor: pointer;
        }
        
        .loading-section {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
        }
        
        .spinner-border {
            width: 4rem;
            height: 4rem;
            color: #667eea;
        }
        
        .progress {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.6s ease;
        }
        
        .modal-content {
            border-radius: 20px;
            border: none;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        .modal-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 20px 20px 0 0;
            border: none;
        }
        
        .card-detail-image {
            max-width: 100%;
            height: auto;
            border-radius: 15px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        
        .btn {
            border-radius: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            border: none;
        }
        
        .btn-outline-secondary {
            border: 2px solid #6c757d;
            color: #6c757d;
            font-weight: 600;
        }
        
        .btn-outline-secondary:hover {
            background: #6c757d;
            border-color: #6c757d;
        }
        
        .generation-date {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 10px 15px;
            margin-top: 15px;
            display: inline-block;
        }
        
        /* Footer Styles */
        .footer-section {
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            color: white;
            padding: 40px 0;
            margin-top: 40px;
            border-radius: 0 0 20px 20px;
        }
        
        .footer-content {
            text-align: center;
        }
        
        .github-buttons {
            margin: 25px 0;
        }
        
        .github-btn {
            background: linear-gradient(135deg, #24292e 0%, #1a1e22 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            margin: 0 10px;
            transition: all 0.3s ease;
            font-weight: 600;
        }
        
        .github-btn:hover {
            background: linear-gradient(135deg, #2f363d 0%, #24292e 100%);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.3);
        }
        
        .github-btn i {
            margin-right: 8px;
            font-size: 1.1em;
        }
        
        .disclaimer {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            margin: 25px auto;
            max-width: 800px;
            font-size: 0.9em;
            line-height: 1.6;
        }
        
        .author-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="main-container">
            <!-- Header -->
            <div class="header-section">
                <h1>🃏 MTG Arena Cards Collection</h1>
                <p class="lead fs-4">Comprehensive database with ${totalCards.toLocaleString()} cards</p>
                <div class="generation-date">
                    <i class="fas fa-clock me-2"></i>
                    Generated: ${generationDate}
                </div>
            </div>

            <div class="p-4">
                <!-- Stats Row -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="card download-card h-100">
                            <div class="card-body text-center">
                                <h5><i class="fas fa-download me-2"></i>Download Dataset</h5>
                                <a href="mtga_cards.jsonl" class="btn btn-light btn-sm" download>
                                    mtga_cards.jsonl (${fileSize} MB)
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card browser-card h-100" id="activation">
                            <div class="card-body text-center">
                                <h5><i class="fas fa-search me-2"></i>Interactive Browser</h5>
                                <button class="btn btn-light btn-sm" onclick="startBrowser()">
                                    Launch Browser
                                </button>
                                <small class="d-block mt-2 opacity-75">
                                    ~${fileSize} MB download
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card stats-card h-100">
                            <div class="card-body text-center">
                                <h3 class="text-primary">${stats.total.toLocaleString()}</h3>
                                <p class="mb-0">Total Cards</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card stats-card h-100">
                            <div class="card-body text-center">
                                <h3 class="text-success">${stats.bothSources.toLocaleString()}</h3>
                                <p class="mb-0">Matched Cards</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Browser Content -->
                <div id="browser" style="display: none;">
                    <!-- Loading -->
                    <div id="loading">
                        <div class="card">
                            <div class="card-body">
                                <div class="loading-section">
                                    <div class="spinner-border" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <h4 class="mt-3" id="loadTitle">Loading...</h4>
                                    <p class="text-muted" id="loadText">Preparing data...</p>
                                    <div class="progress mt-3" style="width: 350px; height: 8px;">
                                        <div class="progress-bar" id="progress" style="width: 0%"></div>
                                    </div>
                                    <div class="mt-2">
                                        <small class="text-muted">
                                            <span id="progressText">0%</span> - 
                                            <span id="progressDetail">Initializing...</span>
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Filters -->
                    <div id="filters" style="display: none;">
                        <div class="filter-section">
                            <h5 class="mb-3"><i class="fas fa-filter me-2"></i>Filters & Search</h5>
                            <div class="row">
                                <div class="col-lg-3 col-md-6 mb-3">
                                    <label class="form-label">Search Cards</label>
                                    <input type="text" class="form-control" id="searchBox" placeholder="Card name, text, type...">
                                </div>
                                <div class="col-lg-2 col-md-6 mb-3">
                                    <label class="form-label">Rarity</label>
                                    <select class="form-select" id="rarityFilter">
                                        <option value="">All Rarities</option>
                                        <option value="mythic">Mythic Rare</option>
                                        <option value="rare">Rare</option>
                                        <option value="uncommon">Uncommon</option>
                                        <option value="common">Common</option>
                                    </select>
                                </div>
                                <div class="col-lg-2 col-md-6 mb-3">
                                    <label class="form-label">Set</label>
                                    <select class="form-select" id="setFilter">
                                        <option value="">All Sets</option>
                                    </select>
                                </div>
                                <div class="col-lg-3 col-md-6 mb-3">
                                    <label class="form-label">Type</label>
                                    <select class="form-select" id="typeFilter">
                                        <option value="">All Types</option>
                                    </select>
                                </div>
                                <div class="col-lg-2 col-md-6 mb-3">
                                    <label class="form-label">&nbsp;</label>
                                    <button class="btn btn-outline-secondary w-100" onclick="clearFilters()">
                                        <i class="fas fa-eraser me-1"></i>Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Table -->
                    <div id="tableSection" style="display: none;">
                        <div class="table-container">
                            <table id="cardsTable" class="table table-hover">
                                <thead>
                                    <tr>
                                        <th width="60">Image</th>
                                        <th>Name</th>
                                        <th width="120">Mana Cost</th>
                                        <th>Type</th>
                                        <th width="80">Set</th>
                                        <th width="100">Rarity</th>
                                        <th width="100">Arena ID</th>
                                    </tr>
                                </thead>
                                <tbody id="tbody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer-section">
            <div class="container">
                <div class="footer-content">
                    <h4><i class="fas fa-magic me-2"></i>MTG Arena Cards Collection</h4>
                    <p class="mb-3">Explore the magical world of Magic: The Gathering Arena cards</p>
                    
                    <div class="github-buttons">
                        <a href="https://github.com/teomurgi/teo-mtga-cards-collector" target="_blank" class="github-btn">
                            <i class="fab fa-github"></i>
                            View on GitHub
                        </a>
                        <a href="https://github.com/teomurgi/teo-mtga-cards-collector/stargazers" target="_blank" class="github-btn">
                            <i class="fas fa-star"></i>
                            Star this Repository
                        </a>
                        <a href="https://github.com/teomurgi" target="_blank" class="github-btn">
                            <i class="fas fa-user"></i>
                            Follow Author
                        </a>
                    </div>
                    
                    <div class="disclaimer">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>Disclaimer</h6>
                        <p class="mb-2">
                            This website is <strong>unofficial</strong> and is not affiliated with, endorsed, sponsored, or specifically approved by 
                            <strong>Wizards of the Coast LLC</strong>. This site may use the trademarks and other intellectual property of 
                            Wizards of the Coast LLC, which is permitted under Wizards' Fan Site Policy.
                        </p>
                        <p class="mb-0">
                            <strong>Magic: The Gathering</strong> and <strong>MTG Arena</strong> are trademarks of Wizards of the Coast LLC 
                            in the USA and other countries. Card data is sourced from Scryfall API and 17Lands for educational and 
                            informational purposes only.
                        </p>
                    </div>
                    
                    <div class="author-info">
                        <p class="mb-1">
                            <i class="fas fa-code me-2"></i>Built with ❤️ by 
                            <a href="https://github.com/teomurgi" target="_blank" class="text-light">
                                <strong>teomurgi</strong>
                            </a>
                        </p>
                        <p class="mb-0">
                            <i class="fas fa-database me-2"></i>Card data updated regularly | 
                            <i class="fas fa-clock me-2"></i>Generated on ${new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Card Detail Modal -->
    <div class="modal fade" id="cardModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="cardModalTitle">
                        <i class="fas fa-magic me-2"></i>Card Details
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="cardModalBody">
                    <!-- Card details will be populated here -->
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
    
    <script>
        let cards = [];
        let table = null;
        
        function startBrowser() {
            document.getElementById('activation').style.display = 'none';
            document.getElementById('browser').style.display = 'block';
            loadData();
        }
        
        async function loadData() {
            try {
                updateProgress('Starting Download', 'Fetching ${totalCards.toLocaleString()} cards...', 5);
                
                const response = await fetch('mtga_cards.jsonl');
                if (!response.ok) throw new Error('Failed to fetch data');
                
                updateProgress('Downloading Data', 'Processing card database...', 20);
                const text = await response.text();
                
                updateProgress('Parsing Cards', 'Converting JSONL format...', 50);
                const lines = text.split('\\n').filter(l => l.trim());
                
                updateProgress('Processing Cards', 'Validating card data...', 70);
                lines.forEach((line, index) => {
                    try {
                        cards.push(JSON.parse(line));
                        if (index % 1000 === 0) {
                            const percent = 70 + (index / lines.length) * 20;
                            updateProgress('Processing Cards', 'Processed ' + index.toLocaleString() + ' cards...', percent);
                        }
                    } catch(e) {
                        console.warn('Failed to parse card:', e);
                    }
                });
                
                updateProgress('Finalizing', 'Setting up interface...', 95);
                await new Promise(resolve => setTimeout(resolve, 500));
                
                setupFilters();
                setupTable();
                
                updateProgress('Complete!', 'Ready to browse ' + cards.length.toLocaleString() + ' cards!', 100);
                
                setTimeout(() => {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('filters').style.display = 'block';
                    document.getElementById('tableSection').style.display = 'block';
                }, 1000);
                
            } catch (error) {
                showError('Failed to load cards: ' + error.message);
            }
        }
        
        function setupFilters() {
            // Populate set filter
            const sets = [...new Set(cards.map(c => c.set_code || c.set).filter(Boolean))].sort();
            const setFilter = document.getElementById('setFilter');
            sets.forEach(set => {
                const option = document.createElement('option');
                option.value = set;
                option.textContent = set.toUpperCase();
                setFilter.appendChild(option);
            });
            
            // Populate type filter
            const types = [...new Set(cards.map(c => {
                const typeLine = c.type_line || c.types || '';
                return typeLine.split('—')[0].trim();
            }).filter(Boolean))].sort();
            const typeFilter = document.getElementById('typeFilter');
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeFilter.appendChild(option);
            });
        }
        
        function getRarityClass(rarity) {
            if (!rarity) return 'rarity-common';
            const r = rarity.toLowerCase();
            if (r === 'mythic') return 'rarity-mythic';
            if (r === 'rare') return 'rarity-rare';
            if (r === 'uncommon') return 'rarity-uncommon';
            return 'rarity-common';
        }
        
        function formatManaCost(cost) {
            if (!cost) return '';
            return cost.replace(/{([^}]+)}/g, '($1)');
        }
        
        function getImageUrl(card) {
            if (card.image_uris_normal) return card.image_uris_normal;
            if (card.image_uris && card.image_uris.small) return card.image_uris.small;
            if (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris) {
                return card.card_faces[0].image_uris.small;
            }
            return null; // Return null instead of empty string to indicate no image
        }
        
        function getCardPlaceholder() {
            // Beautiful MTG-style card placeholder using base64 encoded SVG
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA0MCA1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjdlZWE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6Izc2NGJhMjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI1NiIgZmlsbD0idXJsKCNncmFkKSIgcng9IjMiIHJ5PSIzIi8+CiAgPHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjM2IiBoZWlnaHQ9IjUyIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMSIgcng9IjIiIHJ5PSIyIiBvcGFjaXR5PSIwLjMiLz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMCwyOCkiPgogICAgPGNpcmNsZSBjeD0iMCIgY3k9Ii02IiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjciLz4KICAgIDxwYXRoIGQ9Ik0tNCwyIEwwLDYgTDQsMiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC43Ii8+CiAgPC9nPgo8L3N2Zz4K';
        }
        
        function getCardPlaceholderLarge() {
            // Large version for modal
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQyMCIgdmlld0JveD0iMCAwIDMwMCA0MjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRMYXJnZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjdlZWE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6Izc2NGJhMjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDIwIiBmaWxsPSJ1cmwoI2dyYWRMYXJnZSkiIHJ4PSIxNSIgcnk9IjE1Ii8+CiAgPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMjgwIiBoZWlnaHQ9IjQwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIHJ4PSIxMCIgcnk9IjEwIiBvcGFjaXR5PSIwLjMiLz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNTAsMjEwKSI+CiAgICA8Y2lyY2xlIGN4PSIwIiBjeT0iLTMwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjMiIG9wYWNpdHk9IjAuNyIvPgogICAgPHBhdGggZD0iTTAsMTUgTDAsMzUgTTEwLDI1IEwtMTAsMjUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBvcGFjaXR5PSIwLjciLz4KICAgIDx0ZXh0IHg9IjAiIHk9IjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIG9wYWNpdHk9IjAuOCI+Tm8gSW1hZ2U8L3RleHQ+CiAgPC9nPgo8L3N2Zz4K';
        }
        
        function setupTable() {
            const tbody = document.getElementById('tbody');
            tbody.innerHTML = cards.map((card, index) => {
                const rarityClass = getRarityClass(card.rarity);
                const imageUrl = getImageUrl(card);
                const manaCost = formatManaCost(card.mana_cost);
                
                return '<tr class="clickable-row" onclick="showCardDetails(' + index + ')">' +
                    '<td class="text-center">' +
                        '<img src="' + (imageUrl || getCardPlaceholder()) + '" class="card-image" loading="lazy" ' +
                             'title="' + (card.name || 'Unknown Card') + '">' +
                    '</td>' +
                    '<td><strong>' + (card.name || 'Unknown') + '</strong></td>' +
                    '<td class="mana-cost">' + manaCost + '</td>' +
                    '<td class="type-line">' + (card.type_line || card.types || '') + '</td>' +
                    '<td><strong>' + (card.set_code || card.set || '').toUpperCase() + '</strong></td>' +
                    '<td class="' + rarityClass + '">' + (card.rarity || 'Unknown') + '</td>' +
                    '<td class="text-center">' + (card.arena_id || '—') + '</td>' +
                '</tr>';
            }).join('');
            
            table = $('#cardsTable').DataTable({
                pageLength: 50,
                lengthMenu: [[25, 50, 100, -1], [25, 50, 100, "All"]],
                order: [[1, 'asc']],
                columnDefs: [
                    { orderable: false, targets: 0 },
                    { className: "text-center", targets: [0, 4, 6] }
                ],
                language: {
                    search: "",
                    searchPlaceholder: "Search all columns...",
                    lengthMenu: "Show _MENU_ cards per page",
                    info: "Showing _START_ to _END_ of _TOTAL_ cards",
                    infoEmpty: "No cards found",
                    infoFiltered: "(filtered from _MAX_ total cards)"
                },
                dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>rtip'
            });
            
            // Custom search
            $('#searchBox').on('keyup', function() {
                table.search(this.value).draw();
            });
            
            // Rarity filter
            $('#rarityFilter').on('change', function() {
                const value = this.value;
                table.column(5).search(value ? '^' + value + '$' : '', true, false).draw();
            });
            
            // Set filter
            $('#setFilter').on('change', function() {
                const value = this.value;
                table.column(4).search(value ? '^' + value + '$' : '', true, false).draw();
            });
            
            // Type filter
            $('#typeFilter').on('change', function() {
                table.column(3).search(this.value, false, true).draw();
            });
        }
        
        function clearFilters() {
            document.getElementById('searchBox').value = '';
            document.getElementById('rarityFilter').value = '';
            document.getElementById('setFilter').value = '';
            document.getElementById('typeFilter').value = '';
            table.search('').columns().search('').draw();
        }
        
        function showCardDetails(index) {
            const card = cards[index];
            if (!card) return;
            
            const modal = new bootstrap.Modal(document.getElementById('cardModal'));
            document.getElementById('cardModalTitle').innerHTML = 
                '<i class="fas fa-magic me-2"></i>' + (card.name || 'Unknown Card');
            
            const imageUrl = card.image_uris_normal ? card.image_uris_normal :
                           card.image_uris_large ? card.image_uris_large :
                           (card.image_uris && card.image_uris.normal) ? card.image_uris.normal :
                           (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris_normal) ? card.card_faces[0].image_uris_normal :
                           (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris && card.card_faces[0].image_uris.normal) ? card.card_faces[0].image_uris.normal :
                           '';
            
            const rarityClass = getRarityClass(card.rarity);
            const manaCost = formatManaCost(card.mana_cost);
            
            const details = '<div class="row">' +
                    '<div class="col-lg-5">' +
                        '<img src="' + (imageUrl || getCardPlaceholderLarge()) + '" class="card-detail-image w-100" alt="' + (card.name || '') + '">' +
                    '</div>' +
                    '<div class="col-lg-7">' +
                        '<div class="card-info">' +
                            '<h3 class="mb-3">' + (card.name || 'Unknown Card') + '</h3>' +
                            
                            '<div class="row mb-3">' +
                                '<div class="col-6">' +
                                    '<strong>Mana Cost:</strong><br>' +
                                    '<span class="mana-cost">' + (manaCost || 'None') + '</span>' +
                                '</div>' +
                                '<div class="col-6">' +
                                    '<strong>Rarity:</strong><br>' +
                                    '<span class="' + rarityClass + '">' + (card.rarity || 'Unknown') + '</span>' +
                                '</div>' +
                            '</div>' +
                            
                            '<div class="row mb-3">' +
                                '<div class="col-6">' +
                                    '<strong>Type:</strong><br>' +
                                    '<span class="type-line">' + (card.type_line || card.types || 'Unknown') + '</span>' +
                                '</div>' +
                                '<div class="col-6">' +
                                    '<strong>Set:</strong><br>' +
                                    '<strong>' + (card.set_code || card.set || 'Unknown').toUpperCase() + '</strong>' +
                                '</div>' +
                            '</div>' +
                            
                            '<div class="row mb-3">' +
                                '<div class="col-6">' +
                                    '<strong>Arena ID:</strong><br>' +
                                    '<code>' + (card.arena_id || 'N/A') + '</code>' +
                                '</div>' +
                                (card.power !== undefined ? 
                                    '<div class="col-6">' +
                                        '<strong>Power/Toughness:</strong><br>' +
                                        '<span class="badge bg-secondary">' + card.power + '/' + card.toughness + '</span>' +
                                    '</div>' : ''
                                ) +
                            '</div>' +
                            
                            (card.oracle_text ? 
                                '<div class="mb-3">' +
                                    '<strong>Card Text:</strong><br>' +
                                    '<div class="p-3 bg-light rounded">' + card.oracle_text.replace(/\\n/g, '<br>') + '</div>' +
                                '</div>' : ''
                            ) +
                            
                            (card.flavor_text ? 
                                '<div class="mb-3">' +
                                    '<strong>Flavor Text:</strong><br>' +
                                    '<em class="text-muted">' + card.flavor_text + '</em>' +
                                '</div>' : ''
                            ) +
                        '</div>' +
                    '</div>' +
                '</div>';
            
            document.getElementById('cardModalBody').innerHTML = details;
            modal.show();
        }
        
        function updateProgress(title, text, percent) {
            document.getElementById('loadTitle').textContent = title;
            document.getElementById('loadText').textContent = text;
            document.getElementById('progress').style.width = percent + '%';
            document.getElementById('progressText').textContent = Math.round(percent) + '%';
            document.getElementById('progressDetail').textContent = text;
        }
        
        function showError(msg) {
            document.getElementById('loading').innerHTML = 
                '<div class="card">' +
                    '<div class="card-body text-center">' +
                        '<div class="loading-section">' +
                            '<i class="fas fa-exclamation-triangle text-danger" style="font-size: 3rem;"></i>' +
                            '<h4 class="text-danger mt-3">Error Loading Cards</h4>' +
                            '<p class="text-muted">' + msg + '</p>' +
                            '<button class="btn btn-primary" onclick="location.reload()">' +
                                '<i class="fas fa-refresh me-2"></i>Try Again' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, '../docs/index.html'), html);
  console.log('✅ Fresh HTML page generated successfully!');
}

function generateStats(cards) {
  const total = cards.length;
  const bothSources = cards.filter(c => c.source === 'both').length;
  const landsOnly = cards.filter(c => c.source === 'lands_only').length;
  const splitCards = cards.filter(c => c.name && c.name.includes(' // ')).length;
  
  const stats = { total, bothSources, landsOnly, splitCards };
  const githubStats = [
    { total: total.toString() },
    { source: 'both', count: bothSources.toString() },
    { source: 'lands_only', count: landsOnly.toString() }
  ];
  
  return { stats, githubStats };
}

const docsDir = path.join(__dirname, '../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

generateHTML();
