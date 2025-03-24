const fs = require("fs").promises;

class LegoData {
    constructor() {
        this.sets = [];
        this.themes = [];
    }

    async initialize() {
        try {
            const setData = require('../data/setData.json');
            const themeData = require('../data/themeData.json');
            
            this.sets = setData.map(element => ({
                ...element,
                theme: themeData.find(theme => theme.id === element.theme_id)?.name || 'Unknown'
            }));
            
            this.themes = themeData;
            return "Initialization successful";
        } catch (error) {
            throw new Error("Unable to load Lego data");
        }
    }

    getAllSets() {
        return this.sets.length > 0
            ? Promise.resolve(this.sets)
            : Promise.reject(new Error("No sets available"));
    }

    getSetByNum(setNum) {
        const set = this.sets.find(s => s.set_num === setNum);
        return set 
            ? Promise.resolve(set)
            : Promise.reject(new Error(`Set ${setNum} not found`));
    }

    getSetsByTheme(theme) {
        const filteredSets = this.sets.filter(s =>
            s.theme.toLowerCase() === theme.toLowerCase()
        );
        return filteredSets.length > 0
            ? Promise.resolve(filteredSets)
            : Promise.reject(new Error(`No sets found for theme: ${theme}`));
    }

    getPopularThemes(limit = 4) {
        // Count theme occurrences
        const themeCounts = {};
        this.sets.forEach(set => {
            if (set.theme) {
                themeCounts[set.theme] = (themeCounts[set.theme] || 0) + 1;
            }
        });
        
        // Sort by count and get top themes
        return Object.entries(themeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(entry => entry[0]);
    }

    getAllThemes() {
        try {
            // Return both theme names and IDs for the addSet form
            if (this.themes && this.themes.length) {
                return Promise.resolve(this.themes);
            }
            // Fallback to unique themes from sets if themeData.json not available
            const uniqueThemes = [...new Set(this.sets.map(set => ({
                id: set.theme_id,
                name: set.theme
            })))];
            return Promise.resolve(uniqueThemes);
        } catch (error) {
            return Promise.reject(new Error("Could not retrieve themes"));
        }
    }

    getThemeById(id) {
        const theme = this.themes.find(t => t.id == id);
        return theme 
            ? Promise.resolve(theme) 
            : Promise.reject(new Error("Unable to find requested theme"));
    }

    addSet(newSet) {
        return new Promise((resolve, reject) => {
            const exists = this.sets.some(s => s.set_num === newSet.set_num);
            exists 
                ? reject(new Error("Set already exists"))
                : (this.sets.push(newSet), resolve());
        });
    }

    deleteSetByNum(setNum) {
        return new Promise((resolve, reject) => {
            const index = this.sets.findIndex(s => s.set_num === setNum);
            if (index > -1) {
                this.sets.splice(index, 1);
                resolve(`Set ${setNum} deleted successfully`);
            } else {
                reject(new Error(`Unable to find set with number: ${setNum}`));
            }
        });
    }
}

module.exports = LegoData;