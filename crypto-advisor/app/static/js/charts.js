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

function updateCharts(data) {
    try {
        // Clear previous content
        const marketOverviewChart = document.querySelector("#marketOverviewChart");
        const strategiesContainer = document.getElementById('strategies');
        const recommendationsDiv = document.getElementById('recommendations');
        const disclaimer = document.getElementById('disclaimer');

        // Check if all required elements exist
        if (!marketOverviewChart || !strategiesContainer || !recommendationsDiv || !disclaimer) {
            throw new Error('Required DOM elements not found');
        }

        // Clear market overview chart
        marketOverviewChart.innerHTML = '';

        // Create market overview chart
        if (data.market_overview && data.market_overview.market_caps && data.market_overview.market_caps.length > 0) {
            const options = {
                series: [{
                    name: 'Market Cap',
                    data: data.market_overview.market_caps.slice(-7).map(d => d.value)
                }],
                chart: {
                    type: 'area',
                    height: 350,
                    toolbar: {
                        show: false
                    }
                },
                dataLabels: {
                    enabled: false
                },
                stroke: {
                    curve: 'smooth'
                },
                xaxis: {
                    type: 'datetime',
                    categories: data.market_overview.market_caps.slice(-7).map(d => d.date)
                },
                tooltip: {
                    x: {
                        format: 'dd/MM/yy'
                    }
                },
                theme: {
                    mode: 'light'
                }
            };

            const chart = new ApexCharts(marketOverviewChart, options);
            chart.render();
        } else {
            console.warn('No market overview data available');
            marketOverviewChart.innerHTML = '<div class="alert alert-warning">No market data available for chart</div>';
        }

        // Update strategies
        if (data.strategies && data.strategies.length > 0) {
            strategiesContainer.innerHTML = data.strategies
                .map(strategy => `
                    <div class="list-group-item animate__animated animate__fadeInLeft">
                        <i class="fas fa-check-circle text-success"></i> ${strategy}
                    </div>
                `)
                .join('');
        } else {
            strategiesContainer.innerHTML = '<div class="alert alert-warning">No strategies available</div>';
        }

        // Update recommendations
        if (data.specific_recommendations && data.specific_recommendations.length > 0) {
            recommendationsDiv.innerHTML = data.specific_recommendations
                .map(rec => `
                    <div class="card mb-3 animate__animated animate__fadeInUp">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="card-title mb-0">${rec.coin || 'Unknown'}</h5>
                                <span class="badge ${(rec.change_24h || 0) < 0 ? 'bg-danger' : 'bg-success'}">
                                    ${(rec.change_24h || 0).toFixed(2)}%
                                </span>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted">
                                Current Price: $${(rec.price || 0).toLocaleString()}
                            </h6>
                            <ul class="list-unstyled">
                                ${(rec.analysis || []).map(point => `
                                    <li class="mb-2">
                                        <i class="fas fa-chart-line text-primary"></i> ${point}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `)
                .join('');
        } else {
            recommendationsDiv.innerHTML = '<div class="alert alert-warning">No recommendations available</div>';
        }

        // Update disclaimer
        disclaimer.textContent = data.disclaimer || 'No additional information available.';

    } catch (error) {
        console.error('Error updating charts:', error);
        showError('Failed to update the dashboard with the received data.');
        throw error; // Re-throw to be caught by the caller
    }
}

async function getRecommendations() {
    try {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Hide recommendations container while loading
        if (recommendationsContainer) {
            recommendationsContainer.style.display = 'none';
        }

        // Clear previous content
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

        // Update the UI with recommendations
        updateCharts(data.recommendations);

        // Show recommendations container with animation
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

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEventListeners);

function createPriceChart(containerId, chartData, technicalData) {
    const ctx = document.getElementById(containerId).getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(78, 115, 223, 0.3)');
    gradient.addColorStop(1, 'rgba(78, 115, 223, 0)');
    
    // Add support/resistance lines if available
    const supportResistance = technicalData?.support_resistance || {};
    const annotations = {};
    
    if (supportResistance.resistance_levels) {
        supportResistance.resistance_levels.forEach((level, index) => {
            annotations[`resistance${index}`] = {
                type: 'line',
                borderColor: 'rgba(255, 99, 132, 0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
                label: {
                    enabled: true,
                    content: `R: $${level.toLocaleString()}`,
                    position: 'start'
                },
                scaleID: 'y',
                value: level
            };
        });
    }
    
    if (supportResistance.support_levels) {
        supportResistance.support_levels.forEach((level, index) => {
            annotations[`support${index}`] = {
                type: 'line',
                borderColor: 'rgba(75, 192, 192, 0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
                label: {
                    enabled: true,
                    content: `S: $${level.toLocaleString()}`,
                    position: 'start'
                },
                scaleID: 'y',
                value: level
            };
        });
    }
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.dates,
            datasets: [{
                label: 'Price (USD)',
                data: chartData.values,
                borderColor: 'rgb(78, 115, 223)',
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'rgb(78, 115, 223)',
                pointBorderColor: 'rgb(78, 115, 223)',
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgb(78, 115, 223)',
                pointHoverBorderColor: 'rgb(78, 115, 223)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}`;
                        }
                    }
                },
                annotation: {
                    annotations: annotations
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                    }
                }
            }
        }
    });
}

function createVolumeChart(containerId, chartData) {
    const ctx = document.getElementById(containerId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.dates,
            datasets: [{
                label: 'Volume (USD)',
                data: chartData.values,
                backgroundColor: 'rgba(78, 115, 223, 0.2)',
                borderColor: 'rgba(78, 115, 223, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            })}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            });
                        }
                    }
                }
            }
        }
    });
}

