// QuantumPulse - Neural AI Predictor (Matematik Bashoratlash Modeli)

class PredictiveAI {
    constructor() {
        this.confidenceThreshold = 80; // Minimal ishonch foizi
    }

    /**
     * Mijozning xaridlar tarixi asosida keyingi xaridini bashorat qiladi
     * @param {Array} purchaseHistory - Xarid qilingan kunlar (masalan: [1-kun, 15-kun, 31-kun])
     * @param {number} currentDay - Tizimdagi bugungi kun
     * @returns {Object} - Bashorat natijasi va ishonch foizi
     */
    calculateNextPurchase(purchaseHistory, currentDay) {
        if (purchaseHistory.length < 3) {
            return { willBuySoon: false, confidence: 0 };
        }

        // 1. Xaridlar orasidagi oraliqlarni (intervallarni) topish
        let intervals = [];
        for (let i = 1; i < purchaseHistory.length; i++) {
            intervals.push(purchaseHistory[i] - purchaseHistory[i - 1]);
        }

        // 2. O'rtacha intervalni hisoblash (Linear approach)
        let totalInterval = intervals.reduce((sum, val) => sum + val, 0);
        let averageInterval = totalInterval / intervals.length;

        // 3. Standart og'ishni (Standard Deviation) hisoblash (Aniqlik uchun)
        let variance = intervals.reduce((sum, val) => sum + Math.pow(val - averageInterval, 2), 0) / intervals.length;
        let stdDeviation = Math.sqrt(variance);

        // 4. Bashorat qilish
        let lastPurchase = purchaseHistory[purchaseHistory.length - 1];
        let daysSinceLastPurchase = currentDay - lastPurchase;
        let expectedDaysLeft = averageInterval - daysSinceLastPurchase;

        // Ishonch foizini hisoblash (og'ish qancha kam bo'lsa, ishonch shuncha yuqori)
        let baseConfidence = 100 - (stdDeviation * 2);
        let confidence = Math.max(10, Math.min(99, baseConfidence));

        // Agar kutilayotgan kun 3 kundan kam qolgan bo'lsa, xavotir (Alert) berish
        let willBuySoon = expectedDaysLeft <= 3 && expectedDaysLeft >= -2;

        return {
            willBuySoon: willBuySoon,
            expectedDaysLeft: Math.round(expectedDaysLeft),
            confidence: Math.round(confidence)
        };
    }
}

// AI tizimini ishga tushirish va Dashboard-ga chiqarish
document.addEventListener('DOMContentLoaded', () => {
    const aiSystem = new PredictiveAI();
    
    // Tizimga kelib tushgan "simulyatsiya qilingan" ma'lumotlar bazasi
    const mockCustomers = [
        { name: "Alisher", history: [5, 25, 46, 65] }, // Har ~20 kunda oladi
        { name: "Sardor", history: [10, 40, 71] },     // Har ~30 kunda oladi
        { name: "Jasur", history: [2, 12, 23, 31, 41] }// Har ~10 kunda oladi
    ];
    
    const TODAY = 84; // Faraz qilaylik, tizim ishga tushganiga 84 kun bo'ldi
    
    let potentialBuyers = 0;
    let avgConfidence = 0;

    // AI har bir mijozni tahlil qiladi
    mockCustomers.forEach(customer => {
        let prediction = aiSystem.calculateNextPurchase(customer.history, TODAY);
        if (prediction.willBuySoon && prediction.confidence >= aiSystem.confidenceThreshold) {
            potentialBuyers++;
            avgConfidence += prediction.confidence;
        }
    });

    // Natijani UI (HTML) ga chiqarish
    const aiInsightElement = document.getElementById('ai-quick-insight');
    if (aiInsightElement) {
        if (potentialBuyers > 0) {
            avgConfidence = Math.round(avgConfidence / potentialBuyers);
            aiInsightElement.innerHTML = `Bashorat: <b>${potentialBuyers} ta mijoz</b> yaqin 3 kun ichida qayta xarid qiladi. (Ishonch: ${avgConfidence}%)`;
            aiInsightElement.style.color = '#00f2fe';
        } else {
            aiInsightElement.innerHTML = `Tahlil yakunlandi. Yaqin orada aktiv xarid kutilmayapti.`;
            aiInsightElement.style.color = '#64748b';
        }
    }
});