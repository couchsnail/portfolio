let data = [];

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
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
        enumeralbe: true,
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

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue');

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
    
    
}