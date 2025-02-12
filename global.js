console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const ARE_WE_HOME = document.documentElement.classList.contains('home');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact'},
    { url: 'https://github.com/couchsnail', title: 'Github'},
    { url: 'resume/', title: 'Resume' },
    { url: 'meta/', title: 'Meta'}
]
let nav = document.createElement('nav');
document.body.prepend(nav);
for (let p of pages) {
    let url = p.url;
    let title = p.title;

    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
    
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    if (a.host !== location.host) {
        a.target = '_blank';
    }
    nav.append(a);
}

// For the color scheme
document.body.insertAdjacentHTML(
    "afterbegin",
    `
      <label class="color-scheme">
          Theme:
          <select id="color-scheme-switcher">
              <option value="auto" selected>Automatic</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
          </select>
      </label>`
  );
  
const select = document.querySelector('#color-scheme-switcher');
if ("colorScheme" in localStorage) {
    const savedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty("color-scheme", savedScheme);
      select.value = savedScheme;
  } else {
    select.value = "auto";
  }

select.addEventListener('input', function (event) {
    console.log('Color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
});

// Code for lab 4
export async function fetchJSON(url) {
    try {
        console.log(`Fetching JSON from: ${url}`);
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched data:", data);
        return data; 

    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
    
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error('Invalid container element:', containerElement);
        return;
    }
    containerElement.innerHTML = '';

    for(const proj of project){
        const article = document.createElement('article');
        // Handling if data is of the wrong type
        if (typeof proj.title !== 'string') {
            console.warn('Invalid project name:', project.name);
            continue;
        }
        if (typeof proj.image !== 'string') {
            console.warn('Invalid project image URL:', project.image);
            continue;
        }
        if (typeof proj.description !== 'string') {
            console.warn('Invalid project description:', project.description);
            continue;
        }
        if (typeof proj.year !== 'string') {
            console.warn('Invalid project year:', project.description);
            continue;
        }
        console.log(proj.title)

        // Defaults in case data is missing
        const imageUrl = proj.image || '../images/goomy.png';
        const projectTitle = proj.title || 'Untitled project';
        const projectDescription = proj.description || 'Lorem ipsum';
        const projectYear = proj.year || '2024';

        //create the article
        article.innerHTML = `
            <h3>${projectTitle}</h3>
            <img src="${imageUrl}" alt="${projectTitle}">
            <p>${projectDescription}</p>
            <p class="year">${projectYear}</p>
        `;
        containerElement.appendChild(article);
    }
    const projectsTitleElement = document.querySelector('.projects-title');
    if (projectsTitleElement) {
        projectsTitleElement.textContent = `${project.length} Projects`;
    }

    console.log(`Total projects rendered: ${project.length}`);
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}
