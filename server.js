const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const cache = {}; // This object will hold your cached search results


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const fetchStackOverflowAnswers = async (questionId) => {
    try {
        const response = await axios.get(`https://api.stackexchange.com/2.3/questions/${questionId}/answers`, {
            params: {
                order: 'desc',
                sort: 'votes',
                site: 'stackoverflow',
                filter: '!9_bDE(fI5'
            }
        });
        return response.data.items.map(answer => answer.body).slice(0, 3); // Get top 3 answers
    } catch (error) {
        console.error('Error fetching Stack Overflow answers:', error);
        return [];
    }
};

const fetchRedditTopComments = async (postId) => {
    try {
        const response = await axios.get(`https://www.reddit.com/comments/${postId}.json`);
        // Check if response data exists and has the second element
        if (response.data && response.data[1] && response.data[1].data && response.data[1].data.children) {
            const comments = response.data[1].data.children;
            return comments.slice(0, 3).map(comment => {
                const body = comment.data.body;
                // Truncate comment to the first 300 characters or less
                const truncatedBody = body.length > 300 ? body.slice(0, 300) + '...' : body;
                return truncatedBody; // Return truncated comment
            });
        } else {
            console.error('Unexpected Reddit API response structure:', response.data);
            return ['No comments available.'];
        }
    } catch (error) {
        console.error('Error fetching Reddit comments:', error);
        return ['Error fetching comments.'];
    }
};

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
        
        const results = await Promise.all(response.data.items.map(async item => {
            const topAnswers = await fetchStackOverflowAnswers(item.question_id);
            return {
                title: item.title,
                link: item.link,
                summary: item.body || 'No summary available.',
                ups: item.score, // Using score as upvotes
                num_comments: item.answer_count, // Using answer_count as comments
                top_answers: topAnswers
            };
        }));

        res.json(results);
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

        const results = await Promise.all(response.data.data.children.map(async (post) => {
            const postData = post.data;
            const topComments = await fetchRedditTopComments(postData.id);

            return {
                title: postData.title,
                link: `https://www.reddit.com${postData.permalink}`,
                summary: postData.selftext || 'No summary available.',
                ups: postData.ups,
                num_comments: postData.num_comments,
                top_answers: topComments
            };
        }));

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
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
