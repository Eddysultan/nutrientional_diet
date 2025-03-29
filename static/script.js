document.addEventListener('DOMContentLoaded', function() {
    const themeSwitch = document.getElementById('theme-switch');
    themeSwitch.addEventListener('change', function() {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
    });


    const predictBtn = document.getElementById('predict-btn');
    const resultsSection = document.getElementById('results-section');
    const loader = document.getElementById('loader');
    const resultsContent = document.getElementById('results-content');
    const scoreValue = document.getElementById('score-value');
    const scoreBadge = document.getElementById('score-badge');
    const categoryText = document.getElementById('category-text');
    const scoreMessage = document.getElementById('score-message');
    const riskMessage = document.getElementById('risk-message');
    const feedbackCards = document.getElementById('feedback-cards');
    
    let nutrientsChart = null;
    
    resultsSection.classList.add('hidden');
    
    predictBtn.addEventListener('click', function() {
        resultsSection.classList.remove('hidden');
        loader.classList.remove('hidden');
        resultsContent.classList.add('hidden');

        const userData = {
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            weight: parseFloat(document.getElementById('weight').value),
            height: parseFloat(document.getElementById('height').value),
            activity: document.getElementById('activity').value,
            sleep: parseInt(document.getElementById('sleep').value),
            smoking: document.getElementById('smoking').value,
            alcohol: document.getElementById('alcohol').value,
            calories: parseInt(document.getElementById('calories').value),
            meals: parseInt(document.getElementById('meals').value),
            protein: parseInt(document.getElementById('protein').value),
            carbs: parseInt(document.getElementById('carbs').value),
            fat: parseInt(document.getElementById('fat').value),
            disease: document.getElementById('disease').value,
            bp: document.getElementById('bp').value,
            cholesterol: document.getElementById('cholesterol').value
        };
        
        userData.bmi = (userData.weight / Math.pow(userData.height/100, 2)).toFixed(1);
        
        console.log('User data:', userData);
        
        setTimeout(() => {
            processResults(userData);
        }, 1500);
    });
    
    function processResults(userData) {
        loader.classList.add('hidden');
        resultsContent.classList.remove('hidden');
        let score = calculateScore(userData);
        scoreValue.textContent = score;
        updateScoreCategory(score);
        generatePersonalizedMessage(userData, score);
        checkHealthRisks(userData);
        createNutrientChart(userData);
        
        generateFeedbackCards(userData);
    }
    
    function calculateScore(userData) {
        let score = 70;
        
        if (userData.activity === 'High') score += 10;
        if (userData.activity === 'Low') score -= 10;
        
        if (userData.sleep >= 7 && userData.sleep <= 9) score += 5;
        if (userData.sleep < 6 || userData.sleep > 10) score -= 5;
        
        if (userData.smoking === 'Yes') score -= 15;
        if (userData.smoking === 'Former') score -= 5;
        
        if (userData.alcohol === 'Regular') score -= 10;
        if (userData.alcohol === 'None') score += 5;
        
        if (userData.disease !== 'None') score -= 10;
        
        const bmi = parseFloat(userData.bmi);
        if (bmi >= 18.5 && bmi <= 24.9) score += 10;
        if (bmi >= 25 && bmi <= 29.9) score -= 5;
        if (bmi >= 30) score -= 15;
        if (bmi < 18.5) score -= 10;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    
    function updateScoreCategory(score) {
        let category, color;
        
        if (score >= 90) {
            category = "Excellent";
            color = "#4CAF50";
        } else if (score >= 75) {
            category = "Good";
            color = "#8BC34A"; 
        } else if (score >= 60) {
            category = "Average";
            color = "#FFC107"; 
        } else if (score >= 40) {
            category = "Below Average";
            color = "#FF9800"; 
        } else {
            category = "Poor";
            color = "#F44336";
        }
        
        categoryText.textContent = category;
        scoreBadge.style.backgroundColor = color;
    }
    
    function generatePersonalizedMessage(userData, score) {
        let message;
        
        if (score >= 80) {
            message = "Your nutrient profile looks excellent! Your lifestyle choices are supporting good nutritional health.";
        } else if (score >= 60) {
            message = "Your nutrient profile is good, but there's room for improvement in some areas.";
        } else if (score >= 40) {
            message = "Your nutrient profile needs attention. Consider making some lifestyle changes to improve your nutritional health.";
        } else {
            message = "Your nutrient profile indicates significant nutritional concerns. We recommend consulting with a healthcare professional.";
        }
        
        scoreMessage.textContent = message;
    }
    
    function checkHealthRisks(userData) {
        let risks = [];
        
        if (userData.disease !== 'None') {
            risks.push(`Your ${userData.disease.toLowerCase()} condition requires special nutritional attention.`);
        }
        
        if (userData.bp === 'High' || userData.cholesterol === 'High') {
            risks.push("Your cardiovascular indicators suggest you may need to monitor sodium and saturated fat intake.");
        }
        
        if (userData.smoking === 'Yes') {
            risks.push("Smoking can deplete certain nutrients. Consider increasing antioxidants like Vitamins C and E.");
        }
        
        if (userData.bmi >= 30) {
            risks.push("Your BMI indicates obesity, which may require specialized nutritional planning.");
        }
        
        if (risks.length > 0) {
            riskMessage.innerHTML = "<strong>Health Considerations:</strong><ul>" + 
                risks.map(risk => `<li>${risk}</li>`).join('') + "</ul>";
            riskMessage.classList.remove('hidden');
        } else {
            riskMessage.classList.add('hidden');
        }
    }
    
    function createNutrientChart(userData) {
        const nutrientLevels = predictNutrientLevels(userData);
        
        const chartData = {
            labels: Object.keys(nutrientLevels).map(key => key.replace('_', ' ')),
            datasets: [
                {
                    label: 'Predicted Level',
                    data: Object.values(nutrientLevels).map(n => n.predicted),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Recommended Level',
                    data: Object.values(nutrientLevels).map(n => n.recommended),
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        };
        
        const ctx = document.getElementById('nutrients-chart').getContext('2d');
        
        if (nutrientsChart) {
            nutrientsChart.destroy();
        }
        

        nutrientsChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (% of RDI)'
                        }
                    }
                }
            }
        });
    }
    
    function predictNutrientLevels(userData) {

        let baseMultiplier = 1.0;
        
        if (userData.gender === 'Male') {
            baseMultiplier *= 1.1;
        } else {
            baseMultiplier *= 0.9;
        }
        
        if (userData.activity === 'High') {
            baseMultiplier *= 1.2;
        } else if (userData.activity === 'Low') {
            baseMultiplier *= 0.8;
        }
        
        const proteinRatio = userData.protein / userData.calories * 1000;
        const fatRatio = userData.fat / userData.calories * 1000;
        const carbRatio = userData.carbs / userData.calories * 1000;
        
        return {
            'Vitamin A': {
                predicted: Math.round(80 * baseMultiplier * (1 + (fatRatio - 30) / 100)),
                recommended: 100
            },
            'Vitamin C': {
                predicted: Math.round(70 * baseMultiplier * (1 - (userData.smoking === 'Yes' ? 0.3 : 0))),
                recommended: 100
            },
            'Vitamin D': {
                predicted: Math.round(60 * baseMultiplier),
                recommended: 100
            },
            'Calcium': {
                predicted: Math.round(75 * baseMultiplier * (userData.gender === 'Female' ? 0.9 : 1.1)),
                recommended: 100
            },
            'Iron': {
                predicted: Math.round(85 * baseMultiplier * (userData.gender === 'Female' ? 0.8 : 1.2)),
                recommended: 100
            },
            'Magnesium': {
                predicted: Math.round(65 * baseMultiplier * (1 + (proteinRatio - 35) / 100)),
                recommended: 100
            },
            'Zinc': {
                predicted: Math.round(70 * baseMultiplier),
                recommended: 100
            }
        };
    }
    
    function generateFeedbackCards(userData) {
        feedbackCards.innerHTML = '';
        
        const nutrientLevels = predictNutrientLevels(userData);
        
        for (const [nutrient, data] of Object.entries(nutrientLevels)) {
            if (data.predicted >= 85 && data.predicted <= 115) continue;
            
            const card = document.createElement('div');
            card.className = 'feedback-card';
            
            let status, icon, message, tips;
            
            if (data.predicted < 70) {
                status = 'deficient';
                icon = 'fa-exclamation-triangle';
                message = `Your ${nutrient} levels are predicted to be low.`;
                tips = getNutrientTips(nutrient, 'low');
            } else if (data.predicted < 85) {
                status = 'marginal';
                icon = 'fa-info-circle';
                message = `Your ${nutrient} levels may be slightly below optimal.`;
                tips = getNutrientTips(nutrient, 'low');
            } else if (data.predicted > 115) {
                status = 'excess';
                icon = 'fa-exclamation-circle';
                message = `Your ${nutrient} levels may be higher than recommended.`;
                tips = getNutrientTips(nutrient, 'high');
            }
            
            card.innerHTML = `
                <div class="feedback-icon ${status}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="feedback-content">
                    <h4>${nutrient}</h4>
                    <p>${message}</p>
                    <div class="nutrient-tips">
                        <h5>Recommendations:</h5>
                        <ul>
                            ${tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            
            feedbackCards.appendChild(card);
        }
        
        if (feedbackCards.children.length === 0) {
            const card = document.createElement('div');
            card.className = 'feedback-card positive';
            card.innerHTML = `
                <div class="feedback-icon optimal">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="feedback-content">
                    <h4>Excellent Nutrient Balance</h4>
                    <p>Based on your inputs, your predicted nutrient levels are well-balanced. Keep up your healthy lifestyle!</p>
                    <div class="nutrient-tips">
                        <h5>Continue with:</h5>
                        <ul>
                            <li>Regular exercise and physical activity</li>
                            <li>Balanced diet with variety of foods</li>
                            <li>Adequate hydration throughout the day</li>
                            <li>Regular health check-ups</li>
                        </ul>
                    </div>
                </div>
            `;
            feedbackCards.appendChild(card);
        }
    }
    
    function getNutrientTips(nutrient, level) {
        const tips = {
            'Vitamin A': {
                'low': [
                    'Include more orange and yellow vegetables like carrots and sweet potatoes',
                    'Add dark leafy greens like spinach and kale to your diet',
                    'Consider eating liver or fish oil occasionally'
                ],
                'high': [
                    'Avoid excessive supplementation of Vitamin A',
                    'Limit consumption of liver and fish oils',
                    'Consult with a healthcare provider about your intake'
                ]
            },
            'Vitamin C': {
                'low': [
                    'Increase citrus fruits like oranges and grapefruits',
                    'Add bell peppers and strawberries to your meals',
                    'Consider kiwi fruit and broccoli for Vitamin C sources'
                ],
                'high': [
                    'Reduce supplementation if taking Vitamin C supplements',
                    'Excessive Vitamin C is usually excreted, but may cause digestive issues'
                ]
            },
            'Vitamin D': {
                'low': [
                    'Get moderate sun exposure (15-30 minutes several times a week)',
                    'Include fatty fish like salmon and mackerel in your diet',
                    'Consider fortified foods like milk, orange juice, or cereals'
                ],
                'high': [
                    'Reduce supplementation if taking high doses',
                    'Avoid multiple supplements containing Vitamin D',
                    'Consult with a healthcare provider about your levels'
                ]
            },
            'Calcium': {
                'low': [
                    'Include more dairy products like milk, yogurt, and cheese',
                    'Try calcium-rich non-dairy foods like fortified plant milks and tofu',
                    'Add leafy greens like kale and bok choy to your diet'
                ],
                'high': [
                    'Avoid excessive calcium supplementation',
                    'If taking antacids containing calcium, consider alternatives',
                    'Drink plenty of water to prevent kidney stone formation'
                ]
            },
            'Iron': {
                'low': [
                    'Include lean red meat in your diet',
                    'Add plant-based iron sources like beans, lentils, and spinach',
                    'Consume iron with Vitamin C to improve absorption'
                ],
                'high': [
                    'Avoid cooking in cast iron cookware if levels are high',
                    'Reduce red meat consumption',
                    'Consult with a healthcare provider about potential causes'
                ]
            },
            'Magnesium': {
                'low': [
                    'Include more nuts and seeds in your diet',
                    'Add whole grains like brown rice and whole wheat',
                    'Consider leafy greens and legumes for more magnesium'
                ],
                'high': [
                    'Review medications and supplements that may contain magnesium',
                    'High levels are rare from diet alone but can occur with supplements'
                ]
            },
            'Zinc': {
                'low': [
                    'Include more oysters, red meat, and poultry',
                    'Add beans, nuts, and whole grains to your diet',
                    'Consider pumpkin seeds as a good plant-based source'
                ],
                'high': [
                    'Avoid excessive supplementation',
                    'Review any zinc lozenges or cold remedies you may be taking',
                    'Be aware that high zinc can interfere with copper absorption'
                ]
            }
        };
        
        return tips[nutrient]?.[level] || ['Consult with a nutritionist for personalized advice'];
    }
});