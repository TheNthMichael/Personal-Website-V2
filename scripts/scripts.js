const githubBaseUrl = "https://api.github.com/users/thenthmichael/";
const reposRelativeUrl = "repos?perpage=100|egrep";


/**
 * Returns a list of projects from the github api url.
 * @param {*} url The github api url to my users public repos.
 * @returns 
 */
 const GetRepoData = async (url) => {
    try {
        const response = await fetch(url, { mode: 'cors'});
        var results = await response.json();
        results = results.filter(element => element.owner.login.toLowerCase() === "thenthmichael"
        && element.fork === false);
        results = results.map( (element) => {

        // Check the homepage for links to images.
        if (element.homepage != null) {
            let images = element.homepage.split(';');
            element.projectDisplayImage = images[Math.floor(Math.random() * images.length)];
        }
        else {
            element.projectDisplayImage = "../../../assets/test.png";
        }
        element.name = element.name.replace(/-/g, " ");
        return element
        });
        
        return results;
    }
    catch (error) {
        console.log(error);
        return [];
    }
}


/**
 * Create a list of unique languages that the projects use.
 * @param {*} repoData A list of projects.
 * @returns A list of strings representing languages used.
 */
 const GetLanguagesFromRepo = (repoData) => {
    // Get a list of languages used.
    var languages = repoData.map((element) => element.language);
    languages = [...new Set(languages)];
    languages = languages.map( (e) => {
        if (e === null) {
            return "Unclassified";
        } else {
            return e;
        }
    });

    // Add this to the top since these will become buttons that when pressed send their name to a function.
    languages.unshift("Show All");

    return languages;
}


/**
 * Splits the array of projects into pages with elementsPerPage per page.
 * @param {*} allElements The list of all projects.
 * @param {*} languageFilter An array of languages that the projects must have or if empty will include all projects.
 * @param {*} elementsPerPage The number of projects per page.
 * @returns An array of arrays where each inner array contains at most elementsPerPage of projects.
 */
 const SplitProjectsIntoPages = (allElements, languageFilter, elementsPerPage) => {
    let filteredElements = allElements.filter( (e) => languageFilter.includes(e.language) || languageFilter.length === 0);
    let result = [];
    for (let i = 0; i < filteredElements.length; i += elementsPerPage) {
        result.push(filteredElements.slice(i, i + elementsPerPage));
    }

    console.log(result);
    return result;
};