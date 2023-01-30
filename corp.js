// Tunables
let minHappy = 98;
let minEnergy = 98;
let minMorale = 98;
let divisionNames = {
    "Agriculture": "Jeek Heavier Industries",
    "Chemical": "Based Acidics",
    "Computers": "JeekCom",
    "Energy": "JeekElec",
    "Fishing": "Smells Like Fish",
    "Food": "Jeek Heaviest Industries",
    "HealthCare": "Ambulance Chasees",
    "Mining": "Going Deeper",
    "Pharmaceutical": "Drugs",
    "RealEstate": "Land Ho",
    "Robotics": "Roku's Basilisks",
    "Software": "BitIgniters",
    "Tobacco": "Pole Smokers",
    "Utilities": "Wet Ones"
}
let productNames = {
    "Tobacco": ["Tobacco Classic", "New Tobacco", "Diet Tobacco", "Cherry Tobacco", "Tobacco Zero"],
    "Food": ["Colon Blow", "Rectal Delight", "Fecalicious", "Poop Pastries", "All You Can Yeet Buffet"]
}
let HQ = "Sector-12";

// Constants
let INDUSTRIES = {
    "Agriculture": {
        "Type": "Simple",
        "Needs": { "Water": .5, "Energy": .5 },
        "Creates": { "Plants": 1, "Food": 1 }
    },
    "Tobacco": {
        "Type": "Product",
        "Needs": { "Plants": 1, "Water": .2 }
    },
    "Food": {
        "Type": "Product",
        "Needs": { "Food": .5, "Water": .5, "Energy": .2 }
    },
    "Chemical": {
        "Type": "Simple",
        "Needs": { "Plants": 1, "Energy": .5, "Water": .5 },
        "Creates": { "Chemicals": 1 }
    },
    "Computers": {
        "Type": "Hybrid",
        "Needs": { "Metal": 2, "Energy": 1 },
        "Creates": { "Hardware": 1 }
    },
    "Energy": {
        "Type": "Simple",
        "Needs": { "Hardware": .1, "Metal": .2 },
        "Creates": { "Energy": 1 }
    },
    "Fishing": {
        "Type": "Simple",
        "Needs": { "Energy": .5 },
        "Creates": { "Food": 1 }
    },
    "Healthcare": {
        "Type": "Product",
        "Needs": { "Robots": 10, "AI Cores": 5, "Energy": 5, "Water": 5 },
    },
    "Mining": {
        "Type": "Simple",
        "Needs": { "Energy": .8 },
        "Creates": { "Metal": 1 }
    },
    "Pharmaceutical": {
        "Type": "Hybrid",
        "Needs": { "Chemicals": 2, "Energy": 1, "Water": .5 },
        "Creates": { "Drugs": 1 }
    },
    "RealEstate": {
        "Type": "Hybrid",
        "Needs": { "Metal": 5, "Energy": 5, "Water": 2, "Hardware": 4 },
        "Creates": { "Real Estate": 1 }
    },
    "Robotics": {
        "Type": "Hybrid",
        "Needs": { "Hardware": 5, "Energy": 3 },
        "Creates": { "Robots": 1 }
    },
    "Software": {
        "Type": "Hybrid",
        "Needs": { "Hardware": .5, "Energy": .5 },
        "Creates": { "AI Cores": 1 }
    },
    "Utilities": {
        "Type": "Simple",
        "Needs": { "Hardware": .1, "Metal": .1 },
        "Creates": { "Water": .1 }
    }
}
let CITIES = ["Sector-12", "Aevum", "Chongqing", "Ishima", "New Tokyo", "Volhaven"];

let mults = [
    [.30, .20, .72, .30], //  0 - Agriculture
    [.20, .20, .25, .25], //  1 - Chemical
    [.19, .00, .20, .36], //  2 - Computer
    [.30, .00, .65, .05], //  3 - Energy
    [.20, .35, .50, .15], //  4 - Fishing
    [.25, .15, .05, .30], //  5 - Food
    [.10, .10, .10, .10], //  6 - Healthcare
    [.45, .40, .30, .45], //  7 - Mining
    [.20, .15, .05, .25], //  8 - Pharmaceutical
    [.60, .06, .00, .60], //  9 - Real Estate
    [.36, .19, .32, .00], // 10 - Robotics
    [.18, .25, .15, .05], // 11 - Software
    [.15, .15, .15, .20], // 12 - Tobacco
    [.50, .00, .50, .40]  // 13 - Utilities
]

