function calculateFare() {
    const basePrice = parseFloat(document.getElementById('destination').value);
    const multiplier = parseFloat(document.getElementById('carType').value);
    const total = basePrice * multiplier;
    
    if(total > 0) {
        document.getElementById('resultText').innerText = "Estimated Fare: ₹" + total.toLocaleString('en-IN');
    } else {
        alert("Please select a destination!");
    }
}

function estimateFarmProfit() {
    const profitPerAcre = parseFloat(document.getElementById('cropType').value);
    const bigha = parseFloat(document.getElementById('areaSize').value);
    
    if(profitPerAcre > 0 && bigha > 0) {
        // Calculation: 1.6 Bigha = 1 Acre approx.
        const acreage = bigha / 1.6;
        const totalProfit = Math.round(profitPerAcre * acreage);
        document.getElementById('farmResult').innerText = "Potential Profit: ₹" + totalProfit.toLocaleString('en-IN');
    } else {
        alert("Please enter valid bigha and select a crop!");
    }
}

console.log("Kashi Ventures Dashboard Ready.");