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
    const domainInput = document.getElementById('domain-inp');
    console.log('getting input', domainInput)
    const domainInputValue = domainInput.value;
    const cookies = await chrome.cookies.getAll({
        domain: domainInputValue
    })

    console.log('getting cookies from ', domainInputValue);
    const blob = new Blob([JSON.stringify(cookies)], {
        type: "application/json",
        filename: `${domainInputValue}-cookies.json`
    });
    const url = URL.createObjectURL(blob);

    await chrome.downloads.download({
        url: url
    });
    console.log('downloaded file');
};

function mapCookies(cookiesArray) {
    return cookiesArray.map((cookie) => ({
        domain: cookie.domain,
        key: cookie.key || cookie.name,
        value: cookie.value,
        path: cookie.path,
        url: `https://${cookie.domain}`
    }));
}
let parsedCookieArray = null;
document.getElementById('upload-cookies').onchange = async function(element) {
        console.log('uploading cookies', element.target.files[0]);
        const file = element.target.files[0];
        const reader = new FileReader();
        reader.onload = async function(event) {
            const cookies = JSON.parse(event.target.result);
            console.log('got parsed cookies', cookies)
            const cookieArray = 'cookies' in cookies ? cookies.cookies.cookies : cookies;
            parsedCookieArray = mapCookies(cookieArray);
            console.log('parsed cookies from file', parsedCookieArray);
        };
        reader.readAsText(file);
}

document.getElementById('paste-cookies').onchange = async function(element) {
    console.log('pasting cookies', element.target.value);
    const cookies = JSON.parse(element.target.value);
    console.log('got parsed cookies', cookies)
    const cookieArray = 'cookies' in cookies ? cookies.cookies.cookies : cookies;
    parsedCookieArray = mapCookies(cookieArray);
    console.log('parsed cookies from paste', parsedCookieArray);
}

document.getElementById('set-cookie-btn').onclick = async function(element) {
    if(!parsedCookieArray) {
        window.alert('Please upload a valid cookie file or paste the cookies in the textarea');
    }
    console.log('setting cookies', parsedCookieArray);
    // for(const cookie of cookieArray) {
    //     console.log('setting cookies', cookie.key);
    //     await chrome.cookies.set({
    //         domain: cookie.domain,
    //         value: cookie.value,
    //         name: cookie.key,
    //         path: cookie.path,
    //         url: `https://${cookie.domain}`,
    //     });
    // }
}

