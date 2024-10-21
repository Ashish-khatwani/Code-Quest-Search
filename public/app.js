// DOM elements
const searchButton = document.getElementById('searchButton');
const clearButton = document.getElementById('clearButton');
const toggleFiltersButton = document.getElementById('toggleFilters');
const resultsContainer = document.getElementById('results');
const emailInput = document.getElementById('emailInput');
const sendEmailButton = document.getElementById('sendEmailButton');
const filterSortSection = document.getElementById('filterSortSection');

// Memory cache for search results
const cache = {};

// Function to handle search
searchButton.addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value;
    const sourceFilter = document.getElementById('sourceFilter').value;
    const minUpvotes = document.getElementById('minUpvotes').value || 0;
    const minComments = document.getElementById('minComments').value || 0;
    const sortCriteria = document.getElementById('sortCriteria').value;

    if (!query) {
        alert('Please enter a search query.');
        return;
    }

    // Check if results are already cached


    const cacheKey = `${query}|${sourceFilter}|${minUpvotes}|${minComments}|${sortCriteria}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < 3600000)) { // 1 hour
        console.log('Serving from cache:', cacheKey);
        return res.json(cache[cacheKey].data);
    }

    
    if (cache[cacheKey]) {
        console.log('Using cached results for:', cacheKey);
        displayResults(cache[cacheKey]);
        return;
    }

    try {
        // Fetching results from Stack Overflow
        let stackOverflowResults = [];
        if (sourceFilter === 'all' || sourceFilter === 'stackoverflow') {
            const stackResponse = await fetch(`/api/stackoverflow?q=${query}`);
            stackOverflowResults = await stackResponse.json();
        }

        // Fetching results from Reddit
        let redditResults = [];
        if (sourceFilter === 'all' || sourceFilter === 'reddit') {
            const redditResponse = await fetch(`/api/reddit?q=${query}`);
            redditResults = await redditResponse.json();
        }

        // Combine results
        let results = [...stackOverflowResults, ...redditResults];

        // Filter results based on upvotes and comments
        results = results.filter(result => {
            return (result.ups || 0) >= minUpvotes && (result.num_comments || 0) >= minComments;
        });

        // Sort results based on selected criteria
        if (sortCriteria === 'date') {
            results.sort((a, b) => (b.created || 0) - (a.created || 0));
        } else if (sortCriteria === 'upvotes') {
            results.sort((a, b) => (b.ups || 0) - (a.ups || 0));
        } else if (sortCriteria === 'comments') {
            results.sort((a, b) => (b.num_comments || 0) - (a.num_comments || 0));
        }

        // Cache the results
        cache[cacheKey] = results;

        // Display results
        displayResults(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        alert('An error occurred while fetching results. Please try again.');
    }
});

// Function to display results
function displayResults(results) {
    resultsContainer.innerHTML = ''; // Clear previous results
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="placeholder-text">No results found.</p>';
        return;
    }

    results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.classList.add('result-item');

        const title = result.title || 'No Title';
        const url = result.link || result.url || ''; // URL for Stack Overflow or Reddit
        const summary = result.summary || result.selftext || ''; // Summary for Reddit or additional data for Stack Overflow
        const topAnswers = result.top_answers || []; // Top answers from Stack Overflow

        // Building result display
        resultElement.innerHTML = `
            <h3><a href="${url}" target="_blank">${title}</a></h3>
            <p>${summary}</p>
        `;

        // Add Top Answers section if available
        if (topAnswers.length > 0) {
            resultElement.innerHTML += `<p><strong>Top Answers:</strong></p>
                <ul>
                    ${topAnswers.slice(0, 3).map(answer => `<li>${answer}</li>`).join('')}
                </ul>`;
        }

        // Append upvotes and comments info
        resultElement.innerHTML += `
            <p><strong>Upvotes:</strong> ${result.ups || 0} | <strong>Comments:</strong> ${result.num_comments || 0}</p>
        `;

        resultsContainer.appendChild(resultElement);
    });

    // Show the email section
    document.getElementById('emailSection').style.display = 'block';
}

// Clear button functionality
clearButton.addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    resultsContainer.innerHTML = '<p class="placeholder-text">Search results will appear here...</p>';
    document.getElementById('emailSection').style.display = 'none';
    document.getElementById('sourceFilter').value = 'all';
    document.getElementById('minUpvotes').value = '';
    document.getElementById('minComments').value = '';
    document.getElementById('sortCriteria').value = 'relevance';
});

// Toggle filters visibility
toggleFiltersButton.addEventListener('click', () => {
    if (filterSortSection.style.display === 'none') {
        filterSortSection.style.display = 'block';
        toggleFiltersButton.textContent = 'Hide Advanced Options';
    } else {
        filterSortSection.style.display = 'none';
        toggleFiltersButton.textContent = 'Advanced Options';
    }
});

// Send Email functionality
sendEmailButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const results = Array.from(resultsContainer.children).map(item => {
        const upvotesMatch = item.querySelector('p:nth-child(3)').textContent.match(/Upvotes:\s*(\d+)/);
        const commentsMatch = item.querySelector('p:nth-child(3)').textContent.match(/Comments:\s*(\d+)/);

        return {
            title: item.querySelector('h3').textContent,
            url: item.querySelector('a').href,
            ups: upvotesMatch ? parseInt(upvotesMatch[1]) : 0,  // Default to 0 if no match
            num_comments: commentsMatch ? parseInt(commentsMatch[1]) : 0,  // Default to 0 if no match
        };
    });

    if (!email) {
        alert('Please enter your email address.');
        return;
    }

    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, results })
        });

        if (response.ok) {
            alert('Results sent to your email successfully!');
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        alert('Error sending email. Please try again later.');
        console.error('Error:', error);
    }
});
