const fs = require('fs');
const starships = require('./starships_store.js');

search("palace coruscant naboo", starships)

function search(term, data) {
    console.log("SEARCH: ", term);
    const exactMatchSpecific = () => exactMatch(term, data, 'specific', 'array');
    const exactMatchAny = () => exactMatch(term, data, 'any', 'array');
    // console.log(dedupe([...exactMatchSpecific, ...exactMatchAny], 'object'));
    
    const fuzzyMatchSpecific = () => fuzzyMatch(term, data, 'specific', 'array');
    const fuzzyMatchAny = () => fuzzyMatch(term, data, 'any', 'array');
    // console.log(dedupe([...fuzzyMatchSpecific(), ...fuzzyMatchAny()], 'object'));

    const lazyMatchSpecific = () => lazyMatch(term, data, 'specific', 'array');
    const lazyMatchAny = () => lazyMatch(term, data, 'any', 'array');
    // console.log(dedupe([...lazyMatchSpecific(), ...lazyMatchAny()], 'object'));
    
    const beginEndRegex = () => new RegExp(term.split(' ').map(word => 
        "(?<=[^a-zA-Z])"+word[0]+"\\w*"+word[word.length -1]+"(?=[^a-zA-Z])"+"|^"+word[0]+"\\w*"+word[word.length -1]+"$"+"|"+word[0]+"\\w*"+word[word.length -1]+"\\W").join(' '), 'ig');
    const beginEndMatchSpecific = () => exactMatch(term, data, 'specific', 'array', beginEndRegex());
    const beginEndMatchAny = () => exactMatch(term, data, 'specific', 'array', beginEndRegex());
    // console.log(dedupe([...beginEndMatchSpecific(), ...beginEndMatchAny()], 'object'));
    
    const eachWordExactSpecific = () => term.split(' ').map(word => 
        exactMatch(word, data, 'specific', 'array')
    ).flat(1);
    const eachWordExactAny = () => term.split(' ').map(word => 
        exactMatch(word, data, 'any', 'array')
    ).flat(1);
    // console.log("DEDUPED RESULTS: ",dedupe([...eachWordExactSpecific(), ...eachWordExactAny()], 'object'));
    // const exactMatchEachWord = (getSpecific=true, getAny=true) => {
    //     let allMatches = [];
    //     getSpecific && allMatches.push(...eachWordExactSpecific());
    //     getAny && allMatches.push(...eachWordExactAny());

    //     let matcheCountPerWord = {}
    //     allMatches.forEach(wordObj => matcheCountPerWord[wordObj.term] = wordObj.resultCount);

    //     //* Map over each word; search each word
    //     // // Then; combine dedupe each word => return to array of arrays of each word
    //     // Then; for each word/result-array, sort & grab data on results per word
    //     // And; compare the number of match arrays to the number of words (ignore "or, and, is, a, etc")
    //     // Then; sort results in order of greatest number of matches to least
    // }


    const eachWordFuzzySpecific = () => term.split(' ').map(word => 
        fuzzyMatch(word, data, 'specific')
    ).flat(1);
    const eachWordFuzzyAny = () => term.split(' ').map(word => 
        fuzzyMatch(word, data, 'any')
    ).flat(1);
    // console.log("DEDUPED RESULTS: ",dedupe([...eachWordFuzzySpecific(), ...eachWordFuzzyAny()], 'object'));

    //! This one is useless; just returns all results
    const eachWordBeginEndRegex = (word) => new RegExp(
        "(?<=[^a-zA-Z])"+word[0]+"\\w*"+word[word.length -1]+"(?=[^a-zA-Z])"+"|^"+word[0]+"\\w*"+word[word.length -1]+"$"+"|"+word[0]+"\\w*"+word[word.length -1]+"\\W", 'ig');
    const eachWordBeginEndSpecific = () => term.split(' ').map(word => 
        exactMatch(word, data, 'specific', 'array', eachWordBeginEndRegex(word))
    ).flat(1);
    const eachWordBeginEndAny = () => term.split(' ').map(word => 
        exactMatch(word, data, 'any', 'array', eachWordBeginEndRegex(word))
    ).flat(1);
    // console.log(dedupe([...eachWordBeginEndSpecific(), ...eachWordBeginEndAny()], 'object'));

    const fullSearch = dedupe([
        ...exactMatchSpecific(), 
        ...exactMatchAny(), 
        ...fuzzyMatchSpecific(), 
        ...fuzzyMatchAny(), 
        ...lazyMatchSpecific(), 
        ...lazyMatchAny(),
        ...beginEndMatchSpecific(), 
        ...beginEndMatchAny(),
        ...eachWordExactSpecific(), 
        ...eachWordExactAny(),
        ...eachWordFuzzySpecific(), 
        ...eachWordFuzzyAny()
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

function exactMatch(term, data, type='specific', returnType='array', otherRegex) { let result;
    // console.log("@EXACT MATCH FILTER:", term, type);
    const regex = otherRegex
        ? otherRegex
        : new RegExp(term, 'ig');
    // console.log(" Regex matches term?", regex.test(term), term.match(regex));
    switch (type) {
        case 'specific': result = data.filter(ship => 
            ship.name.match(regex) || ship.model.match(regex) );
        break;
        case 'any': result = data.filter(ship =>
            JSON.stringify(Object.values(ship)).match(regex) );
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
        `${char}\\w*`).join('').replace(/\\w\*$/, '');
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



function dedupe(data, returnType='array') {
    const result = data.filter((ship,index) => {
        return data.map((s,i) => s==ship && i).every(idx => {
            return typeof idx==='number' ? index <= idx : true
        })
    });
    return returnType==='object'
        ? {resultCount:result.length || 0, result}
        : result
}