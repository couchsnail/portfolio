console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );
//   if (currentLink) {
//     // or if (currentLink !== undefined)
//     currentLink?.classList.add('current');
// }
const ARE_WE_HOME = document.documentElement.classList.contains('home');
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact'},
    { url: 'https://github.com/couchsnail', title: 'Github'},
    { url: 'resume/', title: 'Resume' },
]
let nav = document.createElement('nav');
document.body.prepend(nav);
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '/' + url;
    }
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
if ("color-scheme" in localStorage){
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
}

select.addEventListener('input', function (event) {
    console.log('Color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
});

// For the email form
let form = document.querySelector('form');
form?.addEventListener('submit', function(event) {
    event.preventDefault();
    const data = new FormData(form);
    let url = form.action + '?';
    for (let [name, value] of data) {
        url += '${encodeURIComponent(name)}=${encodeURIComponent(value)}&';
        console.log(name, value);
    }
    url = url.slice(0, -1);
    location.href = url;
});
