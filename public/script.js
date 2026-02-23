let myChart = null;
let priceChart = null;
let isLoggedIn = false;

// Login Modal Functions
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('loginOverlay');
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('loginOverlay');
    const errorMsg = document.getElementById('loginError');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    document.body.style.overflow = 'auto';

    // Clear form and error
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorMsg.classList.add('hidden');
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');

    // Dummy validation
    if (username === 'user' && password === '12345678') {
        isLoggedIn = true;
        errorMsg.classList.add('hidden');

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-msg';
        successMsg.innerHTML = '<i class="fa-solid fa-check"></i> Login successful!';
        document.querySelector('.modal-content').prepend(successMsg);

        // Close modal after short delay
        setTimeout(() => {
            closeLoginModal();
            // Remove success message
            if (successMsg.parentNode) {
                successMsg.parentNode.removeChild(successMsg);
            }

            // Update navbar to show logged-in state
            updateNavbarLoginState(username);
        }, 1500);
    } else {
        isLoggedIn = false;
        errorMsg.textContent = 'Invalid username or password';
        errorMsg.classList.remove('hidden');
    }
}

function updateNavbarLoginState(username) {
    const navButtons = document.getElementById('navButtons');
    const userProfile = document.getElementById('userProfile');
    const displayUsername = document.getElementById('displayUsername');

    // Hide login buttons
    navButtons.style.display = 'none';

    // Show user profile
    userProfile.style.display = 'flex';
    displayUsername.textContent = username;
}

function handleLogout() {
    isLoggedIn = false;

    const navButtons = document.getElementById('navButtons');
    const userProfile = document.getElementById('userProfile');

    // Show login buttons
    navButtons.style.display = 'flex';

    // Hide user profile
    userProfile.style.display = 'none';
}

// Navigation Function
function navigateTo(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update active navbar link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.style.color = 'var(--accent)';
        } else {
            link.style.color = 'var(--text)';
        }
    });
}

// Set home as default on load
document.addEventListener('DOMContentLoaded', function() {
    navigateTo('home');
    initializeCanvasBackground();

    // Close modal on Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeLoginModal();
        }
    });
});

async function analyzeCoin() {
    const symbol = document.getElementById('coinInput').value.toUpperCase();
    const resultSection = document.getElementById('resultSection');
    const loader = document.getElementById('loader');
    const aiCard = document.getElementById('aiCard');

    if (!symbol) return;

    loader.classList.remove('hidden');
    resultSection.classList.add('hidden');

    try {
        const response = await fetch(`/analyze/${symbol}`);
        const data = await response.json();

        if (data.success) {
            // Fill Data
            document.getElementById('marketDetails').innerHTML = `
                <div class="stat-row"><span>SYMBOL</span> <span style="color:var(--accent)">${data.marketData.symbol}</span></div>
                <div class="stat-row"><span>PRICE</span> <span>$${data.marketData.price}</span></div>
                <div class="stat-row"><span>24H CHANGE</span> <span style="color:${data.marketData.percent_change_24h >= 0 ? 'var(--buy)' : 'var(--sell)'}">${data.marketData.percent_change_24h}%</span></div>
                <div class="stat-row"><span>MARKET CAP</span> <span>$${data.marketData.market_cap}</span></div>
            `;

            // Parse Score
            const match = data.analysis.match(/(\d+)%/);
            const score = match ? parseInt(match[1]) : 60;

            // Dynamic UI Glow & Text
            aiCard.className = 'card ai-card glass'; // Reset
            if (data.analysis.includes("BUY")) aiCard.classList.add('glow-green');
            else if (data.analysis.includes("SELL")) aiCard.classList.add('glow-red');
            else aiCard.classList.add('glow-blue');

            document.getElementById('aiResponse').innerHTML = data.analysis
                .replace("BUY", `<span style="color:var(--buy); font-weight:800">BUY</span>`)
                .replace("SELL", `<span style="color:var(--sell); font-weight:800">SELL</span>`);

            document.getElementById('chartCenterText').innerText = score + "%";
            document.getElementById('chartCenterText').style.color = score >= 60 ? 'var(--buy)' : (score < 40 ? 'var(--sell)' : 'var(--accent)');

            updateChart(score);
            resultSection.classList.remove('hidden');

            // Fetch and display price history
            await fetchAndDisplayPriceChart(data.marketData.symbol);
        }
    } catch (err) {
        console.error(err);
    } finally {
        loader.classList.add('hidden');
    }
}

