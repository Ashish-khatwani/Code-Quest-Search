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

// Endpoint to fetch results from Stack Overflow
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

// Endpoint to fetch results from Reddit
app.get('/api/reddit', async (req, res) => {
    const query = req.query.q;
    try {
        const response = await axios.get('https://www.reddit.com/search.json', {
            params: { q: query }
        });
        const results = response.data.data.children.map((post) => ({
            title: post.data.title,
            url: `https://www.reddit.com${post.data.permalink}`,
            ups: post.data.ups,
            num_comments: post.data.num_comments,
            created: post.data.created_utc
        }));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching from Reddit' });
    }
});

// Endpoint to send email with search results
app.post('/api/send-email', async (req, res) => {
    const { email, results } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const resultsHtml = results.map(result => `
        <div style="margin-bottom: 20px;">
            <h3>${result.title}</h3>
            <p><strong>Link:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
            <p><strong>Upvotes:</strong> ${result.ups || 0} | <strong>Comments:</strong> ${result.num_comments || 0}</p>
        </div>
    `).join('');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Code Quest Search Results',
        html: `
            <h2>Your Search Results</h2>
            <div>${resultsHtml}</div>
            <p>Thank you for using Code Quest!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
