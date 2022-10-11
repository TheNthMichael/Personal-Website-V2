const githubBaseUrl = "https://api.github.com/users/thenthmichael/";
const reposRelativeUrl = "repos?perpage=100|egrep";
const projectParent = document.getElementById("projectlist");
const showMoreBtn = document.getElementById("showMore");
let projects = [];
let rawProjects = [];
let languages = [];
let rowsShown = 0;  // When filtering, show the amount of rows we already expanded.


window.addEventListener('DOMContentLoaded', async (event) => {

    rawProjects = await GetRepoData(githubBaseUrl + reposRelativeUrl);
    languages = GetLanguagesFromRepo(rawProjects);

    projects = SplitProjectsIntoPages(rawProjects, [], 3);  // by default, no filtering should be applied.
    await showNextRow();
    removeAllProjects();
});

const removeAllProjects = () => {
    // Delete all children of project section.
    projectParent.replaceChildren();    // apparently a new way to remove/replace child elements.
};

const showNextRow = async () => {
    if (projects.length != 0) {
        let firstRow = projects.shift();

        for (let i = 0; i < firstRow.length; i++) {
            let element = firstRow[i];
            projectParent.appendChild(
                CreateProjectCard(element)
            );
            await new Promise(r => setTimeout(r, 200));
        }

        rowsShown += 1;
        /*firstRow.forEach(async element => {
            Could not use this for the effect due to async not awaited each iteration.
        });*/

        if (projects.length === 0) {
            showMoreBtn.classList.add("d-none")
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get project data from github repo.
 * Call on dom load to get the list, then create cards for these element.
 * @param {*} url The github api url to my users public repos.
 * @returns a list of projects from the github api url. 
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
                element.image = images[Math.floor(Math.random() * images.length)];
            }
            else {
                element.image = "images/WesternEast.JPG";   // Pick a better "no image photo", maybe give a selection of photos to use.
            }
            element.title = element.name.replace(/-/g, " ");
            element.repoLink = element.html_url;
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


/**
 * Example of why js frameworks are good.
 * @param {*} element An object containing the project details.
 * @returns A card element filled in with the project details.
 */
const CreateProjectCard = (element) => {

    // Create the base element according to bootstrap card docs.
    const cardParent = document.createElement("DIV");
    cardParent.classList.add("card");
    cardParent.classList.add("bg-light");
    cardParent.classList.add("text-dark");
    cardParent.classList.add("shadow");
    cardParent.classList.add("p-3");
    cardParent.classList.add("rounded");
    // cardParent.classList.add("d-none");
    cardParent.classList.add("m-4");
    cardParent.style = "width: 18rem;";
    cardParent.style.animation = "fade-in 3s";

    const cardImage = document.createElement("IMG");
    cardImage.src = element.image;
    cardImage.classList.add("card-img-top");
    cardImage.alt = "project image for " + element.title;

    const cardBody = document.createElement("DIV");
    cardBody.classList.add("card-body");

    const cardTitle = document.createElement("H5");
    cardTitle.classList.add("card-title");
    cardTitle.textContent = element.title;

    const cardDescription = document.createElement("P");
    cardDescription.classList.add("card-text");
    cardDescription.textContent = element.description;

    const cardGithubLink = document.createElement("A");
    cardGithubLink.classList.add("btn");
    cardGithubLink.classList.add("btn-primary");
    cardGithubLink.href = element.repoLink;
    cardGithubLink.textContent = "View Code";

    cardParent.appendChild(cardImage);
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardDescription);
    cardBody.appendChild(cardGithubLink);

    // Certain elements may have some info indicating a web demo available, link here.
    if (element.hasOwnProperty('demoLink')) {
        const cardDemoLink = document.createElement("A");
        cardDemoLink.classList.add("btn");
        cardDemoLink.classList.add("btn-dark");
        cardDemoLink.classList.add("mx-4");
        cardDemoLink.href = element.demoLink;
        cardDemoLink.textContent = "Demo";
        cardBody.appendChild(cardDemoLink);
    }

    cardParent.appendChild(cardBody);
    return cardParent;
};

