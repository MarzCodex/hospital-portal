// Hash-based routing for bookmarking
function handleRouting() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        loadPage(hash);
    }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);