function calc(ai = 0, hw = 0, re = 0, rob = 0, industry = 0) {
    return (((.002 * ai + 1) ** mults[industry][0]) * ((.002 * hw + 1) ** mults[industry][1]) * ((.002 * re + 1) ** mults[industry][2]) * ((.002 * rob + 1) ** mults[industry][3])) ** .73
}

function optimizerr(industry, size) {
    if (size == 0) {
        return [0, 0, 0];
    }
    let searchmin = 0;
    let searchmax = size;
    let divs = (searchmax - searchmin) * .1;
    let scores = [[calc(0, 0, 0, size / .5, industry), 0, size]];
    while (divs > .00005 && searchmin < searchmax) {
        let i = searchmin;
        while (i <= searchmax + divs) {
            if (i <= size && i >= 0) {
                scores = scores.concat([[calc(0, 0, i / .005, (size - i) / .5, industry), i, size - i]]);
            }
            i += divs;
        }
        scores = scores.sort((a, b) => { return a[0] - b[0]; });
        searchmin = scores[scores.length - 1][0] - divs;
        searchmax = scores[scores.length - 1][0] + divs;
        divs *= .1;
    }
    return [scores[scores.length - 1][0], scores[scores.length - 1][1], size - scores[scores.length - 1][1]];
}

function optimizeah(industry, size) {
    if (size == 0) {
        return [0, 0, 0];
    }
    let searchmin = 0;
    let searchmax = size;
    let divs = (searchmax - searchmin) * .1;
    let scores = [[calc(0, size / .06, 0, 0, industry), 0, size]];
    while (divs > .00005 && searchmin < searchmax) {
        let i = searchmin;
        while (i <= searchmax + divs) {
            if (i <= size && i >= 0) {
                scores = scores.concat([[calc(i / .1, (size - i) / .06, 0, 0, industry), i, size - i]]);
            }
            i += divs;
        }
        scores = scores.sort((a, b) => { return a[0] - b[0]; });
        searchmin = scores[scores.length - 1][0] - divs;
        searchmax = scores[scores.length - 1][0] + divs;
        divs *= .1;
    }
    return [scores[scores.length - 1][0], scores[scores.length - 1][1], size - scores[scores.length - 1][1]];
}

export function optimize(industry, size) {
    if (size == 0) {
        return [0, 0, 0, 0, 0];
    }
    let searchmin = 0;
    let searchmax = size;
    let divs = (searchmax - searchmin) * .1;
    let scores = [[0, 0, 0, 0, 0, 0, 0, 0]];
    while (divs > .00005 && searchmin < searchmax) {
        let i = searchmin;
        while (divs > .00005 && i <= searchmax + divs) {
            if (i <= size && i >= 0) {
                let rr = optimizerr(industry, i);
                let ah = optimizeah(industry, size - i);
                scores = scores.concat([[ah[0] * rr[0], i, size - i, ah[1] / .1, ah[2] / .06, rr[1] / .005, rr[2] / .5]]);
            }
            i += divs;
        }
        scores.sort((a, b) => { return a[0] - b[0]; });
        searchmin = scores[scores.length - 1][1] - divs;
        searchmax = scores[scores.length - 1][1] + divs;
        divs *= .1;
    }
    let finalcheck = [[Math.floor(scores[scores.length - 1][3]), Math.floor(scores[scores.length - 1][4]), Math.floor(scores[scores.length - 1][5]), Math.floor(scores[scores.length - 1][6])]];
    for (let ai = finalcheck[0][0]; ai <= finalcheck[0][0] + 20; ai++) {
        for (let hw = finalcheck[0][1]; hw <= finalcheck[0][1] + 32; hw++) {
            for (let re = finalcheck[0][2]; re <= finalcheck[0][2] + 100; re++) {
                for (let rob = finalcheck[0][3]; rob <= finalcheck[0][3] + 4; rob++) {
                    if (ai * .1 + hw * .06 + re * .005 + rob * .5 <= size) {
                        finalcheck.push([ai, hw, re, rob]);
                    }
                }
            }
        }
    }
    finalcheck = finalcheck.filter(x => x[0] * .1 + x[1] * .06 + x[2] * .005 + x[3] * .5 <= size);
    finalcheck = finalcheck.sort((a, b) => calc(a[0], a[1], a[2], a[3], industry) - calc(b[0], b[1], b[2], b[3], industry));
    finalcheck[finalcheck.length - 1].push(6 * calc(finalcheck[finalcheck.length - 1][0], finalcheck[finalcheck.length - 1][1], finalcheck[finalcheck.length - 1][2], finalcheck[finalcheck.length - 1][3], industry));
    return finalcheck[finalcheck.length - 1];
}

