require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

class LegoData {
    constructor() {
        this.sequelize = new Sequelize(
            process.env.PGDATABASE,
            process.env.PGUSER,
            process.env.PGPASSWORD, {
                host: process.env.PGHOST,
                dialect: 'postgres',
                logging: false,
                dialectOptions: {
                    ssl: {
                        require: true
                    }
                }
            }
        );

        // Define Theme model
        this.Theme = this.sequelize.define('Theme', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: Sequelize.STRING
        }, { timestamps: false });

        // Define Set model
        this.Set = this.sequelize.define('Set', {
            set_num: {
                type: Sequelize.STRING,
                primaryKey: true
            },
            name: Sequelize.STRING,
            year: Sequelize.INTEGER,
            num_parts: Sequelize.INTEGER,
            theme_id: Sequelize.INTEGER,
            img_url: Sequelize.STRING
        }, { timestamps: false });

        // Define association
        this.Set.belongsTo(this.Theme, { foreignKey: 'theme_id' });

            
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.sequelize.sync()
                .then(() => resolve())
                .catch(err => reject(err));
        });
    }

    getAllSets() {
        return this.Set.findAll({ include: [this.Theme] });
    }

    getSetByNum(setNum) {
        return this.Set.findAll({ 
            where: { set_num: setNum },
            include: [this.Theme] 
        }).then(sets => {
            return sets.length > 0 ? sets[0] : Promise.reject("Unable to find requested set");
        });
    }

    getSetsByTheme(theme) {
        return this.Set.findAll({
            include: [{
                model: this.Theme,
                where: {
                    name: {
                        [Sequelize.Op.iLike]: theme 
                    }
                }
            }]
        }).then(sets => {
            if (sets.length === 0) {
                throw new Error("Unable to find requested sets");
            }
            return sets;
        });
    }

    addSet(setData) {
        return this.Set.create(setData, {
            include: [{ model: this.Theme }]
        })
        .then(() => {})
        .catch(err => {
            if (err.name === 'SequelizeForeignKeyConstraintError') {
                throw new Error("The selected theme doesn't exist in our database");
            }
            if (err.errors) {
                throw new Error(err.errors.map(e => e.message).join(', '));
            }
            throw err;
        });
    }

    getAllThemes() {
        return this.Theme.findAll({ 
            order: ['name'],
            attributes: ['id', 'name'] 
        });
    }

    deleteSetByNum(setNum) {
        return this.Set.destroy({ where: { set_num: setNum } })
            .then((rowsDeleted) => {
                return rowsDeleted > 0 ? {} : Promise.reject("Unable to find set");
            })
            .catch(err => Promise.reject(err.errors?.[0]?.message || err.message));
    }

    getRandomThemes(limit = 4) {
        return this.Theme.findAll({
            order: this.sequelize.random(),
            limit: limit,
            attributes: ['name']
        });
    }
}

module.exports = LegoData;