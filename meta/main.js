let data = [];
let xScale, yScale;
let selectedCommits = [];

async function loadData() {
  data = await d3.csv('./loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  console.log(data);

  displayStats();
  createScatterPlot();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});

let commits = d3.groups(data, (d) => d.commit);

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        enumerable: true,
        configurable: false
      });

      return ret;
    });
}

function displayStats() {
  // Process commits first
  processCommits();

  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Add more stats as needed...
  const uniqueFiles = new Set(data.map((d) => d.file));
  const fileGroups = d3.groups(data, (d) => d.file);
  
  const maxFile = d3.max(fileGroups, ([, lines]) => lines.length);
  const longestFile = fileGroups.reduce((a, b) => (a[1].length > b[1].length ? a : b))[0];

  const avgFileLength = d3.mean(fileGroups, ([, lines]) => lines.length);
  const hours = data.map(d => d.date.getHours());
  const periods = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  hours.forEach(h => {
    if (h >= 5 && h < 12) periods.morning++;
    else if (h >= 12 && h < 17) periods.afternoon++;
    else if (h >= 17 && h < 21) periods.evening++;
    else periods.night++;
  });
  const mostCommonPeriod = Object.entries(periods).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

  const days = data.map(d => d.date.getDay());
  const dayCounts = d3.rollup(days, v => v.length, d => d);
  const mostCommonDay = Array.from(dayCounts.entries()).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

  dl.append('dt').text('Number of files');
  dl.append('dd').text(uniqueFiles.size);

  dl.append('dt').text('Maximum file length');
  dl.append('dd').text(maxFile);

  dl.append('dt').text('Longest file');
  dl.append('dd').text(longestFile);

  dl.append('dt').text('Average file length');
  dl.append('dd').text(avgFileLength.toFixed(2));

  dl.append('dt').text('Most active day');
  dl.append('dd').text(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][mostCommonDay]);

  dl.append('dt').text('Most active time of day');
  dl.append('dd').text(mostCommonPeriod);
}

// Scatter plot
function createScatterPlot(){
  const width = 1000;
  const height = 600;
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 30]);

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('fill', 'purple')
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots

    dots
      .selectAll('circle')
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget)
          .style('fill-opacity', 1)
          .attr('stroke', isCommitSelected(commit) ? 'gold' : 'black') // Highlight selection
          .attr('stroke-width', 2);
        updateTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event, commit) => {
        d3.select(event.currentTarget)
        .style('fill-opacity', 0.7)
        .attr('stroke', isCommitSelected(commit) ? 'gold' : 'none'); // Maintain selected outline
        updateTooltipContent({});
        updateTooltipVisibility(false);
      });

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`)
  .style('stroke-opacity', 0.3);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  brushSelector();
}

//Tooltip
function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  if (!event) {
    console.error("Event is undefined in updateTooltipPosition");
    return;
  }

  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// Brushing
function brushSelector() {
  const svg = document.querySelector('svg');
  // Create brush
  d3.select(svg).call(d3.brush());

  // Raise dots and everything after overlay
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
  d3.select(svg).call(d3.brush().on('start brush end', brushed));
}

let brushSelection = null;

function brushed(evt) {
  brushSelection = evt.selection; 

  if (!brushSelection) {
    selectedCommits = [];
  } else {
    let [min, max] = brushSelection;
    selectedCommits = commits.filter((commit) => {
      let x = xScale(commit.datetime); 
      let y = yScale(commit.hourFrac);

      return x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1];
    });
  }

  updateSelection(); 
  updateSelectionCount(); 
  updateLanguageBreakdown(); 
}

function isCommitSelected(commit) {
  return selectedCommits.some((selected) => selected.id === commit.id);
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}

// Lab 08 content
// This is supposed to be for Step 1.1
let commitProgress = 100;
let timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);

function filterCommitsByTime() {
    filteredCommits = commits.filter(d => d.datetime < commitMaxTime);
}

// // Step 1.2
// // This is supposed to updateScatterplot, but evidently it's not working
// function updateScatterplot(filteredCommits) {
//   const width = 1000;
//   const height = 600;
//   const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

//   d3.select('svg').remove(); // first clear the svg
//   const svg = d3
//     .select('#chart')
//     .append('svg')
//     .attr('viewBox', `0 0 ${width} ${height}`)
//     .style('overflow', 'visible');

//     filterCommitsByTime(); // Filter commits based on time
//     updateScatterplot(filteredCommits); // Update scatter plot dynamically

//     xScale = d3
//       .scaleTime()
//       .domain(d3.extent(filteredCommits, (d) => d.datetime))
//       .range([0, width])
//       .nice();

//     yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
//     svg.selectAll('g').remove(); // clear the scatters in order to re-draw the filtered ones
//     const dots = svg.append('g').attr('class', 'dots');

//     const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
//     const rScale = d3
//       .scaleSqrt()
//       .domain([minLines, maxLines])
//       .range([2, 30]);

//     dots.selectAll('circle').remove(); 
    
//     dots
//       .selectAll('circle')
//       .data(filteredCommits)
//       .join('circle')
//       .attr('cx', (d) => xScale(d.datetime))
//       .attr('cy', (d) => yScale(d.hourFrac))
//       .attr('fill', 'purple')
//       .attr('r', (d) => rScale(d.totalLines))
//       .style('fill-opacity', 0.7);

//       dots
//       .selectAll('circle')
//       .on('mouseenter', (event, commit) => {
//         d3.select(event.currentTarget)
//           .style('fill-opacity', 1)
//           .attr('stroke', isCommitSelected(commit) ? 'gold' : 'black') // Highlight selection
//           .attr('stroke-width', 2);
//         updateTooltipContent(commit);
//         updateTooltipVisibility(true);
//         updateTooltipPosition(event);
//       })
//       .on('mouseleave', (event, commit) => {
//         d3.select(event.currentTarget)
//         .style('fill-opacity', 0.7)
//         .attr('stroke', isCommitSelected(commit) ? 'gold' : 'none'); // Maintain selected outline
//         updateTooltipContent({});
//         updateTooltipVisibility(false);
//       });

//     const margin = { top: 10, right: 10, bottom: 30, left: 20 };
//     const usableArea = {
//       top: margin.top,
//       right: width - margin.right,
//       bottom: height - margin.bottom,
//       left: margin.left,
//       width: width - margin.left - margin.right,
//       height: height - margin.top - margin.bottom,
//     };
    
//     // Update scales with new ranges
//     xScale.range([usableArea.left, usableArea.right]);
//     yScale.range([usableArea.bottom, usableArea.top]);

//     // Create the axes
//     const xAxis = d3.axisBottom(xScale);
//     const yAxis = d3
//     .axisLeft(yScale)
//     .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

//     // Add gridlines BEFORE the axes
//     const gridlines = svg
//     .append('g')
//     .attr('class', 'gridlines')
//     .attr('transform', `translate(${usableArea.left}, 0)`)
//     .style('stroke-opacity', 0.3);

//     // Create gridlines as an axis with no labels and full-width ticks
//     gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

//     // Add X axis
//     svg
//       .append('g')
//       .attr('transform', `translate(0, ${usableArea.bottom})`)
//       .call(xAxis);

//     // Add Y axis
//     svg
//       .append('g')
//       .attr('transform', `translate(${usableArea.left}, 0)`)
//       .call(yAxis);

//     brushSelector();
// }

// function updateTimeDisplay() {
//   commitProgress = Number(timeSlider.value);
//   // what ever you have previously
//   filterCommitsByTime(); // filters by time and assign to some top-level variable.
//   updateScatterplot(filteredCommits);
// }