export class Corporation {
    constructor(ns) {
        this.ns = ns;
        this.c = this.ns.corporation;
        this.started = false;
        this.lastProduct = {};
        this.pricing = {};
    }
    async startCorp(name = "jeekCo") {
        while ([undefined, false].includes(this.c.hasCorporation())) {
            await this.ns.asleep(0);
            try {
                this.c.createCorporation(name, this.ns.getPlayer().bitNodeN == 3 ? false : true);
            } catch {
                await this.ns.asleep(60000);
            }
        }
        await this.ns.asleep(0);
        this.started = true;
        this.coffeeparty();
        this.ns.toast("Corporation started.");
    }
    async coffeeparty() {
        while (true) {
            while (this.c.getCorporation().state != "START") {
                await this.ns.asleep(0);
            }
            for (let division of this.c.getCorporation().divisions) {
                for (let city of this.c.getDivision(division).cities) {
                    if (this.c.getOffice(division, city).employees > 0) {
                        if (this.c.getOffice(division, city).avgEne < minEnergy) {
                            try {
                                this.c.buyCoffee(division, city);
                            } catch { }
                        }
                        if (this.c.getOffice(division, city).avgHap < minHappy ||
                            this.c.getOffice(division, city).avgMor < minMorale) {
                            try {
                                this.c.throwParty(division, city, this.c.getConstants().coffeeCostPerEmployee);
                            } catch { }
                        }
                    }
                }
            }
            while (this.c.getCorporation().state == "START") {
                await this.ns.asleep(0);
            }
        }
    }
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
    }
    getDivName(type) {
        for (let division of this.c.getCorporation().divisions) {
            if (this.c.getDivision(division).type == type) {
                return division;
            }
        }
        return null;
    }
    async warehouseFF(type, city) {
        let mysize = 0;
        let mymats = [0, 0, 0, 0, 0];
        for (let twice of [0, 1]) {
            while (this.c.getCorporation().state != "START") {
                await this.ns.asleep(0);
            }
            if (mysize != this.c.getWarehouse(this.getDivName(type), city).size) {
                mysize = this.c.getWarehouse(this.getDivName(type), city).size;
                mymats = optimize(["Agriculture", "Chemical", "Computer", "Energy", "Fishing", "Food", "Healthcare", "Mining", "Pharmaceutical", "Real Estate", "Robotics", "Software", "Tobacco", "Utilities"].indexOf(type), mysize * [.50, .50, .55, .75, .75, .75][this.round]);
            }
            let didSomething = false;
            for (let material of ["AI Cores", "Hardware", "Real Estate", "Robots"]) {
                let matIndex = ["AI Cores", "Hardware", "Real Estate", "Robots"].indexOf(material);
                if (Object.keys(INDUSTRIES[type]).includes("Creates") && !Object.keys(INDUSTRIES[type].Creates).includes(material)) {
                    if (this.c.getMaterial(this.getDivName(type), city, material).qty >= mymats[matIndex]) {
                        this.c.buyMaterial(this.getDivName(type), city, material, 0);
                        this.c.sellMaterial(this.getDivName(type), city, material, (this.c.getMaterial(this.getDivName(type), city, material).qty - mymats[matIndex]) / 10, 0);
                        didSomething = true;
                    }
                    if (this.c.getMaterial(this.getDivName(type), city, material).qty <= mymats[matIndex]) {
                        this.c.buyMaterial(this.getDivName(type), city, material, (mymats[matIndex] - this.c.getMaterial(this.getDivName(type), city, material).qty) / 10);
                        this.c.sellMaterial(this.getDivName(type), city, material, 0, 0);
                        didSomething = true;
                    }
                }
            }
            if (!didSomething) {
                return;
            }
            while (this.c.getCorporation().state == "START") {
                await this.ns.asleep(0);
            }
        }
    }
    async Advert(type = "Agriculture", toLevel = 1) {
        while (this.c.getHireAdVertCount(this.getDivName(type)) < toLevel) {
            if (this.funds >= this.c.getHireAdVertCost(this.getDivName(type))) {
                this.c.hireAdVert(this.getDivName(type));
            } else {
                await this.ns.asleep(0);
            }
        }
    }
    async GetUpgrade(upgrade = "Smart Storage", level = 1) {
        while (this.c.getUpgradeLevel(upgrade) < level) {
            if (this.c.getUpgradeLevelCost(upgrade) <= this.funds) {
                this.c.levelUpgrade(upgrade);
            } else {
                await this.ns.asleep(0);
            }
        }
    }
    async WarehouseSize(type, city, size, growafterwards = false) {
        while (this.c.getWarehouse(this.getDivName(type), city).size < size) {
            if (this.c.getUpgradeWarehouseCost(this.getDivName(type), city) <= this.funds) {
                await this.c.upgradeWarehouse(this.getDivName(type), city, 1);
                if (growafterwards) {
                    this.warehouseFF(type, city);
                }
            } else {
                await this.ns.asleep(0);
            }
        }
    }
    async Hire(type, city, roles) {
        for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
            if (!Object.keys(roles).includes(job)) {
                roles[job] = 0;
            }
        }
        let operations = Object.keys(roles).includes("Operations") ? roles["Operations"] : 0;
        let engineer = Object.keys(roles).includes("Engineer") ? roles["Engineer"] : 0;
        let rnd = Object.keys(roles).includes("Research & Development") ? roles["Research & Development"] : 0;
        let management = Object.keys(roles).includes("Management") ? roles["Management"] : 0;
        let business = Object.keys(roles).includes("Business") ? roles["Business"] : 0;
        let total = Object.values(roles).reduce((a, b) => a + b, 0);
        while (this.c.getOffice(this.getDivName(type), city).size < total) {
            if (this.c.getOfficeSizeUpgradeCost(this.getDivName(type), city, 3) <= this.funds) {
                this.c.upgradeOfficeSize(this.getDivName(type), city, 3);
            } else {
                await this.ns.asleep(0);
            }
            for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
                while (this.c.getOffice(this.getDivName(type), city).employees < this.c.getOffice(this.getDivName(type), city).size && (this.c.getOffice(this.getDivName(type), city).employeeJobs[job] < roles[job])) {
                    this.c.hireEmployee(this.getDivName(type), city, job);
                }
            }
        }
        while (this.c.getOffice(this.getDivName(type), city).employees < this.c.getOffice(this.getDivName(type), city).size) {
            this.c.hireEmployee(this.getDivName(type), city, "Unassigned");
        }
        let good = true;
        for (let job of Object.keys(roles)) {
            if (this.c.getOffice(this.getDivName(type), city).employeeJobs[job] < roles[job]) {
                try {
                    if (this.c.setAutoJobAssignment(this.getDivName(type), city, job, roles[job])) {
                    } else {
                        good = false;
                    }
                } catch {
                    good = false;
                }
            }
        }
        if (!good) {
            await this.WaitOneLoop();
            for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
                this.c.setAutoJobAssignment(this.getDivName(type), city, job, 0);
            }
            await this.WaitOneLoop();
            for (let job of Object.keys(roles)) {
                if (this.c.getOffice(this.getDivName(type), city).employeeJobs[job] < roles[job]) {
                    try {
                        if (this.c.setAutoJobAssignment(this.getDivName(type), city, job, roles[job])) {
                        } else {
                            good = false;
                        }
                    } catch {
                        good = false;
                    }
                }
            }
        }
    }
    async getHappy(div = "Agriculture") {
        while (true) {
            let happy = true;
            for (let city of CITIES) {
                if (this.c.getOffice(this.getDivName(div), city).avgEne < minEnergy) {
                    happy = false;
                }
                if (this.c.getOffice(this.getDivName(div), city).avgHap < minHappy) {
                    happy = false;
                }
                if (this.c.getOffice(this.getDivName(div), city).avgMor < minMorale) {
                    happy = false;
                }
            }
            if (happy) {
                return;
            }
            await this.ns.asleep(0);
        }
    }
    async Simple(type = "Agriculture") {
        this.Pricing(type);
        while (!(this.c.getCorporation().divisions.map(x => this.c.getDivision(x)).map(x => x.type).includes(type))) {
            try {
                await this.ns.asleep(0);
                this.c.expandIndustry(type, divisionNames[type]);
            } catch {
                for (let i = 0; i < 6; i++)
                    await this.WaitOneLoop();
            }
        }
        while (!this.c.hasUnlockUpgrade("Smart Supply")) {
            this.c.unlockUpgrade("Smart Supply");
        }
        // Expand to All Cities
        for (let city of CITIES) {
            while (!this.c.getDivision(this.getDivName(type)).cities.includes(city)) {
                await this.ns.asleep(0);
                try {
                    this.c.expandCity(this.getDivName(type), city);
                } catch { }
            }
        }
        // Get Warehouses
        for (let city of CITIES) {
            while (!this.c.hasWarehouse(this.getDivName(type), city)) {
                try {
                    this.c.purchaseWarehouse(this.getDivName(type), city);
                } catch { await this.ns.asleep(0); }
                await this.ns.asleep(0);
            }
        }
        // Enable Smart Supply
        for (let city of CITIES) {
            this.c.setSmartSupply(this.getDivName(type), city, true);
        }
        let promises = [];
        // Get Employees
        for (let city of CITIES) {
            promises.push(this.Hire(type, city, { "Operations": 1, "Engineer": 1, "Business": 1 }));
        }
        // Buy 1 advert
        promises.push(this.Advert(type, 1));
        // Upgrade Each City's Storage to 300
        for (let city of CITIES) {
            promises.push(this.WarehouseSize(type, city, 300))
        }
        // Set produced materials to be sold
        for (let city of CITIES) {
            for (let material of Object.keys(INDUSTRIES[type].Creates)) {
                this.c.sellMaterial(this.getDivName(type), city, material, "MAX", "MP");
            }
        }
        for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants", "Smart Factories"]) {
            promises.push(this.GetUpgrade(upgrade, 2));
        }
        await Promise.all(promises); promises = [];
        await this.getHappy(type);
        // Adjust Warehouses
        for (let city of CITIES) {
            promises.push(this.warehouseFF(type, city));
        }
        await Promise.all(promises); promises = [];
        if (this.round == 1) {
            await this.getHappy(type);
            for (let i = 0; i < 6; i++) {
                await this.WaitOneLoop();
            }
            this.c.acceptInvestmentOffer();
        }
        // Get Employees
        let redo = false;
        if (this.c.getDivision(this.getDivName(type)).research < 2) {
            redo = true;
            for (let city of CITIES) {
                promises.push(this.Hire(type, city, { "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 }));
            }
        }
        // Get Upgrades
        for (let upgrade of ["Smart Storage"]) {
            for (let city of CITIES) {
                promises.push(this.GetUpgrade(upgrade, 10).then(this.WarehouseSize(type, city, 2000, true), false));
            }
        }
        if (redo) {
            await promises[0];
            while (this.c.getDivision(this.getDivName(type)).research < 2) {
                await this.ns.asleep(0);
            }
        }
        for (let upgrade of ["Smart Factories"]) {
            promises.push(this.GetUpgrade(upgrade, 10));
        }
        if (this.round >= 2) {
            for (let city of CITIES) {
                promises.push(this.Hire(type, city, { "Operations": 3, "Engineer": 2, "Business": 2, "Management": 2, "Research & Development": 0 }));
            }
        }
        await Promise.all(promises);
        // Adjust Warehouses
        for (let city of CITIES) {
            promises.push(this.warehouseFF(type, city));
        }
        await Promise.all(promises); promises = [];
        if (this.round == 2) {
            await this.getHappy(type);
            for (let i = 0; i < 6; i++) {
                await this.WaitOneLoop();
            }
            this.c.acceptInvestmentOffer();
        }
        // Upgrade Each City's Storage to 3800
        for (let city of CITIES) {
            promises.push(this.WarehouseSize(type, city, 3800, true))
        }
        await Promise.all(promises);
        // Adjust Warehouses
        for (let city of CITIES) {
            promises.push(this.warehouseFF(type, city));
        }
        await Promise.all(promises); promises = [];
        return true;
    }
    async WaitOneLoop() {
        let state = this.c.getCorporation().state;
        while (this.c.getCorporation().state == state) {
            await this.ns.asleep(0);
        }
        while (this.c.getCorporation().state != state) {
            await this.ns.asleep(0);
        }
    }
    async Product(type = "Tobacco") {
        this.Pricing(type);
        while (!(this.c.getCorporation().divisions.map(x => this.c.getDivision(x)).map(x => x.type).includes(type))) {
            try {
                await this.ns.asleep(0);
                this.c.expandIndustry(type, divisionNames[type]);
            } catch {
                await this.ns.asleep(60000);
            }
        }
        while (!this.c.hasUnlockUpgrade("Smart Supply")) {
            this.c.unlockUpgrade("Smart Supply");
        }
        // Expand to All Cities
        for (let city of CITIES) {
            while (!this.c.getDivision(this.getDivName(type)).cities.includes(city)) {
                await this.ns.asleep(0);
                try {
                    this.c.expandCity(this.getDivName(type), city);
                } catch { }
            }
        }
        // Get Warehouses
        for (let city of CITIES) {
            while (!this.c.hasWarehouse(this.getDivName(type), city)) {
                try {
                    this.c.purchaseWarehouse(this.getDivName(type), city);
                } catch { await this.ns.asleep(0); }
                await this.ns.asleep(0);
            }
        }
        // Enable Smart Supply
        for (let city of CITIES) {
            this.c.setSmartSupply(this.getDivName(type), city, true);
        }
        let promises = [];
        // Get Employees
        for (let city of CITIES) {
            city == HQ ?
                promises.push(this.Hire(type, city, { "Operations": 8, "Engineer": 9, "Business": 5, "Management": 8 })) :
                promises.push(this.Hire(type, city, { "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 }));
        }
        await Promise.all(promises);
        promises = [];
        this.Products(type);
        for (let upgrade of ["DreamSense"]) {
            promises.push(this.GetUpgrade(upgrade, 30));
        }
        for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants"]) {
            promises.push(this.GetUpgrade(upgrade, 20));
        }
        for (let upgrade of ["Project Insight"]) {
            promises.push(this.GetUpgrade(upgrade, 10));
        }
        while (this.c.getDivision(this.getDivName(type)).products.length == 0) {
            await this.ns.asleep(0);
        }
        while (this.c.getProduct(this.getDivName(type), this.c.getDivision(this.getDivName(type)).products[0]).developmentProgress < 100) {
            await this.ns.asleep(0);
        }
        while (true) {
            if (this.c.getUpgradeLevelCost("Wilson Analytics") <= this.funds) {
                this.c.levelUpgrade("Wilson Analytics");
            } else {
                if (this.c.getOfficeSizeUpgradeCost(this.getDivName(type), HQ, 15) <= this.funds) {
                    let size = this.c.getOffice(this.getDivName(type), HQ).size + 15;
                    let main = Math.floor(size / 3.5);
                    let bus = size - 3 * main;
                    await this.Hire(type, HQ, { "Operations": main, "Engineer": main, "Business": bus, "Management": main });
                }
                else {
                    if (this.c.getUpgradeLevel("Wilson Analytics") >= 10 && this.c.getHireAdVertCost(this.getDivName(type)) <= this.funds) {
                        this.c.hireAdVert(this.getDivName(type));
                    } else {
                        let didSomething = false;
                        for (let city of CITIES) {
                            if (this.c.getOffice(this.getDivName(type), city).size + 60 < this.c.getOffice(this.getDivName(type), HQ).size) {
                                if (this.c.getOfficeSizeUpgradeCost(this.getDivName(type), city, 3) <= this.funds) {
                                    await this.Hire(type, city, { "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": this.c.getOffice(this.getDivName(type), city).size - 1 });
                                    didSomething = true;
                                }
                            }
                        }
                        if (!didSomething) {
                            for (let city of CITIES) {
                                if (this.c.getUpgradeWarehouseCost(this.getDivName(type), city, 1) <= this.funds) {
                                    this.c.upgradeWarehouse(this.getDivName(type), city, 1);
                                    this.warehouseFF(type, city);
                                }
                            }
                        }
                    }
                }
            }
            await this.ns.asleep(0);
        }
    }
    get funds() {
        return this.c.getCorporation().funds;
    }
    async Pricing(type) {
        while (!this.c.getCorporation().divisions.map(x => this.c.getDivision(x).type).includes(type)) {
            await this.ns.asleep(0);
        }
        if (!Object.keys(this.pricing).includes(type)) {
            this.pricing[type] = {};
        }
        while (true) {
            while (this.c.getCorporation().state != "START") {
                await this.ns.asleep(0);
            }
            for (let product of this.c.getDivision(this.getDivName(type)).products) {
                if (this.c.getProduct(this.getDivName(type), product).developmentProgress >= 100) {
                    if (!(Object.keys(this.pricing[type]).includes(product))) {
                        this.pricing[type][product] = {
                            'x_min': 1,
                            'x_max': 1024,
                            'phase': 1
                        }
                    }
                    this.ns.tprint(this.c.getProduct(this.getDivName(type), product).cityData);
                    if (this.pricing[type][product].phase == 1) {
                        if (this.c.getProduct(this.getDivName(type), product).cityData[HQ][1] <= this.c.getProduct(this.getDivName(type), product).cityData[HQ][2]) {
                            this.pricing[type][product].x_max *= 1024;
                        }
                        if (this.c.getProduct(this.getDivName(type), product).cityData[HQ][1] > this.c.getProduct(this.getDivName(type), product).cityData[HQ][2]) {
                            this.pricing[type][product].phase = 2;
                        }
                    }
                    if (this.pricing[type][product].phase == 2) {
                        if (this.c.getProduct(this.getDivName(type), product).cityData[HQ][1] <= this.c.getProduct(this.getDivName(type), product).cityData[HQ][2]) {
                            this.pricing[type][product].x_min = (this.pricing[type][product].x_min + this.pricing[type][product].x_max) / 2;
                        }
                        if (this.c.getProduct(this.getDivName(type), product).cityData[HQ][1] > this.c.getProduct(this.getDivName(type), product).cityData[HQ][2]) {
                            this.pricing[type][product].x_max = (this.pricing[type][product].x_min + this.pricing[type][product].x_max) / 2;
                        }
                        if (this.pricing[type][product].x_max - this.pricing[type][product].x_min < .5) {
                            this.pricing[type][product].phase = 3;
                        }
                    }
                    if (this.pricing[type][product].phase == 3) {
                        if (this.c.getProduct(this.getDivName(type), product).cityData[HQ][1] <= this.c.getProduct(this.getDivName(type), product).cityData[HQ][2]) {
                            this.pricing[type][product].x_min = this.pricing[type][product].x_min + 1 >= 1 ? this.pricing[type][product].x_min + 1 : 1;
                            this.pricing[type][product].x_max = this.pricing[type][product].x_min;
                        }
                        if (this.c.getProduct(this.getDivName(type), product).cityData[HQ][1] > this.c.getProduct(this.getDivName(type), product).cityData[HQ][2]) {
                            this.pricing[type][product].x_min = this.pricing[type][product].x_min - 1 >= 1 ? this.pricing[type][product].x_min - 1 : 1;
                            this.pricing[type][product].x_max = this.pricing[type][product].x_min;
                        }
                    }
                    this.ns.toast(((this.pricing[type][product].x_max + this.pricing[type][product].x_min) / 2).toString() + "*MP");
                    this.ns.toast(this.pricing[type][product].phase.toString() + " " + type + " " + product);
                    for (let city of CITIES) {
                        this.c.sellProduct(this.getDivName(type), city, product, "MAX", (Math.floor((this.pricing[type][product].x_max + this.pricing[type][product].x_min) / 2)).toString() + "*MP", false);
                    }
                }
            }
            while (this.c.getCorporation().state == "START") {
                await this.ns.asleep(0);
            }
        }
    }
    async Products(type) {
        if (!Object.keys(this.pricing).includes(type)) {
            this.pricing[type] = {};
            for (let product of this.c.getDivision(this.getDivName(type)).products) {
                this.pricing[type][product] = {
                    'x_min': 1,
                    'x_max': 1,
                    'phase': 1
                }
            }
        }
        let currentProducts = this.c.getDivision(this.getDivName(type)).products;
        if (currentProducts.length == 0) {
            while (this.funds < 2e9) {
                await this.ns.asleep(0);
            }
            this.c.makeProduct(this.getDivName(type), HQ, productNames[type][0], 1e9, 1e9);
            this.lastProduct[type] = 2e9;
        }
        while (true) {
            while (this.c.getProduct(this.getDivName(type), this.c.getDivision(this.getDivName(type)).products[this.c.getDivision(this.getDivName(type)).products.length - 1]).developmentProgress < 100) {
                await this.ns.asleep(0);
            }
            this.pricing[type][this.c.getDivision(this.getDivName(type)).products[this.c.getDivision(this.getDivName(type)).products.length - 1]] = {
                'x_min': 1,
                'x_max': 1,
                'phase': 1
            }
            if (this.c.getDivision(this.getDivName(type)).products.length == 3 + this.c.hasResearched(this.getDivName(type), "uPgrade: Capacity.I") + this.c.hasResearched(this.getDivName(type), "uPgrade: Capacity.II")) {
                let qlts = [];
                for (let product of this.c.getDivision(this.getDivName(type)).products) {
                    qlts.push([this.c.getProduct(this.getDivName(type), product).qlt, product]);
                }
                qlts = qlts.sort((a, b) => -a[0] + b[0]);
                while (this.funds < this.lastProduct[type]) {
                    await this.ns.asleep(0);
                }
                this.c.discontinueProduct(this.getDivName(type), qlts[0][1]);
            }
            while (this.funds < this.lastProduct[type]) {
                await this.ns.asleep(0);
            }
            this.lastProduct[type] = this.funds;
            this.c.makeProduct(this.getDivName(type), HQ, productNames[type].filter(x => !this.c.getDivision(this.getDivName(type)).products.includes(x))[0], this.funds / 2, this.funds / 2);
            await this.ns.asleep(0);
        }
    }
}

export async function main(ns) {
    let Corp = new Corporation(ns);
    Corp.startCorp();
    await ns.asleep(1000);
    while (Corp.started == false) {
        ns.toast("Corporation not started yet.")
        await ns.asleep(60000);
    }
    await Corp.Simple("Agriculture");
    Corp.Product("Tobacco");
    while (Corp.funds < 1e15) {
        await ns.asleep(1000);
    }
    Corp.Product("Food");

    ns.tprint(ns.corporation.getOffice("Jeek Heavier Industries", "Sector-12"))
    while (true) {
        ns.tprint(ns.corporation.getInvestmentOffer().funds);
        ns.tprint(ns.corporation.getDivision("Jeek Heavier Industries"));
        await ns.asleep(10000);
    }
}