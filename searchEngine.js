const fs = require('fs');
const starships = require('./starships_store.js');

//* INPUT
search("cruiser", starships)


//* ENGINE
function search(term, data) {
    console.log("SEARCH: ", term);
    // SEARCH FILTERS
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

    const fullSearch = dedupe([
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
    ], 'object')
    console.log("FULL SEARCH:", fullSearch)


    // console.log(
    //     "EXACT MATCH - SPECIFIC", exactMatchSpecific,
    //     "EXACT MATCH - ANY", exactMatchAny,
    //     "FUZZY MATCH - SPECIFIC", fuzzyMatchSpecific,
    //     "FUZZY MATCH - ANY", fuzzyMatchAny,
    //     "LAZY MATCH - SPECIFIC", lazyMatchSpecific,
    //     "LAZY MATCH - ANY", lazyMatchAny,
    //     "BEGIN-END MATCH - SPECIFIC", beginEndMatchSpecific,
    //     "BEGIN-END MATCH - ANY", beginEndMatchAny,
    //     "EACH-WORD EXACT MATCH - SPECIFIC", eachWordExactSpecific,
    //     "EACH-WORD EXACT MATCH - ANY", eachWordExactAny,
    //     "EACH-WORD FUZZY MATCH - EXACT", eachWordFuzzySpecific,
    //     "EACH-WORD FUZZY MATCH - ANY", eachWordFuzzyAny,
    //     "EACH-WORD BEGIN-END MATCH - EXACT", eachWordBeginEndMatchSpecific,
    //     "EACH-WORD BEGIN-END - ANY", eachWordBeginEndMatchAny,
    // );
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


//* DE-DUPLICATION
function dedupe(data, returnType='array') {
    let result = {};
    data.forEach(ship => 
        !result[ship.id] 
            ? result[ship.id] = {...ship, hitCount:1}
            : result[ship.id].hitCount++
    );
    result = Object.values(result).sort((a,b) => b.hitCount - a.hitCount)
    return returnType==='object'
        ? {resultCount:result.length || 0, result}
        : result
}