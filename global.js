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
        url = '../' + url;
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
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
              <option value="auto" selected>Automatic</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
          </select>
      </label>`
  );


// Event listener for changes in the dropdown
const colorSchemeSwitcher = document.getElementById('color-scheme-switcher');

// Event listener for changes in the dropdown
document.addEventListener('DOMContentLoaded', function() {
    const colorSchemeSwitcher = document.getElementById('color-scheme-switcher');

    // Function to set the color scheme based on user selection
    function updateColorScheme(theme) {
        if (theme === 'light') {
            document.documentElement.style.colorScheme = 'light dark'; // Apply light theme
        } else if (theme === 'dark') {
            document.documentElement.style.colorScheme = 'dark light'; // Apply dark theme
        } else {
            document.documentElement.style.colorScheme = ''; // Let the system decide
        }
    }

    // Event listener for dropdown changes
    colorSchemeSwitcher.addEventListener('change', function() {
        const selectedValue = colorSchemeSwitcher.value;
        updateColorScheme(selectedValue);
    });

    // Initialize the theme when the page loads based on the dropdown
    updateColorScheme(colorSchemeSwitcher.value);
});
