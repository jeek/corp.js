// Tunables
let minHappy = 98;
let minEnergy = 98;
let minMorale = 98;
let baseOffers = [210e9, 5e15, 800e15, 500e18];
let divisionNames = {
    "Agriculture": "Jeek Heavier Industries",
    "Chemical": "Based Acidics",
    "Computer Hardware": "JeekCom",
    "Energy": "JeekElec",
    "Fishing": "Smells Like Fish",
    "Food": "Jeek Heaviest Industries",
    "Healthcare": "Ambulance Chasees",
    "Mining": "Going Deeper",
    "Pharmaceutical": "Drugs",
    "Real Estate": "Land Ho",
    "Robotics": "Roku's Basilisks",
    "Software": "BitIgniters",
    "Tobacco": "Pole Smokers",
    "Water Utilities": "Wet Ones"
}
let productNames = {
    "Tobacco": ["Tobacco Classic", "New Tobacco", "Diet Tobacco", "Cherry Tobacco", "Tobacco Zero"],
    "Food": ["Colon Blow", "Rectal Delight", "Fecalicious", "Poop Pastries", "All You Can Yeet Buffet"],
    "Pharmaceutical": ["Cocaine", "Weed", "Acid", "Fent", "Molly"],
    "Software": ["A", "B", "C", "D", "E"],
    "Real Estate": ["A", "B", "C", "D", "E"]
}
let HQ = "Sector-12";

// Constants
const cmdlineflags = [
    ["scam", false],
    ["jakobag", false] // Use Jakob's round 1 agriculture method
]

class CorpBaseClass { // Functions shared between Corporation, Division, and City
    constructor(ns, settings) {
        this.ns = ns;
        this.c = this.ns.corporation;
        this.settings = settings;
    }
    get funds() {
        return this.c.getCorporation().funds;
    }
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
    }
    get Cities() {
        return Object.values(this.ns.enums.CityName);
    }
    async WaitOneLoop() {
        let state = this.c.getCorporation().state;
        while (this.c.getCorporation().state == state) {
            await this.ns.asleep(this.c.getBonusTime() > 0 ? 100 : 200);
        }
        while (this.c.getCorporation().state != state) {
            await this.ns.asleep(this.c.getBonusTime() > 0 ? 200 : 2000);
        }
    }
}

