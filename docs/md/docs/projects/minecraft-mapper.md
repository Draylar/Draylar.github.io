# Minecraft Mapper

[Minecraft Mapper](https://github.com/Draylar/minecraft-mapper) is a project I made while attempting to learn JavaScript and NodeJS. 

![](https://camo.githubusercontent.com/3a03f1eaba7ea1454dc50a8bc902b89a6e42597f/68747470733a2f2f692e696d6775722e636f6d2f3856477077576d2e706e67)

The idea behind this project was simple: paste your game log or code mapped in [Intermediary](https://github.com/FabricMC/intermediary) to the text box, and it will spit back a mapped
log! This is helpful for developers trying to find the mapped version of intermediary code lines & clues users into what might be going wrong with their game.

```js
class_310 => MinecraftClient
```

The not-so-simple part of the project is the fact that it automatically downloads the latest mappings for *each game version*, allowing you to pick what version your log should be mapped to. 
This is done by checking the [Fabric meta API](https://meta.fabricmc.net/) for versions every 24 hours, then either keeping, updating, or installing each version depending on the version cached already. Versions are separated by a folder and have a file for information on the mappings (mainly used for build info to update if needed), plus the actual mappings file. I'm also rolling a simple custom parser for the .tiny mapping files yarn uses. 

This project can *also* be used to map mod jars when source isn't posted (don't worry, this is my code):

```java
DIAMOND(3, 1561 * VanillaHammers.CONFIG.durabilityModifier, 2.2857144F, 0.0F, 10, () -> {
    return class_1856.method_8091(new class_1935[]{class_1802.field_8477});
}),
```
Turns into...
```java
DIAMOND(3, 1561 * VanillaHammers.CONFIG.durabilityModifier, 2.2857144F, 0.0F, 10, () -> {
    return Ingredient.ofItems(new ItemConvertible[]{Items.DIAMOND});
}),
```


I started by watching a [Full Stack introduction video by The Coding Train & Coding Garden](https://www.youtube.com/watch?v=JnEH9tYLxLk), but transitioned over to relying on
stackoverflow and Mozilla JS docs once I got a feel for things. 

### Design Process

When I started with the project, I had a vision, but no idea on implementation. As time went on and I learned more about the structure of my soon-to-be project, I started to formulate a game plan and deeper structure for how the system would operate.

My initial plan was fairly straightforward: send the mappings to the server, have it replace certain phrases with their mapped equivalents, and then send it back to the client.

**First roadblock: how do we read mapping files?**

I had a .tiny mapping file in my project directory, and the basic C2S/S2C interactions setup, but I needed a way to *load* mappings into a basic file.

I started with a basic implementation: read the file, split it at the newline, and check if each line starts with a certain phrase (for classes/fields/methods). I would then save it in a map between intermediary & yarn mapped versions.

*Note: the following code blocks are curated snippets of the important code in pseudo-JS, not 1:1 to the project.*

```javascript
function loadData() {
    dir.readFiles(
        "mappings",
        function (err, context, next) {
            .../

            content.split("\n").forEach(element -> {
                // collect information from split lines
                var lines = element.trim().split(" "); // type / intermediary / yarn
                var type = [...]; // (either CLASS, METHOD, or FIELD)

                if(type == "CLASS") {
                    // save class
                } else if (type == "METHOD") {
                    // save method
                } else if (type == "FIELD") {
                    // save field
                }
            });
        },
        .../
    )
}
```

After getting a request from the user, I would use the power of regex to find phrases to replace, look for them in the mapping list, replace them, and send the log back to the user:

```javascript
const methodRegex = /(method_[1-9])\d{0,}/g;

app.post('submit', (req, res) => {
    var log = req.body.data;
    var methodMatches = log.match(methodRegex);

    // see if we hit any matches
    if(methodMatches !== null) {
        methodMatches.forEach(match => {
            var replacement = methods.get(match);

            // replace match in log with yarn mapping
            if(replacement !== undefined) {
                log = log.replace(match, replacement);
            }
        });
    }

    // respond with mapped log
    response.json({
        log: log
    });
});
```

**Second roadblock: how do we find and separate versions?**:

I needed to find a way to give the program mapping files once it had been ran outside my environment. I didn't feel right shipping the direct mapping files inside my project (even if yarn *is* CC0-1.0), and I would have to manually update the file every time new updates came out. I ended up attempting to use the [GitHub v3 API](https://developer.github.com/v3/) to download files directly from the yarn repository. I asked the branches endpoint (`https://api.github.com/repos/{org}/{project}/branches`) to gather a list of all game versions yarn supported (as yarn has a separate branch for each major game version).

```javascript
const githubBranchEndpoint = "https://api.github.com/repos/FabricMC/yarn/branches";
const mappingDirectory = "../mappings";

function updateMappings() {
    fetch(githubBranchEndpoint)
        .then(response => response.json())
        .then(versions => {
            versions.forEach(version => {
                var dir = mappingDirectory = "/" + version.name;
                var dirFile = dir + "/info.txt";

                if(!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                    fs.writeFile(dirFile, JSON.stringify(version), function(err) {
                        if(err) throw err;
                        console.log("Created info file for ", version.name);
                    });
                }
            });
        });
}
```

At this point, the system would create a folder for each version, but how would I actually get the mapping files? Turns out the GitHub API... doesn't really support downloading individual files like that, so I went to the Fabric Discord to ask for help. I was told about the [FabricMC meta API](https://meta.fabricmc.net/), which has an endpoint specifically for getting yarn versions. I was *also* made aware of the [FabricMC maven](http://maven.fabricmc.net/), which hosts all mapping files in jars, and I went, "*wait, why don't I just download from this directly?"*

**Third roadblock: downloading jars and extracting their contents.**

Retrieving versions from the FabricMC API was easy enough, but I also needed to download the files from the maven. 

My first concern while downloading was keeping it reasonable. I didn't want to do anything ridiculous like download *every* version (~110 as of the current date) jar, every day, to keep up with updates & new versions. I eventually noticed something in each version block in the FabricMC API `versions` endpoint:

```json
  {
    "gameVersion": "19w02a",
    "separator": ".",
/*!*/    "build": 28,
    "maven": "net.fabricmc:yarn:19w02a.28",
    "version": "19w02a.28",
    "stable": true
  }
  ```

Hey, I can just keep track of the cached jar build version, and *only* update it if the one on the endpoint is new!

My system ended up using a simple queue to slow down my downloads. I would check each version, see if it needed updating or installation, and then put it into a download queue.
Once I finished checking all versions, I would download each jar 10 seconds apart, extract the contents, pull out the mappings file, and delete the extra junk. The data loader would run, parse information from all version mapping files, and everything would be good to go!

```javascript
function queueDownloads(toDownload) {
    setTimeout(function () {
        if (toDownload.length !== 0) {
            var downloadInfo = toDownload.pop();
            console.log("Starting download for", JSON.stringify(downloadInfo));
            downloadJar(downloadInfo);

            // queue next download if needed
            if (toDownload.length !== 0) {
                queueDownloads(toDownload);
            }
        } else {
            console.log("Finished downloading all yarn jars.");
        }
    }, 1000 * 10);
}
```

The actual unzipping of the file was painful and long, mostly because I still didn't know the full difference between `async` and `sync (more on that later). This was the hardest part of the project and is what made up most of my development time. 

**Fourth & final roadblock: wait, this code is ugly.**

There comes a moment in every project where you realize everything you've written is bad and needs a full rewrite. For me, it was when it took multiple seconds to find the method I needed in my server `index.js` file. I never ended up rewriting anything, but I did "modularize" the project out into:
 - `index.js`, the main driver of the program
 - `mappingDownloader.js`, responsible for downloading and updating jars
 - `mappingManager.js`, which holds information on all version mappings
 - `mappingParser.js`, used to parse downloaded mapping files

I dislike how "modularization" is handled in NodeJS/JS, but that might just be due to my prior experience in Java (where *everything* has a separate class). It seemed rather difficulty to extract stuff out to different files, and VSCode did absolutely nothing to help me. It took 30 runs to get rid of all the import errors Java would usually catch before even compiling the project (yes, language differences, still annoying).

### Thoughts on Tooling

From a language standpoint, getting to learn **JavaScript** has been a blessing and a curse. 

On one hand, I like the feeling of writing JS. 
It flows nicely, and being able to write code without worrying about things like classes (I just stuck all my methods in index.js to start) and getters & setters for data (you just call the data by name) was nice. In other words, I felt like I could deal more with actually writing code & logic than dealing with the *structure* of the program.

```js
console.log("Hello, world!");
```

On the flip side, my experience with JavaScript IDE integration in VSCode was poor (there's a good chance I just have it set up incorrectly). I should prefix this by saying I enjoyed using VSCode for what was mostly my first major time, and would not put the blame on it.  

For the most part, default suggestions *did* work. If I start typing a field I have already accessed somewhere else in the file, it'll show up as a suggestion. Same goes for *some* standard methods. The problem is when you have certain variables that don't have a definitive type, there are *no* suggestions on it. I'm familiar with IntelliJ + Java, where you see the perfect list of suggestions, with everything being available, and the top-most options being the most relevant to the current context of your code (vs. JS/VSCode where I spent a lot of time trying to figure out what methods even existed online).

In other words, I'm going to try this "TypeScript" thing out for my next project. :)

**NodeJS and Express** were fun to use and explore. I had heard of the dreaded *node_modules* folder in the past, and I can see why it might be memed on, but npm still worked well for me.

<img src="/docs/assets/images/node_modules_meme.png" alt="drawing" width="400"/>

If I had to compare npm to Gradle (from the Java ecosystem), I would say they rank similarly, with npm being a tad bit better. npm's ease of use is much better than 
constantly struggling to get Gradle to download the right dependency... npm install *xyz* and you're done (or maybe I've just missed the bad stuff?). One thing that I do prefer
about Gradle is that it *seems to* (I've been using npm for a week, so I am 100% missing things) make it easier to see *what* you have installed. npm is like... okay, what all
did I install again?

Having different logic in separated npm modules is nice, but annoying when you want to do file IO and need 5 separate libraries for each specific task.

```js
npm install everything
```

Express was easy to get started with and easy to expand on. I was shocked at how *little* I needed to make a simple request! Adding rate limiting was 5 extra lines at most:

```js
const rateLimit = require('express-rate-limit');
const app = express();

app.use(rateLimt({
    windowMs: 10 * 1000, // 10 seconds
    max: 1 // max requests per windowMs
}));

app.get('/', (req, res) => {
    res.json({
        message: "Hello, world!"
    });
});
```

One problem I had with NodeJS (which I will discuss more under *Problems*) was modularizing/splitting up my project into multiple files, which further deepened my issue with IDE error-checking and suggestions. Other than those issues, which I am sure I will figure out as time goes on, I had a lot of fun with learning these pieces of technology.

### Concepts Learned

The **client vs. server** split was one of the first concepts I learned while making this project. Coming into it, I had *tiny* bit of an idea as to how it worked, but nothing concrete. I think the major takeaway for me was that you have JS on the client *and* server in a website/NodeJS project, and that the server JS is what could change to other languages (Python => Django, Java => Spring). My favorite part of using NodeJS is that you can keep all code inside the same project and use the same languages on both sides, as opposed to leveraging CSS, HTML, JS, *and* another language like Python or Java. 

**API keys** and their usages was something I struggled to comprehend at first, and I had to ask around until I fully figured it out. At this point, I knew the client/server split *existed*, but not how you were supposed to utilize it. My issue was that, given an API key for a service, *how do you secure it while calling the API from the client?* The answer is that you *don't* call the API on the client, but instead abstract it inside your service. The client requests information from the server, the server requests it from the API, and then returns said information back to the client. This might seem obvious, but I didn't realize all website setups (that use require-API-key APIs) did that.

**Asynchronous vs synchronous** was an important concept I didn't fully understand until I used it incorrectly. I knew the difference between them (async = multiple code can run at once, sync = code runs in order), but not how that applies to applications. In NodeJS (& modules), calls being async seemed to be the norm (with sync methods being appended with `sync`, eg. `writeFile` and `writeFileSync`). What do you think happens when the following (theoretical) code is run?

```javascript
fileIO.writeFile(data, location);
console.log("Finished writing file at", location);
```

The file writes, then the print displays in console, right? Absolutely & fully wrong. The file writing *starts*, and moves on to the next line even if it hasn't finished. This normally isn't a problem, but it is a problem if you do something like...

```javascript
fileIO.writeFile(data, location);
unzipFile(location);
```

Now you're trying to unzip a file that doesn't exist, and... yeah, I spent a *lot* of time figuring this issue out.

There are 2 solutions to this issue. First, you can use the `sync` variant of the method (if it exists), which fully runs before calling the next line (normally):

```javascript
fileIO.writeFileSync(data, location);
unzipFile(location);
```

The second option is passing in a callback function (most async methods seemed to support this) which would run after the task was finished:

```javascript
fileIO.writeFileSync(data, location, () => {
    unzipFile(location);
});
```

I opted to run most of my logic sync, mostly because I didn't care about the potential async speed benefits (and didn't *need* to do anything async) after noticing this issue.

### Conclusion

This was a project I *highly* enjoyed making, and it made me re-evaluate my view on website development. Prior to this point, I had always thought web development was more front-end and less logic (and I wanted to work on the processing rather than the design). I quickly realized that this was wrong and that there is much more to do besides making fancy animations and spinning cat images.