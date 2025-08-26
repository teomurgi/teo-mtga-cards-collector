const fs = require('fs');
const path = require('path');

function generateHTML() {
  console.log('📄 Generating enhanced HTML page with Safari optimizations...');
  
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
        .card-image { width: 30px; height: 42px; object-fit: cover; border-radius: 3px; }
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background-color: #f8f9fa; }
        .loading-section {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
    </style>
</head>
<body>
    <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
            <div class="col">
                <h1 class="display-4">🃏 MTG Arena Cards Collection</h1>
                <p class="lead">Comprehensive database with ${totalCards.toLocaleString()} cards</p>
            </div>
        </div>

        <!-- Downloads -->
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-body">
                        <h5>Complete Dataset</h5>
                        <a href="mtga_cards.jsonl" class="btn btn-primary" download>
                            Download mtga_cards.jsonl (${fileSize} MB)
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body">
                        <h6>Stats</h6>
                        <ul class="list-unstyled mb-0">
                            <li><strong>${stats.total.toLocaleString()}</strong> total cards</li>
                            <li><strong>${stats.bothSources.toLocaleString()}</strong> matched</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Browser Activation -->
        <div class="row mb-4" id="activation">
            <div class="col">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h3>🔍 Interactive Card Browser</h3>
                        <p>Search and filter ${totalCards.toLocaleString()} cards in real-time</p>
                        
                        <button class="btn btn-primary btn-lg" onclick="startBrowser()">
                            <i class="fas fa-play"></i> Launch Interactive Browser
                        </button>
                        
                        <p class="text-muted mt-3 mb-0">
                            <small><i class="fas fa-info-circle"></i> This will download and process the full dataset (~${fileSize} MB)</small>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Browser Content -->
        <div id="browser" style="display: none;">
            <!-- Loading -->
            <div class="row" id="loading">
                <div class="col">
                    <div class="card">
                        <div class="card-body">
                            <div class="loading-section">
                                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                                <h5 class="mt-3" id="loadTitle">Loading...</h5>
                                <p class="text-muted" id="loadText">Preparing data...</p>
                                <div class="progress mt-3" style="width: 300px;">
                                    <div class="progress-bar" id="progress" style="width: 0%">0%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Search -->
            <div class="row mb-3" id="search" style="display: none;">
                <div class="col">
                    <div class="card">
                        <div class="card-body">
                            <input type="text" class="form-control" id="searchBox" placeholder="Search cards...">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div class="row" id="tableRow" style="display: none;">
                <div class="col">
                    <div class="card">
                        <div class="card-body">
                            <table id="cardsTable" class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Set</th>
                                        <th>Rarity</th>
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
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    
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
                updateProgress('Loading card database', 'Downloading ${totalCards.toLocaleString()} cards...', 20);
                
                const response = await fetch('mtga_cards.jsonl');
                const text = await response.text();
                
                updateProgress('Processing...', 'Parsing cards...', 60);
                
                const lines = text.split('\\n').filter(l => l.trim());
                lines.forEach(line => {
                    try {
                        cards.push(JSON.parse(line));
                    } catch(e) {}
                });
                
                updateProgress('Complete!', 'Ready!', 100);
                setupTable();
                
            } catch (error) {
                showError('Load failed: ' + error.message);
            }
        }
        
        function setupTable() {
            const tbody = document.getElementById('tbody');
            tbody.innerHTML = cards.map(card => 
                '<tr>' +
                '<td>' + (card.name || '') + '</td>' +
                '<td>' + (card.type_line || card.types || '') + '</td>' +
                '<td>' + (card.set_code || '') + '</td>' +
                '<td>' + (card.rarity || '') + '</td>' +
                '</tr>'
            ).join('');
            
            table = $('#cardsTable').DataTable({
                pageLength: 50
            });
            
            $('#searchBox').on('keyup', function() {
                table.search(this.value).draw();
            });
            
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('search').style.display = 'block';
                document.getElementById('tableRow').style.display = 'block';
            }, 300);
        }
        
        function updateProgress(title, text, percent) {
            document.getElementById('loadTitle').textContent = title;
            document.getElementById('loadText').textContent = text;
            document.getElementById('progress').style.width = percent + '%';
            document.getElementById('progress').textContent = Math.round(percent) + '%';
        }
        
        function showError(msg) {
            document.getElementById('loading').innerHTML = 
                '<div class="card"><div class="card-body text-center">' +
                '<h5 class="text-danger">Error</h5>' +
                '<p>' + msg + '</p>' +
                '<button class="btn btn-primary" onclick="location.reload()">Retry</button>' +
                '</div></div>';
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
