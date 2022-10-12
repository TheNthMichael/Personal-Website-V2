const githubBaseUrl = "https://api.github.com/users/thenthmichael/";
const reposRelativeUrl = "repos?perpage=100|egrep";
const projectParent = document.getElementById("projectlist");
const projectFilters = document.getElementById("projectfilters");
const showMoreBtn = document.getElementById("showMore");
let ShowAllFilter = null;
let LanguageFilters = [];
let projects = [];
let rawProjects = [];
let languages = [];
let currentFilter = new Set();
let rowsShown = 0;  // When filtering, show the amount of rows we already expanded.

/**
 * On load, populate projects and set up event listeners.
 */
window.addEventListener('DOMContentLoaded', async (event) => {

    rawProjects = await GetRepoData(githubBaseUrl + reposRelativeUrl);
    languages = GetLanguagesFromRepo(rawProjects);

    // Create the show all checkbox.
    let showAllFilterTemp = CreateLanguageFilter("Show All", CreateUniqueId(), (event) => {
        if (event.currentTarget.checked) {
            // Refresh projects with new filters.
            currentFilter.add("Show All");
        } else {
            currentFilter.delete("Show All");
        }

        // Refresh projects with new filters.
        refreshAndFilterProjects(Array.from(currentFilter)); 
    });

    projectFilters.appendChild(showAllFilterTemp);
    showAllFilter = showAllFilterTemp;

    languages.forEach(element => {
        let lfilter = CreateLanguageFilter(element, CreateUniqueId(), (event) => {
            if (event.currentTarget.checked) {
                // Disable all other filters.
                currentFilter.add(element);
            } else {
                // Re-enable all other filters.
                currentFilter.delete(element);
            }
    
            // Refresh projects with new filters.
            refreshAndFilterProjects(Array.from(currentFilter));    
        });

        projectFilters.appendChild(lfilter);
    });

    projects = SplitProjectsIntoPages(rawProjects, [], 3);  // by default, no filtering should be applied.
    await showNextRow();
});

/**
 * Removes all projects, applies the filter, then repopulates the page.
 * Could likely make this more efficient by hiding the elements instead of deleting them.
 * @param {*} filter The filter to apply to the project list. (an array of language names)
 */
const refreshAndFilterProjects = (filter) => {
    removeAllProjects();
    projects = SplitProjectsIntoPages(rawProjects, filter, 3);

    if (projects.length === 0) {
        projectParent.textContent = "Nothing to see here...";
        if (!projects.includes("d-none")) {
            showMoreBtn.classList.add("d-none");
        }
    } else {
        projectParent.textContent = "";
        if (projects.includes("d-none")) {
            showMoreBtn.classList.remove("d-none");
        }
    }

    for (let i = 0; i < rowsShown; i++) {
        showNextRow(false);
    }
 }

 /**
  * Remove all project cards from the project parent element.
  */
const removeAllProjects = () => {
    // Delete all children of project section.
    projectParent.replaceChildren();    // apparently a new way to remove/replace child elements.
};


/**
 * Show the next row of projects
 * @param {*} doIncrement whether or not the user pressed show more.
 */
const showNextRow = async (doIncrement = true) => {
    if (projects.length != 0) {
        let firstRow = projects.shift();

        for (let i = 0; i < firstRow.length; i++) {
            let element = firstRow[i];
            projectParent.appendChild(
                CreateProjectCard(element)
            );
            await new Promise(r => setTimeout(r, 200));
        }

        if (doIncrement) {
            rowsShown += 1;
        }

        if (projects.length === 0 && !projects.includes("d-none")) {
            showMoreBtn.classList.add("d-none");
        } else {
            showMoreBtn.classList.remove("d-none");
        }
    }
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
                element.image = `images/ImageMissing${GetRandomInt(1,2)}.png`;   // Pick a better "no image photo", maybe give a selection of photos to use.
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
    // languages.unshift("Show All");

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
    let filteredElements = allElements.filter( (e) => languageFilter.includes(e.language) || languageFilter.length === 0 || languageFilter.includes("Show All"));
    let result = [];
    for (let i = 0; i < filteredElements.length; i += elementsPerPage) {
        result.push(filteredElements.slice(i, i + elementsPerPage));
    }

    console.log(result);
    return result;
};


/**
 * Example of why js frameworks are good.
 * Creates a card element according to the bootstrap docs.
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
    cardImage.onerror = () => {
        cardImage.onerror=null;
        cardImage.src=`images/ImageMissing${GetRandomInt(1,2)}.png`;
    };

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


/**
 * Example of why js frameworks are good part 2.
 * Creates an inline checkbox element according to the bootstrap docs.
 * @param {*} language A string containing the language this filter represents.
 * @param {*} id A unique id for the given element.
 * @param {*} onchange A function for the event listener attached to the checkbox.
 * @returns An inline checkbox element.
 */
const CreateLanguageFilter = (language, id, onchange) => {
    // Create the base element according to bootstrap checkbox docs.
    const checkboxForm = document.createElement("DIV");
    checkboxForm.classList.add("form-check");
    checkboxForm.classList.add("form-check-inline");
    checkboxForm.style.animation = "fade-in 1s";

    // Create the checkbox
    const checkboxBox = document.createElement("input");
    checkboxBox.classList.add("form-check-input");
    checkboxBox.type = "checkbox";
    checkboxBox.id = id;
    checkboxBox.value = language;
    checkboxBox.style.animation = "fade-in 1s";
    checkboxBox.addEventListener('change', onchange);

    // Create the label
    const checkboxLabel = document.createElement("label");
    checkboxLabel.classList.add("form-check-label");
    checkboxLabel.for = id;
    checkboxLabel.textContent = language;

    checkboxForm.appendChild(checkboxBox);
    checkboxForm.appendChild(checkboxLabel);

    return checkboxForm;
};

/**
 * Creates a semi-unique id as long as I avoid the format preamble\d+
 */
let preamble = "ThisIdShouldNotBeUsed";
let index = 0;
const CreateUniqueId = () => {
    index += 1;
    return `${preamble}${index}`;
}

/**
 * Double inclusive random int function.
 * @param {*} min The min value to include in the range.
 * @param {*} max The max value to include in the range.
 * @returns A random number between min and max inclusive.
 */
function GetRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}