const API_BASE = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

async function loadActiveGames() {
    const container = document.getElementById('games-container');
    try {
        const response = await fetch(`${API_BASE}?action=getActiveGames`);
        const games = await response.json();
        
        if (!games || games.length === 0) {
            container.innerHTML = '<p>No active games available for picking right now. Check back soon!</p>';
            return;
        }
        
        container.innerHTML = '';
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-header">
                    <span class="round">${game.round}</span>
                    <span class="points">Base: ${game.basePoints} pts + ${game.bonusPoints} bonus</span>
                </div>
                <div class="pick-options">
                    <label>
                        <input type="radio" name="pick_${game.gameId}" value="${game.teamA}" required>
                        ${game.teamA}
                    </label>
                    <label>
                        <input type="radio" name="pick_${game.gameId}" value="${game.teamB}" required>
                        ${game.teamB}
                    </label>
                </div>
                <div class="series-length">
                    <label>Series length (games):</label>
                    <select name="length_${game.gameId}" required>
                        <option value="">-- Select --</option>
                        <option value="4">4 games</option>
                        <option value="5">5 games</option>
                        <option value="6">6 games</option>
                        <option value="7">7 games</option>
                    </select>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load games. Please refresh.</p>';
        console.error(error);
    }
}

document.getElementById('pick-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const messageDiv = document.getElementById('message');
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        showMessage('Please enter your name.', 'error');
        return;
    }
    
    // Gather all picks
    const games = document.querySelectorAll('.game-card');
    const picks = [];
    let isValid = true;
    
    games.forEach(card => {
        const gameIdMatch = card.querySelector('[name^="pick_"]').name.match(/pick_(.+)/);
        const gameId = gameIdMatch[1];
        const pickRadio = card.querySelector(`input[name="pick_${gameId}"]:checked`);
        const lengthSelect = card.querySelector(`select[name="length_${gameId}"]`);
        
        if (!pickRadio || !lengthSelect.value) {
            isValid = false;
            card.style.border = '1px solid #dc3545';
        } else {
            card.style.border = '1px solid rgba(255,255,255,0.1)';
            picks.push({
                gameId: gameId,
                pick: pickRadio.value,
                lengthGuess: parseInt(lengthSelect.value)
            });
        }
    });
    
    if (!isValid) {
        showMessage('Please complete all picks and series lengths.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Submit each pick (you could batch them in one call with a modified script)
        for (const pick of picks) {
            const response = await fetch(API_BASE, {
                method: 'POST',
                mode: 'no-cors', // Required for Apps Script POST
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName: playerName,
                    gameId: pick.gameId,
                    pick: pick.pick,
                    lengthGuess: pick.lengthGuess
                })
            });
            // Note: no-cors means we can't read response; assume success if no error
        }
        
        showMessage(`✅ Picks submitted successfully for ${playerName}! Good luck!`, 'success');
        document.getElementById('pick-form').reset();
        // Store name in localStorage for convenience
        localStorage.setItem('lastPlayerName', playerName);
    } catch (error) {
        showMessage('Submission failed. Please try again.', 'error');
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Picks';
    }
});

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Pre-fill name if stored
const lastName = localStorage.getItem('lastPlayerName');
if (lastName) document.getElementById('playerName').value = lastName;

loadActiveGames();