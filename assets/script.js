// Replace this with YOUR actual Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbyBe0X8nhU7oOtJJIn5mrAbXeDzuv5cfCbY8h1HYzSeaIRDnOEx9SdXbDWRaTfDCfpX/exec';

async function fetchLeaderboard() {
    const loadingEl = document.getElementById('loading');
    const tableEl = document.getElementById('leaderboard-table');
    const tbody = document.getElementById('leaderboard-body');
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.length === 0) {
            loadingEl.textContent = 'No picks submitted yet. Be the first!';
            return;
        }
        
        // Clear loading and show table
        loadingEl.style.display = 'none';
        tableEl.style.display = 'table';
        
        // Build table rows
        tbody.innerHTML = '';
        data.forEach(player => {
            const row = document.createElement('tr');
            
            // Highlight top 3 ranks
            let rankClass = '';
            if (player.rank === 1) rankClass = 'style="color: gold; font-weight: bold;"';
            else if (player.rank === 2) rankClass = 'style="color: silver;"';
            else if (player.rank === 3) rankClass = 'style="color: #cd7f32;"';
            
            row.innerHTML = `
                <td ${rankClass}>${player.rank}</td>
                <td>${player.name}</td>
                <td>${player.points}</td>
                <td>${player.tiebreakerDiff || '—'}</td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        loadingEl.textContent = 'Error loading leaderboard. Please try again later.';
        console.error('Fetch error:', error);
    }
}

// Run on page load
fetchLeaderboard();