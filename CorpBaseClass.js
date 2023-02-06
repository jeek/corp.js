class CorpBaseClass { // Functions shared between Corporation, Division, and City
    constructor(ns, settings) {
        this.ns = ns;
        this.c = this.ns.corporation;
        this.settings = JSON.parse(JSON.stringify(settings));
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
    get HQ() {
        return this.settings["HQ"];
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