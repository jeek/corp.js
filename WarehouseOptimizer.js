class WarehouseOptimizer {
    constructor(ai, hw, re, rob, ns) {
        this.mults = [ai, hw, re, rob];
        this.ns = ns;
        this.sizes = [
            this.ns.corporation.getMaterialData("AI Cores").size,
            this.ns.corporation.getMaterialData("Hardware").size,
            this.ns.corporation.getMaterialData("Real Estate").size,
            this.ns.corporation.getMaterialData("Robots").size
        ]
        this.cache = {};
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
                    scores = scores.concat([[this.calc(0, 0, i / this.sizes[2], (size - i) / this.sizes[3]), i, size - i]]);
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
                    scores = scores.concat([[this.calc(i / this.sizes[0], (size - i) / this.sizes[1], 0, 0), i, size - i]]);
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
        if (!Object.keys(this.cache).includes(size)) {
            this.cache[size] = this.optimizeit(size);
        }
        return this.cache[size];
    }
    optimizeit(size) {
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
                    scores = scores.concat([[ah[0] * rr[0], i, size - i, ah[1] / this.sizes[0], ah[2] / this.sizes[1], rr[1] / this.sizes[2], rr[2] / this.sizes[3]]]);
                }
                i += divs;
            }
            scores.sort((a, b) => { return a[0] - b[0]; });
            searchmin = scores[scores.length - 1][1] - divs;
            searchmax = scores[scores.length - 1][1] + divs;
            divs *= .1;
        }
        let finalcheck = [[Math.floor(scores[scores.length - 1][3]), Math.floor(scores[scores.length - 1][4]), Math.floor(scores[scores.length - 1][5]), Math.floor(scores[scores.length - 1][6])]];
        for (let ai = finalcheck[0][0]; ai <= finalcheck[0][0] + 20 && ai * this.sizes[0] <= size; ai++) {
            for (let hw = finalcheck[0][1]; hw <= finalcheck[0][1] + 32 && ai * this.sizes[0] + hw * this.sizes[1] <= size; hw++) {
                for (let re = finalcheck[0][2]; re <= finalcheck[0][2] + 100 && ai * this.sizes[0] + hw * this.sizes[1] + re * this.sizes[2] <= size; re++) {
                    for (let rob = finalcheck[0][3]; rob <= finalcheck[0][3] + 4 && ai * this.sizes[0] + hw * this.sizes[1] + re * this.sizes[2] + rob * this.sizes[3] <= size; rob++) {
                        finalcheck.push([ai, hw, re, rob]);
                    }
                }
            }
        }
        finalcheck = finalcheck.filter(x => x[0] * this.sizes[0] + x[1] * this.sizes[1] + x[2] * this.sizes[2] + x[3] * this.sizes[3] <= size);
        finalcheck = finalcheck.sort((a, b) => this.calc(a[0], a[1], a[2], a[3]) - this.calc(b[0], b[1], b[2], b[3]));
        finalcheck[finalcheck.length - 1].push(6 * this.calc(finalcheck[finalcheck.length - 1][0], finalcheck[finalcheck.length - 1][1], finalcheck[finalcheck.length - 1][2], finalcheck[finalcheck.length - 1][3]));
        return finalcheck[finalcheck.length - 1];
    }
}