function updateChart(score) {
    const ctx = document.getElementById('cryptoBarChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [score >= 60 ? '#00ff88' : (score < 40 ? '#ff3e3e' : '#00f2ff'), 'rgba(255,255,255,0.05)'],
                borderWidth: 0,
                borderRadius: 20
            }]
        },
        options: {
            cutout: '85%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });
}

// Fetch price history from CoinGecko and display as chart
async function fetchAndDisplayPriceChart(symbol) {
    try {
        const coinMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana',
            'XRP': 'ripple',
            'ADA': 'cardano',
            'DOGE': 'dogecoin',
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'BNB': 'binancecoin',
            'XLM': 'stellar',
            'LTC': 'litecoin',
            'LINK': 'chainlink',
            'MATIC': 'matic-network'
        };

        const coinId = coinMap[symbol] || symbol.toLowerCase();

        // Fetch 30 days of historical data
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`
        );

        if (!response.ok) {
            console.error('Failed to fetch price data');
            return;
        }

        const data = await response.json();
        const prices = data.prices; // Array of [timestamp, price]

        // Prepare chart data
        const labels = prices.map(p => {
            const date = new Date(p[0]);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const priceData = prices.map(p => p[1].toFixed(2));

        // Create price chart
        const ctx = document.getElementById('priceChart').getContext('2d');
        if (priceChart) priceChart.destroy();

        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${symbol} Price (USD)`,
                    data: priceData,
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0, 242, 255, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#00f2ff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff',
                            font: { size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00f2ff',
                        bodyColor: '#ffffff',
                        borderColor: '#00f2ff',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error fetching price chart:', err);
    }
}

// Initialize animated canvas background for home section
function initializeCanvasBackground() {
    const canvas = document.getElementById('homeCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationTime = 0;

    function animate() {
        // Clear canvas with dark background
        ctx.fillStyle = 'rgba(5, 7, 10, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        drawGrid();

        // Draw animated upward trending graph
        drawTrendingGraph(animationTime);

        animationTime += 0.5;
        requestAnimationFrame(animate);
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 0; i < canvas.width; i += 60) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i < canvas.height; i += 60) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
    }

    function drawTrendingGraph(time) {
        const padding = 80;
        const graphWidth = canvas.width - padding * 2;
        const graphHeight = canvas.height - padding * 2;

        // Draw trend line with wave effect
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.8)';
        ctx.lineWidth = 3;

        for (let x = 0; x < graphWidth; x += 5) {
            // Create upward trending line with smooth wave
            const baseY = graphHeight - (x / graphWidth) * graphHeight * 0.7; // Upward trend
            const waveAmount = Math.sin((x / 30) + time * 0.02) * 20;
            const y = baseY + waveAmount;

            const screenX = padding + x;
            const screenY = padding + y;

            if (x === 0) {
                ctx.moveTo(screenX, screenY);
            } else {
                ctx.lineTo(screenX, screenY);
            }
        }
        ctx.stroke();

        // Draw glowing area under the line
        ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.lineTo(canvas.width - padding, padding + graphHeight);
        ctx.lineTo(padding, padding + graphHeight);
        ctx.fill();

        // Draw animated moving dots on the line
        ctx.fillStyle = '#00ff88';
        for (let i = 0; i < 5; i++) {
            const dotX = (time * 2 + i * 70) % graphWidth;
            const baseY = graphHeight - (dotX / graphWidth) * graphHeight * 0.7;
            const waveAmount = Math.sin((dotX / 30) + time * 0.02) * 20;
            const dotY = baseY + waveAmount;

            const screenX = padding + dotX;
            const screenY = padding + dotY;

            // Draw glowing circles
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Glow effect
            ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#00ff88';
        }

        // Draw percentage text at bottom
        ctx.fillStyle = 'rgba(0, 242, 255, 0.6)';
        ctx.font = 'bold 24px Space Grotesk';
        ctx.textAlign = 'left';
        ctx.fillText('+' + Math.floor((time / 2) % 100) + '%', padding, canvas.height - 20);
    }

    animate();
}