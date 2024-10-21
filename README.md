# Code Quest: Knowledge Base Application

## Overview

**Code Quest** is a web-based application that allows users to search for programming-related questions and answers across multiple platforms like Stack Overflow and Reddit. Users can filter, sort, and optionally translate the search results using the Google Translate API. It also features memory caching for faster retrieval of frequently accessed search results.

## Features

- **Search Integration**: Retrieve search results from Stack Overflow and Reddit.
- **Advanced Filters**: Filter results based on minimum upvotes, comments, and preferred sources.
- **Sorting**: Sort search results by relevance, date, upvotes, or number of comments.
- **Memory Caching**: Store frequently accessed search results in memory for faster retrieval.
- **Email Functionality**: Send search results to an email address for easy access.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js (Express.js)
- **API Integration**: custom API endpoints for fetching data from Stack Overflow and Reddit.

## Installation

Follow these steps to set up the project locally:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Ashish-khatwani/Code-Quest-Search.git
   cd code-quest

2. **Install the dependencies:**

   ```bash
    npm install

3. **Start the server:**

   ```bash
   node server.js

4 **Open the application in your browser:**

  Go to http://localhost:3000.


Usage

Search for Questions:

Enter a search query in the input box and click the "Search" button.
Results will be fetched from Stack Overflow and Reddit based on the selected source filters.


Filter and Sort Results:

Use the filters to set minimum upvotes or comments.
Select sorting criteria such as "Date", "Upvotes", or "Comments".


Email Search Results:

Enter your email address and click "Send Email" to receive the search results in your inbox.


Clear Results:

Use the "Clear" button to reset the search and filters.


API Endpoints:

GET /api/stackoverflow?q=<query>: Fetches search results from Stack Overflow based on the provided query.
GET /api/reddit?q=<query>: Fetches search results from Reddit based on the provided query.
POST /api/send-email: Sends the search results to a specified email address.

Memory Caching
The app uses in-memory caching to store results of previous searches for faster access. When a user makes a search query, the app checks the cache for previously stored results before making new API calls. This reduces latency and improves performance for repeated queries.

Contributing
Contributions are welcome! Follow these steps to contribute:

Fork the repository.
Create a new branch: git checkout -b feature/your-feature.
Make your changes and commit them: git commit -m 'Add some feature'.
Push to the branch: git push origin feature/your-feature.
Open a pull request.

Acknowledgements

Stack Overflow for their API.
Reddit for their API.

Contact
For any questions or issues, please open an issue in this repository or reach out to 21it066@charusat.edu.in.
