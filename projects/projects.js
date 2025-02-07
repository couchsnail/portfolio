import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// /* For Lab 5 */
let selectedIndex = -1;

function renderPieChart(projectsGiven) {
    d3.select('svg').selectAll('*').remove();
    d3.select('.legend').selectAll('*').remove();

    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let svg = d3.select('svg');
    newArcData.forEach((d, i) => {
        svg.append('path')
            .datum(d)
            .attr('d', arcGenerator)
            .attr('fill', colors(i))
            .attr('class', i === selectedIndex ? 'selected' : '')
            .style('cursor', 'pointer')
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;
                updateSelection(newData);
            });
    });

    let legend = d3.select('.legend');
    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', `legend-item ${idx === selectedIndex ? 'selected' : ''}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                updateSelection(newData);
            });
    });
}

// Added this function to update the selection because it wasn't working inside the renderPieChart function
function updateSelection(newData) {
    d3.selectAll('path')
        .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
    
    d3.selectAll('.legend-item')
        .attr('class', (_, idx) => `legend-item ${idx === selectedIndex ? 'selected' : ''}`);
    
    if (selectedIndex === -1) {
        renderProjects(projects, projectsContainer, 'h2');
    } else {
        let selectedYear = newData[selectedIndex].label;
        let filteredProjects = projects.filter((project) => project.year === selectedYear);
        renderProjects(filteredProjects, projectsContainer, 'h2');
    }
}

const searchInput = document.querySelector('.searchBar');

renderPieChart(projects);

searchInput.addEventListener('input', (event) => {
    let query = event.target.value.toLowerCase();
    let filteredProjects = projects.filter((project) => {
        return Object.values(project).join('\n').toLowerCase().includes(query);
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});

/* The search bar applies a filter inside the input event listener, but when
the pie chart is filtered, it does so based on only year, which doesn't take
into account the search query? To fix this I'd have to modify the search query 
event listener so that it takes into account selected year?.*/