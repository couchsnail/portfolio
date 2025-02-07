import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

/* For Lab 5 */
// let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
// let rolledData = d3.rollups(
//     projects,
//     (v) => v.length,
//     (d) => d.year,
// );
// let data = rolledData.map(([year, count]) => {
//     return { value: count, label: year };
//     });

// let total = 0;
// let pie = d3.pie().value((d) => d.value);
// let arcData = pie(data);

// for (let d of data) {
//   total += d;
// }
// let angle = 0;

// for (let d of data) {
//   let endAngle = angle + (d / total) * 2 * Math.PI;
//   arcData.push({ startAngle: angle, endAngle });
//   angle = endAngle;
// }

// let sliceGenerator = d3.pie().value((d) => d.value);

// let arcs = arcData.map((d) => arcGenerator(d));
// let colors = d3.scaleOrdinal(d3.schemeTableau10);
// arcs.forEach((arc, i) => {
//     d3.select('svg')
//     .append('path')
//     .attr('d', arc)
//     .attr('fill', colors(i));
//   })

// let legend = d3.select('.legend');
// data.forEach((d, idx) => {
//     legend.append('li')
//           .attr('style', `--color:${colors(idx)}`)
//           .attr('class', 'legend-item')
//           .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
// });

// /* Search query */
// let query = '';
// let searchInput = document.querySelector('.searchBar');

// searchInput.addEventListener('change', (event) => {
//   query = event.target.value;
//   let filteredProjects = projects.filter((project) => {
//     let values = Object.values(project).join('\n').toLowerCase();
//     return values.includes(query.toLowerCase());
//   });
//   renderProjects(filteredProjects, projectsContainer, 'h2');

// });
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
            .attr('fill', colors(i));
    });

    let legend = d3.select('.legend');
    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
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
  
  
  