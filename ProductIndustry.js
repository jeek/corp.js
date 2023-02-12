import { Division } from "Division.js";

class ProductIndustry extends Division {
    constructor(ns, Corp, industry, settings = {}) {
        super(ns, Corp, industry, settings);
        if (!Object.keys(this.settings).includes("productNames")) {
            this.settings.productNames = ["A","B","C","D","E"].map(x => this.industry + " " + x);
        }
    }
    async Products() {
        let currentProducts = this.getDivision.products;
        if (currentProducts.length == 0) {
            while (this.funds < 2e9) {
                await this.WaitOneLoop();
            }
            this.c.makeProduct(this.name, this.HQ, this.settings.productNames[0], 1e9, 1e9);
            this.lastProductPrice = 2e9;
        }
        while (true) {
            while (this.c.getProduct(this.name, "Sector-12", this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                await this.WaitOneLoop();
            }
            this.cities.map(city =>
                (Object.keys(city.w.pricing).includes(this.c.getProduct(this.name, city.name, this.getDivision.products[this.getDivision.products.length - 1]))) ?
                    delete city.w.pricing[this.c.getProduct(this.name, city.name, this.getDivision.products[this.getDivision.products.length - 1])] : 0 )
            if (this.getDivision.products.length == 3 + this.c.hasResearched(this.name, "uPgrade: Capacity.I") + this.c.hasResearched(this.name, "uPgrade: Capacity.II")) {
                let rats = [];
                for (let product of this.getDivision.products) {
                    rats.push([this.c.getProduct(this.name, "Sector-12", product).rat, product]);
                }
                rats = rats.sort((a, b) => -a[0] + b[0]);
                while (this.funds < this.lastProduct) {
                    await this.WaitOneLoop();
                }
                try {
                    delete this.pricing[rats[0][1]];
                } catch { }
                this.c.discontinueProduct(this.name, rats[0][1]);
            }
            while (this.funds < this.lastProduct) {
                await this.WaitOneLoop();
            }
            this.lastProduct = this.funds * 1.1;
            let done = false;
            while (!done) {
                try {
                    this.c.makeProduct(this.name, this.HQ, this.settings.productNames.filter(x => !this.getDivision.products.includes(x))[0], Math.floor(this.funds / 2.1), Math.floor(this.funds / 2.1));
                    done = true;
                } catch {
                    await this.WaitOneLoop();
                }
            }
            await this.WaitOneLoop();
        }
    }
}