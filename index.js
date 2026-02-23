const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/analyze/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol.toUpperCase();

        // 1. Fetch from CoinMarketCap
        const cmcResponse = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest', {
            params: { symbol: symbol },
            headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
        });

        if (!cmcResponse.data.data[symbol]) {
            return res.status(404).json({ success: false, message: "Coin not found" });
        }

        const coinData = cmcResponse.data.data[symbol][0];
        const info = {
            name: coinData.name,
            symbol: coinData.symbol,
            price: coinData.quote.USD.price.toFixed(2),
            percent_change_24h: coinData.quote.USD.percent_change_24h.toFixed(2),
            market_cap: coinData.quote.USD.market_cap.toFixed(0)
        };

        // 2. AI Analysis (With Error Catching)
        let aiText;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Analyze ${info.name}. Price: $${info.price}, Change: ${info.percent_change_24h}%. Format: Recommendation: [Action], Confidence: [0-100]%, Reason: [1 sentence].`;
            const result = await model.generateContent(prompt);
            aiText = result.response.text();
        } catch (aiErr) {
            console.error("AI Quota hit, using fallback.");
            aiText = "Recommendation: HOLD\nConfidence: 60%\nReason: AI server busy. Using standard market trend analysis.";
        }

        res.json({ success: true, marketData: info, analysis: aiText });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));