const puppeteer = require('puppeteer')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const app = express();
const PORT = 5500;

app.use(bodyParser.json());
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    try {
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null
        });
        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: 'networkidle2'
        })

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

        const reviews = await page.evaluate(() => {
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
            });
            return REVIEWS;
        });
        await browser.close();
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred. Please try again later.');
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

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

