async function getFullURL(shortURL) {
    try {
        const response = await fetch(shortURL, {
            method: 'HEAD',
            redirect: 'follow'
        });
        if (response.ok) {
            console.log('Full URL:', response.url);
        } else {
            throw new Error('Failed to get full URL');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = getFullURL
// getFullURL('https://maps.app.goo.gl/G2NNF4ZtefuAMcQ88');
