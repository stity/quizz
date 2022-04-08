let root = document.body;
let m = window.m;

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
        this.currentPokemon = this.pokemons.pop();
        this.currentProposition = "";
        this.rightAnswers = 0;
        this.total = this.pokemons.length;
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
        if (proposition.toLowerCase() == this.currentPokemon.name.toLowerCase())
        {
            this.rightAnswers++;
            this.nextPokemon();
        }
        else
        {
            this.currentProposition = proposition;
        }
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
    view()
    {
        console.log('quizz view', this.currentPokemon)
        return m(".container", [
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
m.mount(root, Quizz);
loadPokedex().then(p => pokedex = p);
