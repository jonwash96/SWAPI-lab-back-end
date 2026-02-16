const fs = require('fs');
const starships = require('./data/starships_store.js');
const popularity = JSON.parse(fs.readFileSync('./data/popularity.json', 'utf8'));

//* INPUT
// search("cruiser", starships)

//* SEARCH FILTERS
const filters = {
    exactMatch: (p) => exactMatch(p.term, p.data, p.type, p.returnType),
    exactMatchWordsInOrder: (p) => exactMatch(p.term, p.data, p.type, p.returnType, {mod:[fuzzySpaces]}),
    exactIncludeAll: (p) => exactMatch(p.term, p.data, p.type+'-includes', p.returnType),
    fuzzyMatch: (p) => fuzzyMatch(p.term, p.data, p.type, p.returnType),
    lazyMatch: (p) => lazyMatch(p.term, p.data, p.type, p.returnType),
    beginEndMatch: (p) => exactMatch(p.term, p.data, p.type, p.returnType, {regex:FLCharClamped}),
    matchEachWordExact: (p) => p.term.split(' ').map(word => 
        exactMatch(word, p.data, p.type, p.returnType)
    ).flat(1),
    matchEachWordFuzzy: (p) => p.term.split(' ').map(word => 
        fuzzyMatch(word, p.data, p.type, p.returnType)
    ).flat(1)
}

//* ENGINE
module.exports = function search(term, data, options) {
    if (!options?.returnType) options.returnType = null;
    console.log("SEARCH: ", term, options);
    // SEARCH FILTER PRESETS
    const exactMatchSpecific = () => exactMatch(term, data, 'specific', 'array');
    const exactMatchAny = () => exactMatch(term, data, 'any', 'array');
    // console.log(dedupe([...exactMatchSpecific(), ...exactMatchAny()], 'object'));

    const exactMatchWordsInOrderSpecific = () => exactMatch(term, data, 'specific', 'array', {mod:[fuzzySpaces]});
    const exactMatchWordsInOrderAny = () => exactMatch(term, data, 'any', 'array', {mod:[fuzzySpaces]});
    // console.log(dedupe([...exactMatchWordsInOrderSpecific(), ...exactMatchWordsInOrderAny()]));

    const exactIncludeAllSpecific = () => exactMatch(term, data, 'specific-includes', 'array');
    const exactIncludeAllAny = () => exactMatch(term, data, 'any-includes', 'array');
    // console.log(dedupe([...exactIncludeAllSpecific(), ...exactIncludeAllAny()], 'object'));
    
    const fuzzyMatchSpecific = () => fuzzyMatch(term, data, 'specific', 'array');
    const fuzzyMatchAny = () => fuzzyMatch(term, data, 'any', 'array');
    // console.log(dedupe([...fuzzyMatchSpecific(), ...fuzzyMatchAny()], 'object'));

    const lazyMatchSpecific = () => lazyMatch(term, data, 'specific', 'array');
    const lazyMatchAny = () => lazyMatch(term, data, 'any', 'array');
    // console.log(dedupe([...lazyMatchSpecific(), ...lazyMatchAny()], 'object'));
    
    const beginEndMatchSpecific = () => exactMatch(term, data, 'specific', 'array', {regex:FLCharClamped});
    const beginEndMatchAny = () => exactMatch(term, data, 'specific', 'array', {regex:FLCharClamped});
    // console.log(dedupe([...beginEndMatchSpecific(), ...beginEndMatchAny()], 'object'));
    
    const matchEachWordExactSpecific = () => term.split(' ').map(word => 
        exactMatch(word, data, 'specific', 'array')
    ).flat(1);
    const matchEachWordExactAny = () => term.split(' ').map(word => 
        exactMatch(word, data, 'any', 'array')
    ).flat(1);

    const matchEachWordFuzzySpecific = () => term.split(' ').map(word => 
        fuzzyMatch(word, data, 'specific')
    ).flat(1);
    const matchEachWordFuzzyAny = () => term.split(' ').map(word => 
        fuzzyMatch(word, data, 'any')
    ).flat(1);
    // console.log("DEDUPED RESULTS: ",dedupe([...eachWordFuzzySpecific(), ...eachWordFuzzyAny()], 'object'));

    let result;
    switch (options.block) {
        case 1: result = dedupe([
            ...exactMatchSpecific(), 
            ...exactMatchAny(),
    
            ...exactMatchWordsInOrderSpecific(), 
            ...exactMatchWordsInOrderAny(),
            ...exactIncludeAllSpecific(), 
            ...exactIncludeAllAny(),
        ], options.returnType); 
        break;
        case 2: result = dedupe([
            ...fuzzyMatchSpecific(), 
            ...fuzzyMatchAny(), 
            ...lazyMatchSpecific(), 
            ...lazyMatchAny(),
            ...beginEndMatchSpecific(), 
            ...beginEndMatchAny(),

            ...matchEachWordExactSpecific(), 
            ...matchEachWordExactAny(),
            ...matchEachWordFuzzySpecific(), 
            ...matchEachWordFuzzyAny()
        ], options.returnType); 
        break;
        case 0: result = dedupe([
            ...exactMatchSpecific(), 
            ...exactMatchAny(),

            ...exactMatchWordsInOrderSpecific(), 
            ...exactMatchWordsInOrderAny(),
            ...exactIncludeAllSpecific(), 
            ...exactIncludeAllAny(),

            ...fuzzyMatchSpecific(), 
            ...fuzzyMatchAny(), 
            ...lazyMatchSpecific(), 
            ...lazyMatchAny(),
            ...beginEndMatchSpecific(), 
            ...beginEndMatchAny(),

            ...matchEachWordExactSpecific(), 
            ...matchEachWordExactAny(),
            ...matchEachWordFuzzySpecific(), 
            ...matchEachWordFuzzyAny()
        ], options.returnType);
        break;
        case 'x': { const calls = [];
            for (let name of options.filters) {
                const filterResult = filters[name]({
                    term, data, 
                    type:options.params?.type || null,
                    returnType:options.params?.returnType || null
                });
                if (options.params?.returnType==='object-individual') filterResult['filterName'] = name;
                calls.push(...filterResult);
            };
            result = options.params?.returnType==='object-individual' 
                ? calls
                : dedupe(calls, options.params?.returnType || null, popularity)
        }; break;
        default: result = dedupe([
            ...exactMatchSpecific(),
            ...exactMatchWordsInOrderSpecific(),
            ...fuzzyMatchAny()
        ], options.returnType);
    };

    fs.writeFile('./data/popularity.json', JSON.stringify(popularity,null,2), (err) => {
        console.error(err)
    });

    return result
}


