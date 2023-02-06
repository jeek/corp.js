import { CorpBaseClass } from "CorpBaseClass.js";

class City extends CorpBaseClass {
    constructor(ns, Corp, Division, CityName, settings={}) {
        super(ns, settings);
        this.name = CityName;
        this.Corp = Corp;
        this.Division = Division;
        if (Object.keys(this.settings).includes(CityName)) {
            for (let objKey of Object.keys(this.settings[CityName])) {
                this.settings[objKey] = this.settings[CityName][objKey];
            }
        }
        for (let cityIt of this.Cities) {
            if (Object.keys(this.settings).includes(cityIt)) {
                delete this.settings[cityIt];
            }
        }
        this.pricing = {};
        if (!Object.keys(settings).includes("minEnergy")) {
            this.settings['minEnergy'] = 98;
        }
        if (!Object.keys(settings).includes("minHappy")) {
            this.settings['minHappy'] = 98;
        }
        if (!Object.keys(settings).includes("minMorale")) {
            this.settings['minMorale'] = 98;
        }
    }
    get industryData() {
        return this.Division.industryData;
    }
    async Start() {
        while (!this.Division.getDivision.cities.includes(this.name)) {
            await this.ns.asleep(100);
            try {
                this.c.expandCity(this.Division.name, this.name);
            } catch { }
        }
        this.w = new Warehouse(this.ns, this);
        this.w.Start();
        this.o = new Office(this.ns, this);
        this.o.Start();
    }    
}