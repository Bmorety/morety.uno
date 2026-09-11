const search = document.getElementById("briefSearch");
const rows = [...document.querySelectorAll(".brief-row")];
const count = document.getElementById("resultCount");
const empty = document.getElementById("emptyState");

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

search.addEventListener("input", () => {
  const query = normalize(search.value);
  let visible = 0;
  rows.forEach(row => {
    const matches = !query || normalize(row.dataset.search).includes(query);
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  count.textContent = String(visible).padStart(2, "0");
  empty.hidden = visible !== 0;
});
