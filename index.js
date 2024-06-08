import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto("https://www.google.com/search?sca_esv=925f3ab5eecafe1d&sca_upv=1&cs=1&output=search&kgmid=/g/11fhqqvxlj&q=Rocket+Education+of+Science+%26+Technology&kgs=5d9d56afb785396b&shndl=30&shem=lsp,ssic&source=sh/x/kp/local/m1/1#lrd=0x390d1bcb32d0a95b:0xe370ba82d424c0d4,1,,,,", {
        waitUntil: "networkidle2",
    });

    const delay = 3000;
    let preCount = 0;
    let postCount = 0;
    do {
        preCount = await getCount(page);
        await scrollDown2(page);
        await waitFor(delay);
        postCount = await getCount(page);
    } while (postCount > preCount);
    await waitFor(delay);

    await page.evaluate(() => {
        const REVIEWS = [];
        const reviews = document.querySelectorAll('.gws-localreviews__general-reviews-block');

        reviews.forEach((reviewList) => {
            reviewList.childNodes.forEach((review) => {
                const nameClass = review.childNodes[1].firstChild.firstChild.className;
                const reviewClass = review.childNodes[1].lastChild.firstChild.firstChild.lastChild.className;

                let name = review.querySelector(`.${nameClass}`).textContent;

                let reviewText = review.querySelector('.review-full-text')

                if (reviewText) {
                    reviewText = reviewText.innerHTML;
                } else if (review.querySelector(`.${reviewClass}`)) {
                    reviewText = review.querySelector(`.${reviewClass}`).textContent;
                } else {
                    reviewText = 'No review text found.'
                }
                REVIEWS.push({ name, reviewText });
            })
        })
        const jsonStr = JSON.stringify(REVIEWS, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'reviews.json';

        a.click();

        return REVIEWS;
    })
    await waitFor(delay * 2)

    await browser.close();
})();

async function getCount(page) {
    return await page.$$eval(".gws-localreviews__general-reviews-block", (a) => a.length);
}

async function scrollDown2(page) {
    await page.evaluate(() => {
        const modal = document.querySelector('.review-dialog-list');
        if (modal) {
            modal.scrollBy(0, modal.scrollHeight);
        }
    });
}

const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

