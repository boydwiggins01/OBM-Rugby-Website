# OBM Rugby website

Club website for Old Boys Marist RFC, Whangārei. It's a small static site, so it's free to host and fast to load. All the text, fixtures, news and sponsors live in the `content` folder and are edited through **Pages CMS**, an online editor with simple forms. Nobody needs to touch code to keep the site up to date.

## What's in the folder

| Path | What it is |
|---|---|
| `index.html` | The page shell (header, footer). Rarely changes. |
| `assets/style.css` | Colours, fonts and layout, using the club navy, green and gold. |
| `assets/app.js` | Draws each page from the content files. |
| `content/*.json` | **Everything editable**: news, draws and results, events, teams, sponsors, about, juniors, venue hire, gear and club settings. |
| `images/` | Crest and any photos or logos uploaded through the editor. |
| `.pages.yml` | Tells Pages CMS which forms to show. This is a hidden file (the name starts with a dot). Make sure it gets uploaded. |

## One-off setup (about 30 minutes)

### 1. Put the files on GitHub
1. Create a free account at github.com. A club account such as `obm-rugby` works well.
2. Click **New repository**, name it `obm-rugby-website`, and create it.
3. Click **uploading an existing file** and drag in everything from this folder.
   On a Mac, press Cmd + Shift + . in Finder to show hidden files so `.pages.yml` is included. If it's still missing, use **Add file → Create new file** in GitHub, name it `.pages.yml`, and paste in its contents.
4. Click **Commit changes**.

### 2. Publish it with Netlify (free)
1. Go to netlify.com and sign up with the GitHub account.
2. **Add new site → Import an existing project → GitHub**, then pick `obm-rugby-website`.
3. Leave the build command blank and set the publish directory to `/`. Click **Deploy**.
4. Under **Domain management**, add the club's domain (for example obmrugby.co.nz) and follow the DNS steps shown.
5. Under **Forms**, turn on form detection and add a notification email so contact-form messages reach the club inbox.

From here on, every change saved in the editor republishes the site automatically, usually within a minute.

### 3. Turn on the editor
1. Go to app.pagescms.org and sign in with GitHub.
2. When asked, install the Pages CMS app on the `obm-rugby-website` repository.
3. Open the repository. You'll see a menu with News posts, Draws & results, Club events, Teams & coaches, Sponsors, About the club, Junior club, Venue hire, Club gear and Club settings.

### 4. Give committee members access
In Pages CMS, open the repository's **Collaborators** settings and invite people by email. They get a sign-in link and can edit content without a GitHub account.

## Everyday updates

| Task | Where in the editor |
|---|---|
| Post club news | **News posts** → add an item. Include a headline, date, short summary, optional photo and the full story. |
| Add the weekly draw | **Draws & results** → add a row per game. Leave the scores blank. |
| Enter results | Open the game and fill in both scores. It moves to Results automatically, with a Won/Lost/Drew badge. |
| Change the banner or announcement | **Club settings**. Clear the announcement to hide the green bar. |
| Add a sponsor | **Sponsors** → add a name, level and logo. The logo should be a PNG with a white or transparent background. |
| Update coaches or training times | **Teams & coaches**. |
| Registration links | **Club settings** → senior and junior registration links (for example, your Rugby Xplorer registration pages). |

Tips:
- Use the same team name each time (for example "Premier") so the team filter on the Draws page stays tidy.
- Games and events drop off the "upcoming" lists automatically once their date has passed.
- Wide photos (about 1600 × 900 pixels) work best for news and the home banner.

## Before going live
The site ships with sample content, so replace all of it first: the club history, honours, committee names, club email and phone, clubrooms address, fixtures, sponsors and prices. The Facebook and Instagram links currently point to the generic sites and need the club's own page addresses.
