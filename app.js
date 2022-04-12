let root = document.body;
let m = window.m;

class DamerauLevenshteinDistance {
 // taken from https://github.com/fabvalaaah/damerau-levenshtein-js
    static initMatrix(s1, s2) {
        /* istanbul ignore next */
        if (undefined == s1 || undefined == s2) {
            return null;
        }

        let d = [];
        for (let i = 0; i <= s1.length; i++) {
            d[i] = [];
            d[i][0] = i;
        }
        for (let j = 0; j <= s2.length; j++) {
            d[0][j] = j;
        }

        return d;
    };

    static damerau(i, j, s1, s2, d, cost) {
        if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
            d[i][j] = Math.min.apply(null, [d[i][j], d[i - 2][j - 2] + cost]);
        }
    };

    static distance(s1, s2) {
        if (
            undefined == s1 ||
            undefined == s2 ||
            "string" !== typeof s1 ||
            "string" !== typeof s2
        ) {
            return -1;
        }

        let d = DamerauLevenshteinDistance.initMatrix(s1, s2);
        /* istanbul ignore next */
        if (null === d) {
            return -1;
        }
        for (var i = 1; i <= s1.length; i++) {
            let cost;
            for (let j = 1; j <= s2.length; j++) {
                if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
                    cost = 0;
                } else {
                    cost = 1;
                }

                d[i][j] = Math.min.apply(null, [
                    d[i - 1][j] + 1,
                    d[i][j - 1] + 1,
                    d[i - 1][j - 1] + cost,
                ]);

                DamerauLevenshteinDistance.damerau(i, j, s1, s2, d, cost);
            }
        }

        return d[s1.length][s2.length];
    };
}


class Pokemon
{
    name="";
    image="";
    id = 0;
    constructor(id, name, image)
    {
        this.id = id;
        this.name = name;
        this.image = image;
    }
    copy()
    {
        return new Pokemon(this.id, this.name, this.image);
    }
}

async function createPokemonFromId(id)
{
    let pokemon_model = await (await fetch('https://pokeapi.co/api/v2/pokemon/'+id)).json();
    let pokemon_species = await (await fetch(pokemon_model.species.url)).json();
    let name = pokemon_species.names.find(n => n.language.name == "fr").name;
    let image = pokemon_model.sprites.other.dream_world.front_default;
    return new Pokemon(id, name,  image);
}

function getRandomPartition(max)
{
    let pool = Array(max).fill(0).map((_,i) => i);
    let result = [];
    while(pool.length > 0)
    {
        let index = Math.floor(pool.length*Math.random());
        let element = pool.splice(index,1)[0];
        result.push(element);
    }
    return result;
}

function randomizeArray(input)
{
    let partition = getRandomPartition(input.length);
    return partition.map(i => input[i]);
}

const globalConfig = {
    acceptTypos: true,
    acceptedTyposThreshold: 1,
    ignoreAccents: true
}


function removeAccents(source)
{
        var r=source;
        r = r.replace(new RegExp(/[àáâãäå]/g),"a");
        r = r.replace(new RegExp(/æ/g),"ae");
        r = r.replace(new RegExp(/ç/g),"c");
        r = r.replace(new RegExp(/[èéêë]/g),"e");
        r = r.replace(new RegExp(/[ìíîï]/g),"i");
        r = r.replace(new RegExp(/ñ/g),"n");                
        r = r.replace(new RegExp(/[òóôõö]/g),"o");
        r = r.replace(new RegExp(/œ/g),"oe");
        r = r.replace(new RegExp(/[ùúûü]/g),"u");
        r = r.replace(new RegExp(/[ýÿ]/g),"y");
        r = r.replace(new RegExp(/\W/g),"");
        return r;
}
function removeSpaces(source)
{
    
    return source.replace(new RegExp(/\s/g),"");
}

function replaceMaleFemaleSymbol(source)
{
    source = source.replace(new RegExp(/♀/g), ' femelle');
    source = source.replace(new RegExp(/♂/g), ' male');
    return source;
}

class CheckboxView
{
    view(vnode)
    {
        const name = vnode.attrs.name;
        let model = vnode.attrs.model;
        const label = vnode.attrs.label;
        const checked = model[name];
        return m('label',
            m('input[type=checkbox]', {
                checked,
                onchange: () => model[name] = !checked
            }),
            label
        )
    }

}

