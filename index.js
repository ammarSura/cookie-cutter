document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener('click', (event) => {
        const elId = button.id;
        const elDataTab = button.getAttribute("data-tab");

        document.querySelectorAll(".tab-button").forEach((el) => {
            if(el.id !== elId) {
                el.className = el.className.replace(" active-tab", "");
            }
        });
        const element = document.getElementById(elId);

        if(!element.className.includes("active-tab")) {
            element.className += " active-tab";
            document.querySelectorAll(".tab-content").forEach((el) => {
                if(el.getAttribute("data-tab") !== elDataTab) {
                    el.style.display = "none";
                }
            });
            const activeTabContent = document.querySelector(`.tab-content[data-tab='${elDataTab}']`);
            activeTabContent.style.display = "block";

        }
    });
});
// Open the default tab on page load
document.getElementById("upload-content").style.display = "block";

document.getElementById('get-cookie-btn').onclick = async function(element) {
    const currentTab = await getCurrentTab();

    const currentTabUrl = new URL(currentTab.url)
    const { host } = currentTabUrl
    const cookies = await chrome.cookies.getAll({
        domain: host
    })

    let currentDate = new Date().toLocaleString()
    currentDate = currentDate.replace(/\//g, '-')
    currentDate = currentDate.replace(/\:/g, '_')
    currentDate = currentDate.replace(', ', 'T')
    const filename = `${currentTabUrl.hostname}-cookies-${currentDate}.json`
    const blob = new Blob([JSON.stringify(cookies)], {
        type: "application/json",
        filename
    });
    const url = URL.createObjectURL(blob);

    console.log('Save as', filename)
    await chrome.downloads.download({
        url: url,
        filename,
        saveAs: true
    });
    console.log('downloaded file');
};

function mapCookies(cookiesArray, url) {
    return cookiesArray.map((cookie) => ({
        domain: cookie.domain,
        key: cookie.key || cookie.name,
        value: cookie.value,
        path: cookie.path,
        url
    }));
}
let parsedCookieArray = null;
document.getElementById('upload-cookies').onchange = async function(element) {
        console.log('uploading cookies', element.target.files[0]);
        const file = element.target.files[0];
        const reader = new FileReader();
        const currentTab = await getCurrentTab();
        reader.onload = async function(event) {
            const cookies = JSON.parse(event.target.result);
            console.log('got parsed cookies', cookies)
            const cookieArray = 'cookies' in cookies ? cookies.cookies.cookies : cookies;

            parsedCookieArray = mapCookies(cookieArray, currentTab.url);
            console.log('parsed cookies from file', parsedCookieArray);
        };
        reader.readAsText(file);
}

document.getElementById('paste-cookies').onchange = async function(element) {
    console.log('pasting cookies', element.target.value);
    const currentTab = await getCurrentTab()
    const cookies = JSON.parse(element.target.value);
    console.log('got parsed cookies', cookies)
    const cookieArray = 'cookies' in cookies ? cookies.cookies.cookies : cookies;
    parsedCookieArray = mapCookies(cookieArray, currentTab.url);
    console.log('parsed cookies from paste', parsedCookieArray);
}

document.getElementById('set-cookie-btn').onclick = async function(element) {
    const currentTab = await getCurrentTab();

    if(!parsedCookieArray) {
        window.alert('Please upload or past a valid cookie file or paste the cookies in the textarea');
        return
    }
    console.log('setting cookies', parsedCookieArray);
    const domainListEl = document.getElementById('set-cookies-domain')
    const domainSet = new Set();
    const domainContainerEl = document.getElementById('domain-list');
    const domainListTitleEl = document.createElement('h3', {
        id: 'domain-list-title'
    });
    domainListTitleEl.appendChild(document.createTextNode('Setting cookies for the following domains:'));
    domainContainerEl.prepend(domainListTitleEl)
    const domainListItemEls = []
    for(const cookie of parsedCookieArray) {
        await chrome.cookies.set({
            domain: cookie.domain,
            value: cookie.value,
            name: cookie.key || cookie.name,
            path: cookie.path,
            url: cookie.url,
        });
        if(!domainSet.has(cookie.domain)) {
            domainSet.add(cookie.domain);
            const domainListItemEl = document.createElement('li');
            domainListItemEls.push(domainListItemEl);
            domainListItemEl.appendChild(document.createTextNode(cookie.domain));
            domainListEl.appendChild(domainListItemEl);
        }
    }
    document.getElementById('paste-cookies').value = '';
    console.log('reloading tab', currentTab.id);
    chrome.tabs.reload(currentTab.id);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    domainListTitleEl.remove();
    domainListItemEls.forEach((el) => el.remove());
}

document.getElementById('clear-cookies-btn').onclick = async function(element) {
    console.log('clearing cookies');
    const currentTab = await getCurrentTab();
    const { url } = currentTab;
    const parsedUrl = new URL(url);
    const domain = parsedUrl.origin;
    window.confirm(`Are you sure you want to clear cookies for ${domain}?`);
    console.log('clearing cookies from', domain);
    await chrome.cookies.getAll({}, function(cookies) {
        for(const cookie of cookies) {
            chrome.cookies.remove({
                url: domain,
                name: cookie.name
            });
        }
    });

    chrome.tabs.reload(currentTab.id);
}

async function getCurrentTab() {
    const [currentTab] = await chrome.tabs.query({active: true, currentWindow: true});
    return currentTab;
}

