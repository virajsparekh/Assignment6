/********************************************************************************
* WEB700 – Assignment 05
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Viraj Parekh Student ID: 119204238 Date: 2025-03-24
*
* Published URL: https://assignment-5-wheat.vercel.app/
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
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("home", { activePage: 'home' });
});

app.get("/about", (req, res) => {
    res.render("about", { activePage: 'about' });
});

app.get("/lego/sets", async (req, res) => {
    try {
        const themeQuery = req.query.theme;
        const sets = themeQuery 
            ? await legoData.getSetsByTheme(themeQuery)
            : await legoData.getAllSets();
        
        const popularThemes = ['All Sets', ...(await legoData.getPopularThemes(4))];
        
        res.render("sets", {
            sets,
            currentTheme: themeQuery || 'All Sets',
            availableThemes: popularThemes,
            activePage: 'sets'
        });
    } catch (err) {
        res.status(404).render("404", {
            message: err.message,
            activePage: ''
        });
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
        res.status(500).render("404", { 
            message: err.message,
            activePage: ''
        });
    }
});

app.post("/lego/addSet", async (req, res) => {
    try {
        const theme = await legoData.getThemeById(req.body.theme_id);
        const newSet = {
            set_num: req.body.set_num,
            name: req.body.name,
            year: req.body.year,
            theme_id: req.body.theme_id,
            theme: theme.name,
            num_parts: req.body.num_parts,
            img_url: req.body.img_url
        };

        await legoData.addSet(newSet);
        res.redirect("/lego/sets");
    } catch (err) {
        const themes = await legoData.getAllThemes();
        res.status(422).render("addSet", {
            themes,
            error: err.message,
            formData: req.body,
            activePage: 'addSet'
        });
    }
});

app.get("/lego/sets/:set_num", async (req, res) => {
    try {
        const set = await legoData.getSetByNum(req.params.set_num);
        res.render("setDetails", {
            set,
            activePage: 'sets'
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
        res.status(500).render("404", { 
            message: err.message,
            activePage: ''
        });
    }
});

app.use((req, res) => {
    res.status(404).render("404", { 
        message: "I'm sorry, we're unable to find what you're looking for.",
        activePage: ''
    });
});

legoData.initialize().then(() => {
    app.listen(HTTP_PORT, () => {
        console.log(`Server running on port ${HTTP_PORT}`);
    });
}).catch(err => {
    console.error(`Failed to initialize: ${err}`);
});