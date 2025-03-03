// Initialize DOM elements
const loadingOverlay = document.querySelector('.loading-overlay');
const recommendationsContainer = document.getElementById('recommendationsContainer');
const errorContainer = document.getElementById('errorContainer');

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger animate__animated animate__fadeIn';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorContainer.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function getRiskClass(riskScore) {
    if (riskScore >= 7) return 'high-risk';
    if (riskScore >= 4) return 'medium-risk';
    return 'low-risk';
}

function getRiskBadgeColor(riskScore) {
    if (riskScore >= 7) return 'bg-danger';
    if (riskScore >= 4) return 'bg-warning text-dark';
    return 'bg-success';
}

function formatPrice(price) {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

function formatPercentage(value) {
    if (!value) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function updateRecommendations(data) {
    try {
        const recommendationsDiv = document.getElementById('recommendations');
        const disclaimer = document.getElementById('disclaimer').querySelector('span');

        if (!recommendationsDiv || !disclaimer) {
            throw new Error('Required DOM elements not found');
        }

        if (!data.specific_recommendations || data.specific_recommendations.length === 0) {
            recommendationsDiv.innerHTML = '<div class="alert alert-warning">No recommendations available at this time.</div>';
            return;
        }

        recommendationsDiv.innerHTML = data.specific_recommendations
            .map((rec, index) => {
                const riskScore = rec.risk_score || 5;
                const riskClass = getRiskClass(riskScore);
                const badgeColor = getRiskBadgeColor(riskScore);
                
                return `
                    <div class="card recommendation-card ${riskClass} mb-4 animate__animated animate__fadeInUp animate__delay-${index}s">
                        <span class="risk-badge ${badgeColor}">
                            Risk Level: ${riskScore}/10
                        </span>
                        <div class="card-body">
                            <h4 class="card-title d-flex align-items-center mb-4">
                                <i class="fas fa-coins text-warning me-2"></i>
                                ${rec.coin || 'Unknown'}
                            </h4>
                            
                            <div class="coin-stats">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-2">Current Price</h6>
                                        <h5 class="mb-0">${formatPrice(rec.price)}</h5>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-muted mb-2">24h Change</h6>
                                        <h5 class="mb-0 ${rec.change_24h >= 0 ? 'text-success' : 'text-danger'}">
                                            ${formatPercentage(rec.change_24h)}
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <h6 class="mb-3">Analysis Points:</h6>
                            ${(rec.analysis || []).map(point => `
                                <div class="analysis-point animate__animated animate__fadeIn">
                                    <i class="fas fa-chart-line text-info me-2"></i>
                                    ${point}
                                </div>
                            `).join('')}
                            
                            ${rec.prediction ? `
                                <div class="mt-4 pt-3 border-top">
                                    <h6 class="text-primary mb-2">
                                        <i class="fas fa-chart-bar me-2"></i>
                                        Price Prediction
                                    </h6>
                                    <p class="mb-0">${rec.prediction}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            })
            .join('');

        disclaimer.textContent = data.disclaimer || 'Cryptocurrency trading involves risks. Always do your own research before making investment decisions.';

    } catch (error) {
        console.error('Error updating recommendations:', error);
        showError('Failed to update recommendations. Please try again.');
        throw error;
    }
}

async function getRecommendations() {
    try {
        loadingOverlay.style.display = 'flex';
        
        if (recommendationsContainer) {
            recommendationsContainer.style.display = 'none';
        }

        document.querySelectorAll('.alert-danger').forEach(el => el.remove());

        const riskProfile = document.getElementById('riskProfile')?.value || 'moderate';
        const response = await fetch(`/api/recommendations?risk_profile=${riskProfile}`);

        if (!response.ok) {
            throw new Error('Failed to fetch recommendations. Please try again later.');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to generate recommendations. Please try again later.');
        }

        if (!data.recommendations) {
            throw new Error('No recommendations data received from server.');
        }

        updateRecommendations(data.recommendations);

        if (recommendationsContainer) {
            recommendationsContainer.style.display = 'block';
        }

    } catch (error) {
        showError(error.message);
        console.error('Error:', error);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function initializeEventListeners() {
    const getRecommendationsButton = document.getElementById('getRecommendations');
    if (getRecommendationsButton) {
        getRecommendationsButton.addEventListener('click', getRecommendations);
    } else {
        console.error('Get recommendations button not found');
    }
}

document.addEventListener('DOMContentLoaded', initializeEventListeners);
