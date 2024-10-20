document.getElementById('toggleFilters').addEventListener('click', () => {
    const filterSection = document.getElementById('filterSortSection');
    if (filterSection.style.display === 'none') {
        filterSection.style.display = 'flex';
    } else {
        filterSection.style.display = 'none';
    }
});

document.getElementById('searchButton').addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value.trim();
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<p class="placeholder-text">Loading...</p>';

    if (!query) {
        resultsContainer.innerHTML = '<p class="placeholder-text">Please enter a search query.</p>';
        document.getElementById('emailSection').style.display = 'none';
        return;
    }

    try {
        const [stackoverflowResults, redditResults] = await Promise.all([
            fetch(`/api/stackoverflow?q=${encodeURIComponent(query)}`).then(res => res.json()),
            fetch(`/api/reddit?q=${encodeURIComponent(query)}`).then(res => res.json())
        ]);

        let combinedResults = [...stackoverflowResults, ...redditResults];

        const sourceFilter = document.getElementById('sourceFilter').value;
        const minUpvotes = parseInt(document.getElementById('minUpvotes').value) || 0;
        const minComments = parseInt(document.getElementById('minComments').value) || 0;

        combinedResults = combinedResults.filter(result => {
            const upvotes = result.score || result.ups || 0;
            const comments = result.comment_count || result.num_comments || 0;

            const matchesSource = sourceFilter === 'all' ||
                (sourceFilter === 'stackoverflow' && result.link) ||
                (sourceFilter === 'reddit' && result.permalink);

            return matchesSource && upvotes >= minUpvotes && comments >= minComments;
        });

        const sortCriteria = document.getElementById('sortCriteria').value;
        combinedResults.sort((a, b) => {
            switch (sortCriteria) {
                case 'date':
                    return new Date(b.creation_date) - new Date(a.creation_date);
                case 'upvotes':
                    return (b.score || b.ups || 0) - (a.score || a.ups || 0);
                case 'comments':
                    return (b.comment_count || b.num_comments || 0) - (a.comment_count || a.num_comments || 0);
                default:
                    return 0;
            }
        });

        resultsContainer.innerHTML = '';

        if (combinedResults.length > 0) {
            combinedResults.forEach(result => {
                const item = document.createElement('div');
                item.classList.add('result-item');

                const source = result.link ? "Stack Overflow" : "Reddit";
                const viewLink = result.link || `https://reddit.com${result.permalink}`;
                const summary = result.body ? result.body.substring(0, 150) : result.selftext ? result.selftext.substring(0, 150) : 'No summary available';
                const upvotes = result.score || result.ups || 0;
                const comments = result.comment_count || result.num_comments || 0;

                item.innerHTML = `
                    <h3>${result.title}</h3>
                    <p>${summary}...</p>
                    <p><strong>Upvotes:</strong> ${upvotes} | <strong>Comments:</strong> ${comments}</p>
                    <a href="${viewLink}" target="_blank">
                        <span>View on ${source}</span>
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zm1 14H5V5h6V3H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6h-2v6z"/>
                        </svg>
                    </a>
                `;
                resultsContainer.appendChild(item);
            });

            document.getElementById('emailSection').style.display = 'flex';
        } else {
            resultsContainer.innerHTML = '<p class="placeholder-text">No results found. Try a different query.</p>';
            document.getElementById('emailSection').style.display = 'none';
        }

        window.searchResults = combinedResults.map(result => ({
            title: result.title,
            summary: result.body ? result.body.substring(0, 150) : result.selftext ? result.selftext.substring(0, 150) : 'No summary available',
            link: result.link || `https://reddit.com${result.permalink}`,
            source: result.link ? "Stack Overflow" : "Reddit",
            upvotes: result.score || result.ups || 0,
            comments: result.comment_count || result.num_comments || 0
        }));
    } catch (error) {
        resultsContainer.innerHTML = '<p class="placeholder-text">Error fetching results. Please try again later.</p>';
        document.getElementById('emailSection').style.display = 'none';
    }
});

document.getElementById('clearButton').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('sourceFilter').value = 'all';
    document.getElementById('minUpvotes').value = '';
    document.getElementById('minComments').value = '';
    document.getElementById('sortCriteria').value = 'relevance';
    document.getElementById('results').innerHTML = '<p class="placeholder-text">Search results will appear here...</p>';
    document.getElementById('emailSection').style.display = 'none';
    document.getElementById('filterSortSection').style.display = 'none';
});
