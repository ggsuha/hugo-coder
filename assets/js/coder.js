const body = document.body;
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Check if user preference is set, if not check value of body class for light or dark else it means that colorscheme = auto
if (localStorage.getItem("colorscheme")) {
    setTheme(localStorage.getItem("colorscheme"));
} else if (body.classList.contains('colorscheme-light') || body.classList.contains('colorscheme-dark')) {
    setTheme(body.classList.contains("colorscheme-dark") ? "dark" : "light");
} else {
    setTheme(darkModeMediaQuery.matches ? "dark" : "light");
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        let theme = body.classList.contains("colorscheme-dark") ? "light" : "dark";
        setTheme(theme);
        rememberTheme(theme);
    });
}

darkModeMediaQuery.addListener((event) => {
    setTheme(event.matches ? "dark" : "light");
});

document.addEventListener("DOMContentLoaded", function () {
    let node = document.querySelector('.preload-transitions');
    node.classList.remove('preload-transitions');
    initProjectsPagination();
});

function setTheme(theme) {
    // Disable CSS transitions briefly so theme changes feel instant.
    body.classList.add('theme-switching');
    body.classList.remove('colorscheme-auto');
    let inverse = theme === 'dark' ? 'light' : 'dark';
    body.classList.remove('colorscheme-' + inverse);
    body.classList.add('colorscheme-' + theme);
    document.documentElement.style['color-scheme'] = theme;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            body.classList.remove('theme-switching');
        });
    });

    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
    
            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    if (theme === 'dark') {
        const message = {
            type: 'set-theme',
            theme: 'github-dark'
        };
        waitForElm('.utterances-frame').then((iframe) => {
            iframe.contentWindow.postMessage(message, 'https://utteranc.es');
        })
        
    }
    else {
        const message = {
            type: 'set-theme',
            theme: 'github-light'
        };
        waitForElm('.utterances-frame').then((iframe) => {
            iframe.contentWindow.postMessage(message, 'https://utteranc.es');
        })
        
    }

    function sendMessage(message) {
        const iframe = document.querySelector('iframe.giscus-frame');
        if (!iframe) return;
        iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
      }
      sendMessage({
        setConfig: {
          theme: theme,
        },
      });
    
    // Create and send event
    const event = new Event('themeChanged');
    document.dispatchEvent(event);
}

function rememberTheme(theme) {
    localStorage.setItem('colorscheme', theme);
}

function initProjectsPagination() {
    const section = document.querySelector('[data-projects-pagination]');
    if (!section) return;

    const list = section.querySelector('.project[data-js-pagination="projects"]');
    const pagination = section.querySelector('.paginate-simple[data-js-pagination="projects"]');
    if (!list || !pagination) return;

    const items = Array.from(list.querySelectorAll('[data-project-item]'));
    if (items.length === 0) {
        pagination.hidden = true;
        return;
    }

    const prevButton = pagination.querySelector('[data-page-action="prev"]');
    const nextButton = pagination.querySelector('[data-page-action="next"]');
    const indicator = pagination.querySelector('[data-page-indicator]');
    if (!prevButton || !nextButton || !indicator) return;

    const mobilePerPage = parseInt(section.dataset.projectsMobilePerPage || '4', 10);
    const desktopPerPage = parseInt(section.dataset.projectsDesktopPerPage || '6', 10);
    const breakpoint = parseInt(section.dataset.projectsBreakpoint || '768', 10);
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    let perPage = getPerPage();
    let currentPage = 1;
    let totalPages = getTotalPages();

    function getPerPage() {
        return mediaQuery.matches ? mobilePerPage : desktopPerPage;
    }

    function getTotalPages() {
        return Math.max(1, Math.ceil(items.length / perPage));
    }

    function applyPage(pageNumber) {
        const start = (pageNumber - 1) * perPage;
        const end = start + perPage;

        items.forEach((item, index) => {
            item.hidden = !(index >= start && index < end);
        });
    }

    function renderPage() {
        applyPage(currentPage);

        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        indicator.textContent = `${currentPage} / ${totalPages}`;
        pagination.hidden = totalPages <= 1;
    }

    function updateListMinHeight() {
        // Keep pager position stable by reserving height equal to the tallest page.
        const previousPage = currentPage;
        let maxHeight = 0;

        for (let page = 1; page <= totalPages; page += 1) {
            applyPage(page);
            const pageHeight = Math.ceil(list.getBoundingClientRect().height);
            if (pageHeight > maxHeight) maxHeight = pageHeight;
        }

        list.style.minHeight = maxHeight > 0 ? `${maxHeight}px` : '';
        currentPage = previousPage;
    }

    function updatePerPageIfNeeded() {
        const nextPerPage = getPerPage();
        if (nextPerPage === perPage) return;

        const firstVisibleIndex = (currentPage - 1) * perPage;
        perPage = nextPerPage;
        totalPages = getTotalPages();
        currentPage = Math.floor(firstVisibleIndex / perPage) + 1;
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        updateListMinHeight();
        renderPage();
    }

    prevButton.addEventListener('click', () => {
        if (currentPage <= 1) return;
        currentPage -= 1;
        renderPage();
    });

    nextButton.addEventListener('click', () => {
        if (currentPage >= totalPages) return;
        currentPage += 1;
        renderPage();
    });

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', updatePerPageIfNeeded);
    } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(updatePerPageIfNeeded);
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            updatePerPageIfNeeded();
            updateListMinHeight();
            renderPage();
        }, 120);
    });

    updateListMinHeight();
    renderPage();
}