//* MODIFIERS
function fuzzySpaces(term) {return term.replaceAll(' ', '.+')};

//* ALT REGEX
function FLCharClamped(term) {
    return new RegExp(term.split(' ').map(word =>  
        "(?<=[^a-zA-Z])"+word[0]+"\\w*"+word[word.length -1]+"(?=[^a-zA-Z])"
        +"|^"+word[0]+"\\w*"+word[word.length -1]+"$"
        +"|"+word[0]+"\\w*"+word[word.length -1]+"\\W"
    ).join(' '), 'ig');
};


//* SEARCH FUNCTIONS
function exactMatch(term, data, type='specific', returnType='array', options=false) { let result;
    // console.log("@EXACT MATCH FILTER:", term, type);

    if (options.mod) term = options.mod.reduce((current,modifier) => modifier(current), term);

    const regex = options.regex
        ? (text=term) => options.regex(text)
        : (text=term) => new RegExp(text, 'ig');
    // console.log(" Regex matches term?", regex().test(term), term.match(regex()));
    switch (type) {
        case 'specific': result = data.filter(ship => 
            ship.name.match(regex()) || ship.model.match(regex()) );
        break;
        case 'any': result = data.filter(ship =>
            JSON.stringify(Object.values(ship)).match(regex()) );
        break;
        case 'specific-includes': result = data.filter( ship => 
            term.split(' ').map(word => ship.name.match(regex(word))).every(res => res != null)
            || term.split(' ').map(word => ship.model.match(regex(word))).every(res => res != null) );
        break;
        case 'any-includes': result = data.filter( ship =>
            term.split(' ').map(word => JSON.stringify(Object.values(ship)).match(regex(word))) 
                .every(res => res != null));
        break;
    }
    if (typeof popularity !== 'object') {
        console.log(popularity)
        throw new Error("ERROR! Popularity not sproperly set.")
    }
    result.forEach(ship => popularity[ship.name] ? popularity[ship.name]++ : popularity[ship.name] = 1);
    // console.log(" Exact Match Result: ", {searchTerm:term, resultCount:result?.length || 0, result});
    return returnType==='object'
        ? {searchTerm:term, resultCount:result?.length || 0, result}
        : result;
}

function fuzzyMatch(term, data, type='specific', returnType='array') { let result;
    // console.log("@FUZZY MATCH FILTER:", term, type);
    const interpolatedString = term.split('').map(char => 
        `${char}\\w*` ).join('').replace(/\\w\*$/, '');
    const regex = new RegExp(interpolatedString, 'ig');
    // console.log(" Regex matches term?", regex.test(term), term.match(regex));
    switch (type) {
        case 'specific': result = data.filter( ship => 
            ship.name.match(regex) || ship.model.match(regex) );
        break;
        case 'any': result = data.filter( ship => {
            return (Object.values(ship).filter(value => 
                typeof value==='string' && value.match(regex))).length });
        break;
    }
    // console.log(" Fuzzy Match Result: ", {searchTerm:term, resultCount:result?.length || 0, result});
    return returnType==='object'
        ? {searchTerm:term, resultCount:result?.length || 0, result}
        : result;
}

function lazyMatch(term, data, type='specific', returnType='array') { let result;
    // console.log("@LAZY MATCH FILTER:", term, type);
    const regex = new RegExp(term.split('').map(char => 
        `${char}.*`).join('').replace(/\.\*$/, ''), 'ig');
    // console.log(" Regex matches term?", regex.test(term), term.match(regex));
    switch (type) {
        case 'specific': result = data.filter( ship => 
            ship.name.match(regex) || ship.model.match(regex) );
        break;
        case 'any': result = data.filter( ship => 
            (Object.values(ship).filter(value => 
                typeof value==='string' && value.match(regex))).length );
        break;
    }
    // console.log(" Lazy Match Result: ", {searchTerm:term, resultCount:result?.length || 0, result});
    return returnType==='object'
        ? {searchTerm:term, resultCount:result?.length || 0, result}
        : result;
}


//* DE-DUPLICATION & RANKING
function dedupe(data, returnType='array', popularity={}) {
    let result = {};
    data.forEach(ship => 
        !result[ship.id] 
            ? result[ship.id] = {...ship, hitCount: 1 + (popularity[ship.id] || 0)}
            : result[ship.id].hitCount++
    );
    result = Object.values(result).sort((a,b) => b.hitCount - a.hitCount);
    return returnType==='object'
        ? {resultCount:result.length || 0, result}
        : result
}