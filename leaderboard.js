const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

let fullLeaderboard = [];

async function fetchLeaderboard() {
    const loadingEl = document.getElementById('loading');
    const tableEl = document.getElementById('leaderboard-table');
    const tbody = document.getElementById('leaderboard-body');
    
    try {
        const response = await fetch(API_URL);
        fullLeaderboard = await response.json();
        
        if (fullLeaderboard.length === 0) {
            loadingEl.textContent = 'No picks submitted yet. Be the first!';
            return;
        }
        
        loadingEl.style.display = 'none';
        tableEl.style.display = 'table';
        
        renderTable(fullLeaderboard);
        setupSearch();
        
        // Try to find user's last used name
        const lastName = localStorage.getItem('lastPlayerName');
        if (lastName) {
            document.getElementById('searchInput').value = lastName;
            filterTable(lastName);
            highlightUserPosition(lastName);
        }
    } catch (error) {
        loadingEl.textContent = 'Error loading leaderboard. Please try again later.';
        console.error('Fetch error:', error);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    data.forEach(player => {
        const row = document.createElement('tr');
        if (player.rank === 1) row.style.color = 'gold';
        else if (player.rank === 2) row.style.color = 'silver';
        else if (player.rank === 3) row.style.color = '#cd7f32';
        
        row.innerHTML = `
            <td>${player.rank}</td>
            <td class="player-name">${player.name}</td>
            <td>${player.points}</td>
            <td>${player.tiebreakerDiff || '—'}</td>
        `;
        tbody.appendChild(row);
    });
}

function filterTable(searchTerm) {
    const filtered = fullLeaderboard.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderTable(filtered);
    
    // Show message if no matches
    const tbody = document.getElementById('leaderboard-body');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No players found</td></tr>';
    }
}

function highlightUserPosition(playerName) {
    const user = fullLeaderboard.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    const positionDiv = document.getElementById('your-position');
    if (user) {
        document.getElementById('user-rank').textContent = `#${user.rank}`;
        document.getElementById('user-points').textContent = user.points;
        positionDiv.classList.remove('hidden');
        
        // Highlight row in table
        const rows = document.querySelectorAll('#leaderboard-body tr');
        rows.forEach(row => {
            const nameCell = row.querySelector('.player-name');
            if (nameCell && nameCell.textContent.toLowerCase() === playerName.toLowerCase()) {
                row.classList.add('highlight-row');
            }
        });
    } else {
        positionDiv.classList.add('hidden');
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value;
        filterTable(term);
        highlightUserPosition(term);
        if (term) localStorage.setItem('lastPlayerName', term);
    });
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterTable('');
        document.getElementById('your-position').classList.add('hidden');
        renderTable(fullLeaderboard);
    });
}

fetchLeaderboard();