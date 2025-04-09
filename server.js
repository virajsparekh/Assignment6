/********************************************************************************
* WEB700 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Viraj Parekh Student ID: 119204238 Date: 2025-04-11
*
* Published URL: https://assignment6-two-bay.vercel.app/
*
********************************************************************************/
const express = require("express");
const path = require("path");
const LegoData = require("./modules/legoSets");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const legoData = new LegoData();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public'))); 

// Routes
app.get("/", (req, res) => res.render("home", { activePage: 'home' }));
app.get("/about", (req, res) => res.render("about", { activePage: 'about' }));

app.get("/lego/sets", async (req, res) => {
    try {
        const themeQuery = req.query.theme;
        let sets;
        let availableThemes = ['All Sets'];

        if (themeQuery && themeQuery !== 'All Sets') {
            const [themeSets, randomThemes] = await Promise.all([
                legoData.getSetsByTheme(themeQuery),
                legoData.getRandomThemes(4)
            ]);
            
            sets = themeSets;
            availableThemes.push(...randomThemes.map(t => t.name));
        } else {
            const [allSets, randomThemes] = await Promise.all([
                legoData.getAllSets(),
                legoData.getRandomThemes(4)
            ]);
            
            sets = allSets;
            availableThemes.push(...randomThemes.map(t => t.name));
        }

        res.render("sets", {
            sets,
            currentTheme: themeQuery || 'All Sets',
            availableThemes,
            activePage: 'sets'
        });
    } catch (err) {
        if (err.message.includes("Unable to find requested sets")) {
            const randomThemes = await legoData.getRandomThemes(4);
            res.status(404).render("sets", {
                sets: [],
                currentTheme: req.query.theme,
                availableThemes: ['All Sets', ...randomThemes.map(t => t.name)],
                errorMessage: `No sets found for theme: ${req.query.theme}`
            });
        } else {
            res.status(404).render("404", {
                message: err.message,
                activePage: ''
            });
        }
    }
});

app.get("/lego/addSet", async (req, res) => {
    try {
        const themes = await legoData.getAllThemes();
        res.render("addSet", {
            themes,
            error: null,
            formData: {},
            activePage: 'addSet'
        });
    } catch (err) {
        res.status(500).render("500", { message: err, activePage: '' });
    }
});

app.post("/lego/addSet", async (req, res) => {
    try {
        const formData = req.body;
        
        const themeId = formData.theme_id ? parseInt(formData.theme_id) : null;
        
        if (!themeId || isNaN(themeId)) {
            throw new Error("Please select a valid theme");
        }

        const newSet = {
            set_num: formData.set_num,
            name: formData.name,
            year: parseInt(formData.year),
            theme_id: themeId,
            num_parts: parseInt(formData.num_parts),
            img_url: formData.img_url
        };

        await legoData.addSet(newSet);
        res.redirect("/lego/sets");
    } catch (err) {
        const themes = await legoData.getAllThemes();
        
        const formDataForRender = {
            ...req.body,
            theme_id: req.body.theme_id.toString() 
        };
        
        res.status(500).render("addSet", {
            themes,
            error: err.message.includes('theme') ? err.message : "Please select a valid theme",
            formData: formDataForRender,
            activePage: 'addSet'
        });
    }
});

app.get("/lego/sets/:set_num", async (req, res) => {
    try {
        const set = await legoData.getSetByNum(req.params.set_num);
        res.render("setDetails", { 
            set,
            activePage: 'sets',
            title: set.name 
        });
    } catch (err) {
        res.status(404).render("404", { 
            message: err.message,
            activePage: '' 
        });
    }
});

app.post("/lego/deleteSet/:set_num", async (req, res) => {
    try {
        await legoData.deleteSetByNum(req.params.set_num);
        res.redirect("/lego/sets");
    } catch (err) {
        res.status(500).render("500", { message: err, activePage: '' });
    }
});

app.use((req, res) => {
    res.status(404).render("404", {
        message: "I'm sorry, we're unable to find what you're looking for.",
        activePage: ''
    });
});

legoData.initialize().then(() => {
    app.listen(HTTP_PORT, () => 
        console.log(`Server listening on: http://localhost:${HTTP_PORT}`));
}).catch(err => {
    console.error(`Initialization failed: ${err}`);
});