class City extends CorpBaseClass {
    constructor(ns, Corp, Division, CityName, settings={}) {
        super(ns, settings);
        this.name = CityName;
        this.Corp = Corp;
        this.Division = Division;
        this.pricing = {};
        this.mults = ["aiCoreFactor", "hardwareFactor", "realEstateFactor", "robotFactor"].map(factor => Object.keys(this.c.getIndustryData(this.Division.industry)).includes(factor) ? this.c.getIndustryData(this.Division.industry)[factor] : 0);
    }
    get getOffice() {
        return this.c.getOffice(this.Division.name, this.name);
    }
    get officeSize() {
        return this.getOffice.size;
    }
    get industryData() {
        return this.Division.industryData;
    }
    get getWarehouse() {
        return this.c.getWarehouse(this.Division.name, this.name);
    }
    get warehouseSize() {
        return this.getWarehouse.size;
    }
    calc(ai = 0, hw = 0, re = 0, rob = 0) {
        return (((.002 * ai + 1) ** this.mults[0]) * ((.002 * hw + 1) ** this.mults[1]) * ((.002 * re + 1) ** this.mults[2]) * ((.002 * rob + 1) ** this.mults[3])) ** .73
    }
    optimizerr(size) {
        if (size == 0) {
            return [0, 0, 0];
        }
        let searchmin = 0;
        let searchmax = size;
        let divs = (searchmax - searchmin) * .1;
        let scores = [[this.calc(0, 0, 0, size / .5), 0, size]];
        while (divs > .00005 && searchmin < searchmax) {
            let i = searchmin;
            while (i <= searchmax + divs) {
                if (i <= size && i >= 0) {
                    scores = scores.concat([[this.calc(0, 0, i / .005, (size - i) / .5), i, size - i]]);
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
    optimizeah(size) {
        if (size == 0) {
            return [0, 0, 0];
        }
        let searchmin = 0;
        let searchmax = size;
        let divs = (searchmax - searchmin) * .1;
        let scores = [[this.calc(0, size / .06, 0, 0), 0, size]];
        while (divs > .00005 && searchmin < searchmax) {
            let i = searchmin;
            while (i <= searchmax + divs) {
                if (i <= size && i >= 0) {
                    scores = scores.concat([[this.calc(i / .1, (size - i) / .06, 0, 0), i, size - i]]);
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
    optimize(size) {
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
                    let rr = this.optimizerr(i);
                    let ah = this.optimizeah(size - i);
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
        for (let ai = finalcheck[0][0]; ai <= finalcheck[0][0] + 20 && ai * .1 <= size; ai++) {
            for (let hw = finalcheck[0][1]; hw <= finalcheck[0][1] + 32 && ai * .1 + hw * .06 <= size; hw++) {
                for (let re = finalcheck[0][2]; re <= finalcheck[0][2] + 100 && ai * .1 + hw * .06 + re * .005 <= size; re++) {
                    for (let rob = finalcheck[0][3]; rob <= finalcheck[0][3] + 4 && ai * .1 + hw * .06 + re * .005 + rob * .5 <= size; rob++) {
                        finalcheck.push([ai, hw, re, rob]);
                    }
                }
            }
        }
        finalcheck = finalcheck.filter(x => x[0] * .1 + x[1] * .06 + x[2] * .005 + x[3] * .5 <= size);
        finalcheck = finalcheck.sort((a, b) => this.calc(a[0], a[1], a[2], a[3]) - this.calc(b[0], b[1], b[2], b[3]));
        finalcheck[finalcheck.length - 1].push(6 * this.calc(finalcheck[finalcheck.length - 1][0], finalcheck[finalcheck.length - 1][1], finalcheck[finalcheck.length - 1][2], finalcheck[finalcheck.length - 1][3]));
        return finalcheck[finalcheck.length - 1];
    }
    async Start() {
        while (!this.Division.getDivision.cities.includes(this.name)) {
            await this.ns.asleep(100);
            try {
                this.c.expandCity(this.Division.name, this.name);
            } catch { }
        }
        await this.getWarehouseAPI();
        await this.getOfficeAPI();
        await this.Hire({ "Operations": 1, "Engineer": 1, "Business": 1 })
        this.coffeeparty();
    }
    async getWarehouseAPI() {
        while (!this.c.hasUnlockUpgrade("Warehouse API")) {
            if (this.c.getUnlockUpgradeCost("Warehouse API") <= this.funds) {
                this.c.unlockUpgrade("Warehouse API");
            } else {
                await this.WaitOneLoop();
            }
        }
        while (!this.c.hasWarehouse(this.Division.name, this.name)) {
            if (this.c.getConstants().warehouseInitialCost <= this.funds) {
                this.c.purchaseWarehouse(this.Division.name, this.name);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async getOfficeAPI() {
        while (!this.c.hasUnlockUpgrade("Office API")) {
            if (this.c.getUnlockUpgradeCost("Office API") <= this.funds) {
                this.c.unlockUpgrade("Office API");
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async warehouseFF(mysize = -1, maintaining = false) {
        if (mysize == -1)
            mysize = this.warehouseSize;
        mysize = Math.floor(mysize);
        if (mysize < 0)
            mysize = 0;
        let mymats = [0, 0, 0, 0, 0];
        for (let twice of [0, 1]) {
            mymats = this.optimize(mysize * [.50, .55, .55, .57, .57, .57][this.round]);
            while (this.c.getCorporation().state != "EXPORT") {
                await this.ns.asleep(400);
            }
            let didSomething = false;
            for (let material of ["AI Cores", "Hardware", "Real Estate", "Robots"]) {
                let matIndex = ["AI Cores", "Hardware", "Real Estate", "Robots"].indexOf(material);
                if ((!Object.keys(this.industryData).includes("producedMaterials") || !Object.keys(this.industryData.producedMaterials).includes(material)) && !maintaining) {
                    if (this.c.getMaterial(this.Division.name, this.name, material).qty >= mymats[matIndex]) {
                        this.c.buyMaterial(this.Division.name, this.name, material, 0);
                        this.c.sellMaterial(this.Division.name, this.name, material, (this.c.getMaterial(this.Division.name, this.name, material).qty - mymats[matIndex]) / 10, 0);
                        didSomething = true;
                    }
                    if (this.c.getMaterial(this.Division.name, this.name, material).qty <= mymats[matIndex]) {
                        this.c.buyMaterial(this.Division.name, this.name, material, (mymats[matIndex] - this.c.getMaterial(this.Division.name, this.name, material).qty) / 10);
                        this.c.sellMaterial(this.Division.name, this.name, material, 0, 0);
                        didSomething = true;
                    }
                }
            }
            if (!didSomething) {
                for (let material of ["AI Cores", "Hardware", "Real Estate", "Robots"]) {
                    let matIndex = ["AI Cores", "Hardware", "Real Estate", "Robots"].indexOf(material);
                    this.c.buyMaterial(this.Division.name, this.name, material, 0);
                    this.c.sellMaterial(this.Division.name, this.name, material, 0, 0);
                }
                return;
            }
            while (this.c.getCorporation().state == "EXPORT") {
                await this.ns.asleep(400);
            }
        }
    }
    async upgradeWarehouseSize(size, growafterwards = false) {
        await this.getWarehouseAPI();
        while (this.warehouseSize < size) {
            if (this.c.getUpgradeWarehouseCost(this.Division.name, this.name) <= this.funds) {
                this.c.upgradeWarehouse(this.Division.name, this.name, 1);
            } else {
                await this.WaitOneLoop();
            }
        }
        if (growafterwards) {
            this.warehouseFF();
        }
    }
    async upgradeWarehouseLevel(level) {
        await this.getWarehouseAPI();
        while (this.getWarehouse.level < level) {
            if (this.c.getUpgradeWarehouseCost(this.Division.name, this.name) <= this.funds) {
                this.c.upgradeWarehouse(this.Division.name, this.name, 1);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async Hire(roles) {
        await this.getOfficeAPI();
        for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
            if (!Object.keys(roles).includes(job)) {
                roles[job] = 0;
            }
        }
        let total = Object.values(roles).reduce((a, b) => a + b, 0);
        await this.getOfficeAPI();
        while (this.getOffice.size < total) {
            if (this.c.getOfficeSizeUpgradeCost(this.Division.name, this.name, 3) <= this.funds) {
                this.c.upgradeOfficeSize(this.Division.name, this.name, 3);
            } else {
                await this.WaitOneLoop();
            }
            for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
                while (this.getOffice.employees < this.getOffice.size && (this.getOffice.employeeJobs[job] < roles[job])) {
                    this.c.hireEmployee(this.Division.name, this.name, job);
                }
            }
        }
        while (this.getOffice.employees < this.getOffice.size) {
            this.c.hireEmployee(this.Division.name, this.name, "Unassigned");
        }
        let good = true;
        for (let job of Object.keys(roles)) {
            if (this.getOffice.employeeJobs[job] < roles[job]) {
                try {
                    if (this.c.setAutoJobAssignment(this.Division.name, this.name, job, roles[job])) {
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
                this.c.setAutoJobAssignment(this.Division.name, this.name, job, 0);
            }
            await this.WaitOneLoop();
            for (let job of Object.keys(roles)) {
                if (this.getOffice.employeeJobs[job] < roles[job]) {
                    try {
                        if (this.c.setAutoJobAssignment(this.Division.name, this.name, job, roles[job])) {
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
    async getHappy() {
        while (true) {
            let happy = true;
            if (this.getOffice.avgEne < minEnergy) {
                happy = false;
            }
            if (this.getOffice.avgHap < minHappy) {
                happy = false;
            }
            if (this.getOffice.avgMor < minMorale) {
                happy = false;
            }
            if (happy) {
                return;
            }
            await this.WaitOneLoop();
        }
    }
    async enableSmartSupply() {
        while (!this.c.hasUnlockUpgrade("Smart Supply")) {
            await this.ns.asleep(100);
            if (this.c.getUnlockUpgradeCost("Smart Supply") <= this.funds && !this.c.hasUnlockUpgrade("Smart Supply")) {
                this.c.unlockUpgrade("Smart Supply");
            }
        }
        // Enable Smart Supply
        this.c.setSmartSupply(this.Division.name, this.name, true);
    }
    sellMaterial(material, amount = "MAX", price = "MP") {
        this.c.sellMaterial(this.Division.name, this.name, material, amount, price);
    }
    async Pricing() {
        let phased = 0;
        await this.WaitOneLoop();
        while (true) {
            while (this.c.getCorporation().state != "SALE") {
                await this.ns.asleep(400);
            }
            for (let product of this.Division.getDivision.products) {
                if (!this.c.hasResearched(this.Division.name, "Market-TA.II")) {
                    if (this.c.getProduct(this.Division.name, product).developmentProgress >= 100) {
                        if (!(Object.keys(this.pricing).includes(product))) {
                            this.pricing[product] = {
                                'x_min': 1,
                                'x_max': 1,
                                'phase': 1
                            }
                        } else {
                            if (this.pricing[product].phase == 3) {
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] <= this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_min = this.pricing[product].x_min + 1 >= 1 ? this.pricing[product].x_min + 1 : 1;
                                    this.pricing[product].x_max = this.pricing[product].x_min;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] > this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_min = this.pricing[product].x_min - 1 >= 1 ? this.pricing[product].x_min - 1 : 1;
                                    this.pricing[product].x_max = this.pricing[product].x_min;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][2] <= .001) {
                                    this.pricing[product].x_min /= 2;
                                    this.pricing[product].x_max *= 1.5;
                                    this.pricing[product].phase = 2;
                                }
                            }
                            if (this.pricing[product].phase == 2) {
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] <= this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_min = (this.pricing[product].x_min + this.pricing[product].x_max) / 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] > this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_max = (this.pricing[product].x_min + this.pricing[product].x_max) / 2;
                                }
                                if (this.pricing[product].x_max - this.pricing[product].x_min < .5) {
                                    this.pricing[product].phase = 3;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][2] <= .001) {
                                    this.pricing[product].x_min /= 2;
                                    this.pricing[product].x_max *= 1.5;
                                    this.pricing[product].phase = 2;
                                }
                            }
                            if (this.pricing[product].phase == 1) {
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] <= this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_max *= 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] > this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].phase = 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][2] <= .001) {
                                    this.pricing[product].phase = 2;
                                }
                            }
                            this.c.sellProduct(this.Division.name, this.name, product, "MAX", (Math.floor((this.pricing[product].x_max + this.pricing[product].x_min) / 2)).toString() + "*MP", false);
                        }
                    }
                } else {
                    if (phased == 0) {
                        phased = 1;
                        this.c.sellProduct(this.Division.name, this.name, product, "MAX", "MP", false);
                        this.c.setProductMarketTA1(this.Division.name, product, true);
                        this.c.setProductMarketTA2(this.Division.name, product, false);
                    } else {
                        if (phased == 1) {
                            phased = 2;
                            this.c.setProductMarketTA1(this.Division.name, product, false);
                            this.c.setProductMarketTA2(this.Division.name, product, true);
                        }
                    }
                }
            }
            while (this.c.getCorporation().state == "SALE") {
                await this.ns.asleep(400);
            }
        }
    }
    async MaintainWarehouse() {
        let productSize = 0;
        for (let material of Object.keys(this.industryData.requiredMaterials)) {
            productSize += this.industryData.requiredMaterials[material] * this.c.getMaterialData(material).size;
        }
        while (true) {
            while (this.c.getCorporation().state != "SALE")
                await this.ns.asleep(100);
            let sizes = [0, 0, 0]; // Incoming, Outgoing, Qty
            let prod = (Object.keys(this.industryData).includes("producedMaterials") ? this.industryData.producedMaterials : [])
            for (let prodmat of prod) {
                let mysize = this.c.getMaterialData(prodmat).size;
                let myprod = this.c.getMaterial(this.Division.name, this.name, prodmat).prod;
                if (myprod < 10) {
                    myprod = 10;
                }
                sizes[1] += mysize * myprod;
                if (!["Hardware", "AI Cores", "Robots", "Real Estate"].includes(prodmat))
                    sizes[2] += mysize * this.c.getMaterial(this.Division.name, this.name, prodmat).qty;
                for (let material of Object.keys(this.industryData.requiredMaterials)) {
                    sizes[0] += myprod * this.c.getMaterialData(material).size * this.industryData.requiredMaterials[material];
                    if (!["Hardware", "AI Cores", "Robots", "Real Estate"].includes(material))
                        sizes[2] += this.c.getMaterialData(material).size * this.c.getMaterial(this.Division.name, this.name, material).qty;
                }
            }
            let products = (Object.keys(this.Division.getDivision).includes("products")) ? this.Division.getDivision.products : [];
            for (let product of products) {
                let myprod = this.c.getProduct(this.Division.name, product).cityData[this.name][1];
                if (myprod < 10) {
                    myprod = 10;
                }
                sizes[1] += productSize * myprod;
                sizes[2] += productSize * this.c.getProduct(this.Division.name, product).cityData[this.name][0];
                for (let material of Object.keys(this.industryData.requiredMaterials)) {
                    sizes[0] += myprod * this.c.getMaterialData(material).size * this.industryData.requiredMaterials[material];
                    if (!"AI Cores", ["Hardware", "Real Estate", "Robots"].includes(material))
                        sizes[2] += this.c.getMaterialData(material).size * this.c.getMaterial(this.Division.name, this.name, material).qty;
                }
            }
            let targetsize = this.c.getWarehouse(this.Division.name, this.name).size - (sizes[0] > sizes[1] ? sizes[0] : sizes[1]) - sizes[2];
            let sizecheck = this.optimize(targetsize / [.50, .70, .55, .57, .57, .57][this.round]);
            if (sizecheck[2] > this.c.getMaterial(this.Division.name, this.name, "Real Estate").qty) {
                await this.warehouseFF(targetsize, true);
            } else {
                if (this.c.getWarehouse(this.Division.name, this.name).sizeUse > this.c.getWarehouse(this.Division.name, this.name).size * .95) {
                    if (this.funds > this.c.getUpgradeWarehouseCost(this.Division.name, this.name)) {
                        this.c.upgradeWarehouse(this.Division.name, this.name);
                    }
                }
            }
            while (this.c.getCorporation().state == "SALE")
                await this.ns.asleep(1000);
        }
    }
    async coffeeparty() {
        while (true) {
            while (this.c.getCorporation().state != "START") {
                await this.ns.asleep(400);
            }
            if (this.getOffice.employees > 0) {
                if (this.getOffice.avgEne < minEnergy && this.getOffice.employees * this.c.getConstants().coffeeCostPerEmployee < this.funds) {
                    this.c.buyCoffee(this.Division.name, this.name);
                }
                if ((this.getOffice.avgHap < minHappy || this.getOffice.avgMor < minMorale) && this.getOffice.employees * this.c.getConstants().coffeeCostPerEmployee < this.funds) {
                    this.c.throwParty(this.Division.name, this.name, this.c.getConstants().coffeeCostPerEmployee);
                }
            }
            while (this.c.getCorporation().state == "START") {
                await this.ns.asleep(400);
            }
        }
    }
    async Exporty() {
        while (!this.c.hasUnlockUpgrade("Export"))
            await this.WaitOneLoop();
        while (true) {
            while (this.c.getCorporation().state != "SALE") {
                await this.ns.asleep(100);
            }
            let providers = {};
            for (let material of Object.keys(this.industryData.requiredMaterials)) {
                if (!Object.keys(providers).includes(material))
                    providers[material] = this.c.getConstants().industryNames.map(x => [x, this.c.getIndustryData(x)]).filter(x => Object.keys(x[1]).includes("producedMaterials")).map(x => [x[0], x[1].producedMaterials]).filter(x => x[1].includes(material)).map(x => x[0]).flat().map(x => this.c.getCorporation().divisions.filter(y => this.c.getDivision(y).type == x)).flat();
                if (providers[material].length > 0) {
                    let needed = 0;
                    if (this.c.getIndustryData(type).producedMaterials) {
                        for (let outputmat of this.industryData.producedMaterials) {
                            needed += (this.c.getMaterial(divname, city, outputmat).prod) * this.c.getIndustryData(type).requiredMaterials[material];
                        }
                    }
                    if (this.Division.getDivision.products) {
                        for (let product of this.getDivision.products.filter(x => this.c.getProduct(this.Division.name, x).developmentProgress >= 100)) {
                            needed += (this.c.getProduct(this.Division.name, product).cityData[city][1]) * this.industryData.requiredMaterials[material];
                        }
                    }
                    try {
                        needed = [0, Math.floor(needed - this.c.getMaterial(this.Division.name, this.name, material).qty / 10 / (providers[material].length))].reduce((a, b) => a > b ? a : b);
                        for (let provider of providers[material]) {
                            if (this.c.getDivision(provider).cities.includes(this.name)) {
                                let currentExports = this.c.getMaterial(provider, this.name, material).exp.filter(x => (x.loc == this.name) && (x.div == this.Division.name));
                                currentExports.map(x => this.c.cancelExportMaterial(provider, this.name, this.Division.name, this.name, material, x.amt));
                                if (needed > 0) {
                                    this.c.exportMaterial(provider, this.name, this.Division.name, this.name, material, needed);
                                }
                            }
                        }
                    } catch { }
                }
            }
            while (this.c.getCorporation().state == "SALE") {
                await this.ns.asleep(100);
            }
        }
    }
}

class Division extends CorpBaseClass {
    constructor(ns, Corp, industry, settings = {}) {
        super(ns, settings);
        this.Corp = Corp;
        this.industry = industry;
        this.citiesObj = {};
        this.lastProduct = 2e9 / 1.1;
    }
    get name() {
        return this.c.getCorporation().divisions.map(div => [div, this.c.getDivision(div).type]).filter(x => x[1] == this.industry)[0][0];
    }
    get cities() {
        return Object.values(this.citiesObj);
    }
    get industryData() {
        return this.c.getIndustryData(this.industry);
    }
    get Aevum() {
        return this.citiesObj['Aevum'];
    }
    get Chongqing() {
        return this.citiesObj['Chongqing'];
    }
    get Ishima() {
        return this.citiesObj['Ishima'];
    }
    get ['New Tokyo']() {
        return this.citiesObj['New Tokyo'];
    }
    get ['Sector-12']() {
        return this.citiesObj['Sector-12'];
    }
    get Volhaven() {
        return this.citiesObj['Volhaven'];
    }
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
    }
    get getDivision() {
        return this.c.getDivision(this.name);
    }
    async Start() {
        while (this.c.getCorporation().divisions.map(div => [div, this.c.getDivision(div).type]).filter(x => x[1] == this.industry).length == 0) {
            if (this.c.getIndustryData(this.industry).startingCost <= this.funds) {
                this.c.expandIndustry(this.industry, Object.keys(this.settings).includes("name") ? this.settings["name"] : Object.keys(divisionNames).includes(this.industry) ? divisionNames[this.industry] : this.industry);
            } else {
                await this.WaitOneLoop();
            }
        }
        this.Cities.map(city => this.citiesObj[city] = new City(this.ns, this.Corp, this, city, this.settings));
        await Promise.all(this.cities.map(city => city.Start()));
        this.HQ = this.citiesObj[HQ];
        let makesMaterials = Object.keys(this.industryData).includes("producedMaterials");
        let makesProducts = Object.keys(this.industryData).includes("product");
        if (this.settings.scam && makesMaterials) {
            this.Scam();
        } else {
            (makesMaterials && makesProducts) ? this.Simple().then(this.Product()) : makesProducts ? this.Product() : this.Simple();
        }
    }
    async Advert(toLevel = 1) {
        while (this.c.getHireAdVertCount(this.name) < toLevel) {
            if (this.getDivision.awareness + this.getDivision.popularity > 1e300)
                return;
            if (this.funds >= this.c.getHireAdVertCost(this.name)) {
                this.c.hireAdVert(this.name);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async getHappy() {
        while (!this.c.getCorporation().divisions.map(x => this.c.getDivision(x).type).includes(this.industry)) {
            await this.WaitOneLoop();
        }
        let promises = this.cities.map(city => city.getHappy());
        await Promise.all(promises);
    }
    async Simple() {
        var cmdlineargs = this.ns.flags(cmdlineflags);
        while (!(this.c.getCorporation().divisions.map(x => this.c.getDivision(x)).map(x => x.type).includes(this.industry))) {
            await this.WaitOneLoop();
        }
        this.Research(["Hi-Tech R&D Laboratory"]).then(this.Research(["Market-TA.I", "Market-TA.II"]));
        this.Pricing();
        await Promise.all(this.cities.map(city => city.enableSmartSupply()));
        let promises = [];
        // Get Employees
        this.cities.map(city => promises.push(city.Hire({ "Operations": 1, "Engineer": 1, "Business": 1 })));
        // Buy 1 advert
        promises.push(this.Advert(cmdlineargs['jakobag'] ? 2 : 1));
        if (cmdlineargs['jakobag']) {
            promises.push(this.Corp.GetUpgrade("Smart Storage", 3));
            this.cities.map(city => promises.push(city.upgradeWarehouseLevel(5)));
        } else {
            this.cities.map(city => promises.push(city.upgradeWarehouseLevel(3)));
            for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants", "Smart Factories"]) {
                promises.push(this.Corp.GetUpgrade(upgrade, 2));
            }
        }
        // Upgrade Each City's Storage to 300
        // Set produced materials to be sold
        this.industryData.producedMaterials.map(material => this.cities.map(city => city.sellMaterial(material)));
        if (this.round <= 1) {
            await this.getHappy();
        }
        await Promise.all(promises); promises = [];
        if (this.round <= 1) {
            await this.getHappy();
        }
        // Adjust Warehouses
        if (this.round == 1 || this.round == 3 || this.c.getMaterial(this.name, HQ, "AI Cores").qty==0 || this.c.getMaterial(this.name, HQ, "Hardware").qty==0 || this.c.getMaterial(this.name, HQ, "Real Estate").qty==0 || this.c.getMaterial(this.name, HQ, "Robots").qty==0)
            await Promise.all(this.cities.map(city => city.warehouseFF()));
        while (this.round <= 1) {
            await this.WaitOneLoop();
        }
        // Get Employees
        let redo = false;
        if (this.getDivision.research < 2 || this.cities.map(city => city.getOffice.size).reduce((a, b) => a > b ? b : a) < 9) {
            redo = true;
            this.cities.map(city => promises.push(city.Hire({ "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 })))
        } else {
            this.cities.map(city => promises.push(city.Hire({ "Operations": 3, "Engineer": 2, "Business": 2, "Management": 2, "Research & Development": 0 })))
        }
        // Get Upgrades
        promises.push(this.Corp.GetUpgrade("Smart Factories", Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        promises.push(this.Corp.GetUpgrade("Smart Storage", Math.ceil(10* this.ns.getBitNodeMultipliers().CorporationValuation)));
        for (let i = 1 ; i <= Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation) ; i++) {
            this.cities.map(city => promises.push(city.upgradeWarehouseLevel(i)));
        }
        if (redo) {
            while (this.getDivision.research < 2) {
                await this.WaitOneLoop();
            }
        }
        await Promise.all(promises); promises = [];
        if (this.round >= 2) {
            promises.push(this.Corp.GetUpgrade("Smart Factories", 10));
            promises.push(this.Corp.GetUpgrade("Smart Storage", 10));
            this.cities.map(city => promises.push(city.Hire({ "Operations": 3, "Engineer": 2, "Business": 2, "Management": 2, "Research & Development": 0 })))
            for (let i = 1 ; i <= 10 ; i++) {
                this.cities.map(city => promises.push(city.upgradeWarehouseLevel(i)));
            }
            }
        if (this.round <= 2) {
            await this.getHappy();
            await Promise.all(promises); promises = [];
            await this.getHappy();
        }
        // Adjust Warehouses
        if (this.round == 2)
            await Promise.all(this.cities.map(city => city.warehouseFF()));
        while (this.round <= 2) {
            await this.WaitOneLoop();
        }
        // Upgrade Each City's Storage to 3800
        for (let i = 1 ; i <= 19 ; i++) {
            this.cities.map(city => promises.push(city.upgradeWarehouseLevel(i)));
        }
        await Promise.all(promises); promises = [];
        this.cities.map(city => city.MaintainWarehouse());
        return true;
    }
    async Product() {
        this.Research(["Hi-Tech R&D Laboratory"]).then(this.Research(["Market-TA.I", "Market-TA.II"]));
        var cmdlineargs = this.ns.flags(cmdlineflags);
        this.Pricing();
        await this.enableSmartSupply();
        let promises = [];
        // Get Employees
        this.cities.map(city => promises.push(city.Hire(city.name == HQ ? { "Operations": 8, "Engineer": 9, "Business": 5, "Management": 8 } : { "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 })));
        // Buy 1 advert
        promises.push(this.Advert(cmdlineargs['jakobag'] ? 2 : 1));
        await Promise.all(promises);
        promises = [];
        this.Products();
        for (let upgrade of ["DreamSense"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        }
        for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, Math.ceil(20 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        }
        for (let upgrade of ["Project Insight"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        }
        while (this.getDivision.products.length == 0) {
            await this.WaitOneLoop();
        }
        await Promise.all(promises);
        this.MaintainWarehouse();
        for (let upgrade of ["DreamSense"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, 10));
        }
        while (true) {
            if (this.c.getUpgradeLevelCost("Wilson Analytics") <= this.funds) {
                this.c.levelUpgrade("Wilson Analytics");
            } else {
                if (this.c.getOfficeSizeUpgradeCost(this.name, HQ, 15) <= this.funds) {
                    let size = this.c.getOffice(this.name, HQ).size + 15;
                    let main = Math.floor(size / 3.5);
                    let bus = size - 3 * main;
                    await this.HQ.Hire({ "Operations": main, "Engineer": main, "Business": bus, "Management": main });
                }
                else {
                    if (this.c.getUpgradeLevel("Wilson Analytics") >= (10 * this.ns.getBitNodeMultipliers().CorporationValuation) && this.c.getHireAdVertCost(this.name) <= this.funds && this.getDivision.awareness + this.getDivision.popularity < 1e300) {
                        this.c.hireAdVert(this.name);
                    } else {
                        let didSomething = this.cities.map(city => city.officeSize + 60 < this.HQ.officeSize);
                        for (let city of this.getDivision.cities) {
                            if (this.c.getOffice(this.name, city).size + 60 < this.c.getOffice(this.name, HQ).size) {
                                if (this.c.getOfficeSizeUpgradeCost(this.name, city, 3) <= this.funds) {
                                    await this[city].Hire({ "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": this.c.getOffice(this.name, city).size - 1 });
                                    didSomething = true;
                                }
                            }
                        }
                        if (!didSomething) {
                            for (let upgrade of ["Smart Factories", "Project Insight", "Smart Storage"]) {
                                if (this.c.getUpgradeLevel(upgrade) < this.c.getUpgradeLevel("Wilson Analytics") && this.c.getLevelUpgradeCost(upgrade) < this.funds && (this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                                    this.c.levelUpgrade(upgrade);
                                }
                            }
                            for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants"]) {
                                if (this.c.getUpgradeLevel(upgrade) / 2 < this.c.getUpgradeLevel("Wilson Analytics") && this.c.getLevelUpgradeCost(upgrade) < this.funds && (this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                                    this.c.levelUpgrade(upgrade);
                                }
                            }
                            await this.WaitOneLoop();
                        }
                    }
                }
            }
            await this.ns.asleep(0);
        }
    }
    async Scam() {
        while (Object.keys(this.cities).length < 6) {
            await this.ns.asleep(0);
        }
        // this.c.unlockUpgrade("Export");

        // Get Upgrades
        let promises = [];
        await Promise.all(this.cities.map(city => city.Hire({"Research & Development": [3,3,9,9,9,9][this.round]})));
        for (let i = 0 ; i <= 1 ; i+=.25) {
            this.Corp.GetUpgrade("Smart Storage", Math.ceil(i * [8,8,23,23,23,23][this.round]));
            this.Corp.GetUpgrade("Speech Processor Implants", Math.ceil(i * [0,0,15,15,15,15][this.round]));
            this.Corp.GetUpgrade("Smart Factories", Math.ceil(i * [7,7,36,36,36,36][this.round]));
            ["Nuoptimal Nootropic Injector Implants", "Speech Processor Implants", "Neural Accelerators", "FocusWires"]
                .map(upgrade => this.Corp.GetUpgrade(upgrade, Math.ceil(i * [0,0,10,10,10,10][this.round])));
            this.Advert(Math.ceil(i * [3,3,21,21,21,21][this.round]));
            this.Corp.GetUpgrade("Project Insight", Math.ceil(i * [0,0,10,10,10,10][this.round]));
            this.Corp.GetUpgrade("ABC SalesBots", Math.ceil(i * [0,0,15,15,15,15][this.round]));
            this.Corp.GetUpgrade("Wilson Analytics", Math.ceil(i * [0,0,5,5,5,5][this.round]));
            this.cities.map(city => city.upgradeWarehouseLevel(Math.ceil(i * [7,7,27,27,27,27][this.round])));
        }
        this.ns.tprint("Got Upgrades")

        if (this.round >= 2) {
            await this.ns.asleep(0);
            for (let shell of this.c.getConstants().industryNames
                .filter(industry => !this.c.getCorporation().divisions
                    .map(division => this.c.getDivision(division).type).includes(industry)
                )
                .sort((a, b) => this.c.getIndustryData(a).startingCost - this.c.getIndustryData(b).startingCost)) {
                if (this.c.getIndustryData(shell).startingCost <= this.funds) {
                    this.c.expandIndustry(shell, shell + " Shell");
                }
            }
            for (let i = 0 ; i <= 100 ; i += 1) {
                this.cities.map(city => city.upgradeWarehouseLevel(Math.ceil(i)));
            }
        }

        // Choose Output Material For Each City
        let outputMat = {};
        this.cities.map(city => outputMat[city.name] = this.industryData.producedMaterials.map(material => [material, this.c.getMaterial(this.name, city.name, material).cost / this.c.getMaterialData(material).size]).reduce((a, b) => a[1] > b[1] ? a : b)[0]);
        // If this is the second pass for an industry, need to disable the sell from earlier
        this.cities.map(city => this.c.sellMaterial(this.name, city.name, outputMat[city.name], 0, "MP"));
        this.ns.tprint(outputMat)
        this.ns.tprint("Chose Output Mat")
        
        // Get Happy
        await this.getHappy();
        this.ns.tprint("Am happy")

        // Buy Mats
        this.cities.map(city => this.c.buyMaterial(this.name, city.name, outputMat[city.name], (this.c.getWarehouse(this.name, city.name).size - this.c.getWarehouse(this.name, city.name).sizeUsed - 1)/10/this.c.getMaterialData(outputMat[city.name]).size));
        Object.keys(this.industryData.requiredMaterials).map(material => this.cities.map(city => this.c.buyMaterial(this.name, city.name, material, .0001)));
        this.ns.tprint("Buying mats")
        await this.WaitOneLoop();
        this.cities.map(city => this.c.buyMaterial(this.name, city.name, outputMat[city.name], 0));
        Object.keys(this.industryData.requiredMaterials).map(material => this.cities.map(city => this.c.buyMaterial(this.name, city.name, material, 0)));
        this.ns.tprint("Bought mats")

        // Make a Thing
        await Promise.all(this.cities.map(city => city.Hire({"Engineer": [3,3,9,27,81,343][this.round]})));
        await this.WaitOneLoop();
        this.ns.tprint("Made a thing")

        // Sell All The Things
        while (this.c.getCorporation().state != "START") {
            await this.ns.asleep(0);
        }
        await Promise.all(this.cities.map(city => city.Hire({"Business": [3,3,9,27,81,343][this.round]})));
        this.cities.map(city => this.c.sellMaterial(this.name, city.name, outputMat[city.name], "MAX", "MP"))

        // Wait 5 rounds and then accept the offer
        for (let i = 0 ; i < 5 ; i++) {
            this.ns.tprint(i, " ", this.c.getInvestmentOffer());
            await this.WaitOneLoop();
        }
        this.ns.tprint(5, " ", this.c.getInvestmentOffer());
        this.c.acceptInvestmentOffer();
    }
    async Pricing() {
        this.cities.map(city => city.Pricing());
    }
    async enableSmartSupply() {
        await Promise.all(this.cities.map(city => city.enableSmartSupply()));
    }
    async WaitOneLoop() {
        await this.Corp.WaitOneLoop();
    }
    async Research(queue) {
        while (queue.map(x => this.c.hasResearched(this.name, x)).reduce((a, b) => a && b) == false) {
            let cost = queue.filter(x => !this.c.hasResearched(this.name, x)).map(x => this.c.getResearchCost(this.name, x)).reduce((a, b) => a + b, 0) * 2;
            if (this.getDivision.research >= cost) {
                for (let item of queue) {
                    this.c.research(this.name, item);
                }
            }
            await this.WaitOneLoop();
        }
    }
    async Products() {
        let currentProducts = this.getDivision.products;
        if (currentProducts.length == 0) {
            while (this.funds < 2e9) {
                await this.WaitOneLoop();
            }
            this.c.makeProduct(this.name, HQ, productNames[this.industry][0], 1e9, 1e9);
            this.lastProductPrice = 2e9;
        }
        while (true) {
            while (this.c.getProduct(this.name, this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                await this.WaitOneLoop();
            }
            if (this.getDivision.products.length == 3 + this.c.hasResearched(this.name, "uPgrade: Capacity.I") + this.c.hasResearched(this.name, "uPgrade: Capacity.II")) {
                let qlts = [];
                for (let product of this.getDivision.products) {
                    qlts.push([this.c.getProduct(this.name, product).qlt, product]);
                }
                qlts = qlts.sort((a, b) => -a[0] + b[0]);
                while (this.funds < this.lastProduct) {
                    await this.WaitOneLoop();
                }
                try {
                    delete this.pricing[qlts[0][1]];
                } catch { }
                this.c.discontinueProduct(this.name, qlts[0][1]);
            }
            while (this.funds < this.lastProduct) {
                await this.WaitOneLoop();
            }
            this.lastProduct = this.funds * 1.1;
            let done = false;
            while (!done) {
                try {
                    this.c.makeProduct(this.name, HQ, productNames[this.industry].filter(x => !this.getDivision.products.includes(x))[0], Math.floor(this.funds / 2.1), Math.floor(this.funds / 2.1));
                    done = true;
                } catch {
                    await this.WaitOneLoop();
                }
            }
            await this.WaitOneLoop();
        }
    }
    async MaintainWarehouse() {
        this.cities.map(city => city.MaintainWarehouse);
    }
}

export class Corporation extends CorpBaseClass {
    constructor(ns, settings = {}) {
        super(ns, settings);
        this.started = false;
        this.divisionsObj = {}
    }
    get name() {
        return this.c.getCorporation().name;
    }
    get Agriculture() {
        return this.divisionsObj['Agriculture'];
    }
    get Chemical() {
        return this.divisionsObj['Chemical'];
    }
    get ['Computer Hardware']() {
        return this.divisionsObj['Computer Hardware'];
    }
    get Energy() {
        return this.divisionsObj['Energy'];
    }
    get Fishing() {
        return this.divisionsObj['Fishing'];
    }
    get Food() {
        return this.divisionsObj['Food'];
    }
    get Healthcare() {
        return this.divisionsObj['Healthcare'];
    }
    get Mining() {
        return this.divisionsObj['Mining'];
    }
    get Pharmaceutical() {
        return this.divisionsObj['Pharmaceutical'];
    }
    get ['Real Estate']() {
        return this.divisionsObj['Real Estate'];
    }
    get Robotics() {
        return this.divisionsObj['Robotics'];
    }
    get Software() {
        return this.divisionsObj['Software'];
    }
    get Tobacco() {
        return this.divisionsObj['Tobacco'];
    }
    get ['Water Utilities']() {
        return this.divisionsObj['Water Utilities'];
    }
    async Start() {
        while ([undefined, false].includes(this.c.hasCorporation())) {
            try {
                this.c.createCorporation(settings.includes("name") ? settings.name : "jeekCo", this.ns.getPlayer().bitNodeN == 3 ? false : true);
                await this.ns.asleep(0);
            } catch {
                await this.ns.asleep(60000);
            }
        }
        await this.ns.asleep(1);
        this.divisionsObj = {};
        this.c.getCorporation().divisions.map(divname => Object({ "name": divname, "type": this.c.getDivision(divname).type })).map(x => this.divisionsObj[x.type] = new Division(this.ns, this, x.type, x.name, this.settings));
        if (!Object.keys(this.settings).includes("scam")) {
            Object.values(this.divisionsObj).map(x => x.Start());
        } else {
            if (Object.keys(this.divisionsObj).includes("Food")) {
                this.divisionsObj["Food"].Start();
            } else {
                if (Object.keys(this.divisionsObj).includes("Real Estate")) {
                    this.divisionsObj["Real Estate"].Start();
                } else {
                    if (Object.keys(this.divisionsObj).includes("Software")) {
                        this.divisionsObj["Software"].Start();
                    }
                }
            }
        }
        this.started = true;
        this.ns.toast("Corporation started.");
        this.Continue();
    }
    async Continue() {
        if (!Object.keys(this.settings).includes("scam") || this.settings.scam == false) {
            for (let i = 1; i <= 4; i++) {
                while (this.round == i && this.c.getInvestmentOffer().funds < (Object.keys(this.settings).includes("baseOffers") ? this.settings['baseOffers'][i - 1] : baseOffers[i - 1]) * this.ns.getBitNodeMultipliers().CorporationValuation) {
                    await this.WaitOneLoop();
                }
                if (this.round == i) {
                    this.ns.tprint("Ding! " + i.toString());
                    this.c.acceptInvestmentOffer();
                }
            }
            if (!this.c.getCorporation().public)
                this.c.goPublic(0);
        }
        while (this.round < 5)
            await this.WaitOneLoop();
        this.c.issueDividends(1);
        while (this.funds < 1e21)
            await this.WaitOneLoop();
        this.c.getConstants().unlockNames.map(unlock => this.c.hasUnlockUpgrade(unlock) ? true : this.c.unlockUpgrade(unlock));
    }
    async StartDivision(industry, settings = {}) {
        if (!Object.keys(this.divisionsObj).includes(industry)) {
            this.divisionsObj[industry] = new Division(this.ns, this, industry, settings);
            this.divisionsObj[industry].Start();
        } else {
            if (Object.keys(this.settings).includes("scam")) {
                this.divisionsObj[industry].Start();
            }
        }
    }
    async GetUpgrade(upgrade, level = 1) {
        while (this.c.getUpgradeLevel(upgrade) < level) {
            while (this.c.getUpgradeLevel(upgrade) < level && this.c.getUpgradeLevelCost(upgrade) <= this.funds) {
                this.c.levelUpgrade(upgrade);
            }
            if (this.c.getUpgradeLevel(upgrade) < level) {
                await this.WaitOneLoop();
            }
        }
    }
}

export async function main(ns) {
    var cmdlineargs = ns.flags(cmdlineflags);
    let settings = {"name": "jeek Heavy Industries"};
    if (cmdlineargs['scam']) {
        settings['scam'] = true;
    }
    let Corp = new Corporation(ns, settings);
    Corp.Start();
    await ns.asleep(1000);
    while (Corp.started == false) {
        ns.toast("Corporation not started yet.")
        await ns.asleep(60000);
    }
    if (cmdlineargs['scam']) {
        if (Corp.round == 1)
            Corp.StartDivision("Software", { "scam": true })
        while (Corp.round < 2) {
            await ns.asleep(0);
        }
        if (Corp.round == 2)
            Corp.StartDivision(Corp.funds < 680e9 ? "Software" : "Real Estate", { "scam": true })
        while (Corp.round < 3) {
            await ns.asleep(0);
        }
        if (Corp.round == 3)
            Corp.StartDivision("Real Estate", { "scam": true })
        while (Corp.round < 4) {
            await ns.asleep(0);
        }
        Corp.StartDivision("Food", { "name": "jeek Heaviest Industries" });
    } else {
        Corp.StartDivision("Agriculture", { "name": "jeek Heavier Industries" });
        while (Corp.round < 3) {
            await ns.asleep(10000);
        }
        Corp.StartDivision("Tobacco", { "name": "jeek Heaviest Industries" });
    }
    while (true) {
        await ns.asleep(10000);
    }
}