class ConfigView
{
    view()
    {
        const properties = Object.keys(globalConfig);
        const booleanProperties = properties.filter(p => typeof globalConfig[p] == 'boolean');
        return m(".container", booleanProperties.map(p => m(CheckboxView, {name:p, label:p, model:globalConfig})));
    }
}
class Viewer
{
    constructor(vnode)
    {
    }
    view(vnode)
    {
        let pokemon = vnode.attrs.pokemon;
        console.log('viewer view', pokemon);
        return m(".container",[
            m("img.pokemon-sprite", {src: pokemon?.image}),
            //m("span", pokemon?.name)
        ]);
    }
}

class Quizz
{
    constructor(vnode)
    {
        this.currentPokemon = undefined;
        this.started = false;
        this.pokemons = [];
        this.currentProposition = "";
        this.skipped = [];
    }
    start()
    {
        console.log('started');
        this.started = true;
        this.pokemons = randomizeArray(pokedex.map(p => p.copy()));
        this.total = this.pokemons.length;
        this.currentPokemon = this.pokemons.pop();
        this.currentProposition = "";
        this.rightAnswers = 0;
        document.getElementById('answer').focus();
    }
    stop()
    {
        console.log('stopped');
        this.started = false;
        this.terminate();
    }

    checkAnswer(proposition)
    {
        if (this.compareString(proposition, this.currentPokemon.name))
        {
            this.rightAnswers++;
            this.nextPokemon();
        }
        else
        {
            this.currentProposition = proposition;
        }
    }

    compareString(s1, s2)
    {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        s1 = replaceMaleFemaleSymbol(s1);
        s2 = replaceMaleFemaleSymbol(s2);
        if (globalConfig.ignoreAccents)
        {
            s1 = removeAccents(s1);
            s2 = removeAccents(s2);
        }
        if (globalConfig.acceptTypos)
        {
            if (s2.includes(s1) && s1.length < s2.length) {
                return false;
            }

            if (s1.includes(s2) && s2.length < s1.length) {
                return false;
            }
            return DamerauLevenshteinDistance.distance(s1, s2) <= globalConfig.acceptedTyposThreshold;
        }
        return s1 == s2;
    }

    nextPokemon()
    {
        this.currentProposition = "";
        if(this.pokemons.length > 0)
        {
            this.currentPokemon = this.pokemons.pop();
        }
        else if (this.skipped.length > 0)
        {
            this.pokemons = this.skipped.reverse();
            this.skipped = [];
            this.nextPokemon();
            return;
        }
        else 
        {
            this.terminate();
            this.succeed();
        }
    }
    skip()
    {
        this.skipped.push(this.currentPokemon);
        this.nextPokemon();
    }
    terminate()
    {
        this.started = false;
        this.currentPokemon = undefined;
    }
    succeed()
    {
        m.route.set('/fireworks');
    }
    view()
    {
        console.log('quizz view', this.currentPokemon)
        return m(".container", [
            m(ConfigView),
            this.started ? m("button", {onclick: () => this.stop()}, "Stop") : m("button", {onclick: () => this.start()}, "Start"),
            this.started ? m("button", {onclick: () => this.skip()}, "Skip") : null,
            this.currentPokemon ? m(Viewer, {pokemon: this.currentPokemon }): null,
            m(".container", [
                m('input[type="text"]#answer', {oninput: e => this.checkAnswer(e.target.value), value:this.currentProposition}),
                this.started ? m("span", this.rightAnswers + "/" + this.total) : null
            ])
        ]);
    }
}

function installSW() {
    if (navigator && window && 'serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('./pokeapi-js-wrapper-sw.js', { scope: './' })
                .catch(error => {
                    console.log('Pokeapi-js-wrapper SW installation failed with the following error:')
                    console.error(error)
                })
        })
    }
}
installSW();

class FireworkView
{
    constructor()
    {
        this.fireworks = undefined;
    }
    oncreate(vnode)
    {
        this.fireworks = new Fireworks(vnode.dom, { /* options */ })
        this.fireworks.start();
    }
    ondestroy(vnode)
    {
        this.fireworks.stop();
    }
    view(vnode)
    {
        return m('.fireworks');
    }
}


async function loadPokedex() {
    let promises = Array(151).fill(0).map((_,i) => createPokemonFromId(i+1));
    let pokedex = [];
    for(let p of promises)
    {
        pokedex.push(await p);
    }
    return pokedex;
}
let pokedex = [];
m.route(root, '/quizz',
{
    '/quizz': Quizz,
    '/fireworks': FireworkView
})
loadPokedex().then(p => pokedex = p);
