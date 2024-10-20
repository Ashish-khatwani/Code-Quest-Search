const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.get('/api/stackoverflow', async (req, res) => {
    const query = req.query.q;
    try {
        const response = await axios.get('https://api.stackexchange.com/2.3/search', {
            params: {
                order: 'desc',
                sort: 'relevance',
                intitle: query,
                site: 'stackoverflow'
            }
        });
        res.json(response.data.items);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching from Stack Overflow' });
    }
});

app.get('/api/reddit', async (req, res) => {
    const query = req.query.q;
    try {
        const response = await axios.get(`https://www.reddit.com/search.json`, {
            params: {
                q: query
            }
        });
        const results = response.data.data.children.map((post) => post.data);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching from Reddit' });
    }
});

app.post('/api/send-email', async (req, res) => {
    const { email, results } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Code Quest Search Results',
        text: JSON.stringify(results, null, 2)
    };

    try {
        await transporter.sendMail(mailOptions);
        alert('Sent mail successfully');
        res.json({ message: 'Email sent successfully' });
        console.log("success!");
    } catch (error) {
        alert('error: ' + error.message);
        console.log("failure!");
        console.log(error.message);
        res.status(500).json({ error: 'Error sending email' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