function createTechnicalIndicatorsChart(containerId, technicalData) {
    const ctx = document.getElementById(containerId).getContext('2d');
    
    const data = {
        labels: ['Trend', 'RSI', 'MACD', 'Momentum'],
        datasets: [{
            data: [
                technicalData.trend * 100,
                technicalData.rsi,
                technicalData.macd * 100,
                technicalData.momentum * 100
            ],
            backgroundColor: [
                'rgba(78, 115, 223, 0.5)',
                'rgba(54, 185, 204, 0.5)',
                'rgba(246, 194, 62, 0.5)',
                'rgba(231, 74, 59, 0.5)'
            ],
            borderColor: [
                'rgb(78, 115, 223)',
                'rgb(54, 185, 204)',
                'rgb(246, 194, 62)',
                'rgb(231, 74, 59)'
            ],
            borderWidth: 1
        }]
    };

    return new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateCharts(recommendations) {
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = ''; // Clear existing charts
    
    // Add market overview section
    if (recommendations.market_overview) {
        const overviewContainer = document.createElement('div');
        overviewContainer.className = 'card shadow mb-4';
        overviewContainer.innerHTML = `
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Market Overview</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Market Cap</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                                            $${(recommendations.market_overview.total_market_cap / 1e9).toFixed(2)}B
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            24h Volume</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                                            $${(recommendations.market_overview.total_volume / 1e9).toFixed(2)}B
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-chart-line fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-info shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Market Sentiment</div>
                                        <div class="row no-gutters align-items-center">
                                            <div class="col-auto">
                                                <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">
                                                    ${(recommendations.market_overview.market_sentiment * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                            <div class="col">
                                                <div class="progress progress-sm mr-2">
                                                    <div class="progress-bar bg-info" role="progressbar"
                                                        style="width: ${recommendations.market_overview.market_sentiment * 100}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Gainers</div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                                            ${recommendations.market_overview.gainers_percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-percent fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <h6 class="font-weight-bold">Market Dominance</h6>
                        <div class="progress" style="height: 25px;">
                            ${Object.entries(recommendations.market_overview.market_dominance)
                                .map(([symbol, percentage], index) => `
                                    <div class="progress-bar ${getProgressBarColor(index)}" 
                                         role="progressbar" 
                                         style="width: ${percentage}%"
                                         title="${symbol}: ${percentage}%">
                                        ${percentage > 5 ? `${symbol} ${percentage}%` : ''}
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        chartContainer.appendChild(overviewContainer);
    }
    
    // Add coin charts
    recommendations.chart_data.forEach((coinData, index) => {
        const coinContainer = document.createElement('div');
        coinContainer.className = 'coin-chart-container mb-4';
        coinContainer.innerHTML = `
            <div class="card shadow">
                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                    <h6 class="m-0 font-weight-bold text-primary">${coinData.coin_name} (${coinData.symbol})</h6>
                    <div class="trend-badge ${getTrendBadgeClass(coinData.trend_analysis.direction)}">
                        ${formatTrendDirection(coinData.trend_analysis.direction)}
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-8">
                            <div class="chart-container" style="height: 300px;">
                                <canvas id="priceChart${index}"></canvas>
                            </div>
                            <div class="chart-container mt-3" style="height: 150px;">
                                <canvas id="volumeChart${index}"></canvas>
                            </div>
                        </div>
                        <div class="col-lg-4">
                            <div class="mb-4" style="height: 200px;">
                                <canvas id="technicalChart${index}"></canvas>
                            </div>
                            <div class="trend-metrics">
                                <h6 class="font-weight-bold">Technical Analysis</h6>
                                <ul class="list-unstyled">
                                    ${Object.entries(coinData.trend_analysis.metrics).map(([key, value]) => `
                                        <li class="mb-2 d-flex justify-content-between align-items-center">
                                            <span class="metric-label">${formatMetricLabel(key)}</span>
                                            <span class="metric-value ${getMetricValueClass(key, value)}">
                                                ${formatMetricValue(key, value)}
                                            </span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        chartContainer.appendChild(coinContainer);
        
        // Create charts
        createPriceChart(`priceChart${index}`, coinData.price_data, coinData.technical_analysis);
        createVolumeChart(`volumeChart${index}`, coinData.volume_data);
        createTechnicalIndicatorsChart(`technicalChart${index}`, coinData.technical_analysis.indicators);
    });
}

function getTrendBadgeClass(direction) {
    const classes = {
        'strong_upward': 'badge-success',
        'moderate_upward': 'badge-info',
        'sideways': 'badge-warning',
        'moderate_downward': 'badge-danger',
        'strong_downward': 'badge-danger'
    };
    return `badge ${classes[direction] || 'badge-secondary'}`;
}

function getProgressBarColor(index) {
    const colors = [
        'bg-primary',
        'bg-success',
        'bg-info',
        'bg-warning',
        'bg-danger'
    ];
    return colors[index % colors.length];
}

function getMetricValueClass(key, value) {
    if (key.includes('change') || key.includes('momentum')) {
        return value > 0 ? 'text-success' : value < 0 ? 'text-danger' : '';
    }
    if (key.includes('strength') || key.includes('score')) {
        return value > 0.7 ? 'text-success' : value < 0.3 ? 'text-danger' : 'text-warning';
    }
    return '';
}

function formatTrendDirection(direction) {
    return direction.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatMetricLabel(key) {
    return key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatMetricValue(key, value) {
    if (key.includes('percentage') || key.includes('ratio') || key.includes('strength')) {
        return `${(value * 100).toFixed(1)}%`;
    }
    if (typeof value === 'number') {
        return value.toFixed(2);
    }
    return value;
}
