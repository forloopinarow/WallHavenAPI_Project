async function bilderHolen(suchbegriff = "") {
  const bilder = document.querySelectorAll(".wallpaper");
  if (!bilder.length) return;

  bilder.forEach(img => {
    img.src = "https://placehold.co/800x450?text=Loading...";
  });

  try {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const response = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(
        `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(suchbegriff)}&sorting=random&page=${randomPage}&ratios=16x9&atleast=1920x1080&purity=100`
      )}`
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const wallpapers = data?.data;

    if (!wallpapers || wallpapers.length === 0) {
      bilder.forEach(img => {
        img.src = "https://placehold.co/800x450?text=No+Results";
      });
      return;
    }

    bilder.forEach((img, index) => {
      const newImg = img.cloneNode(true);
      img.parentNode.replaceChild(newImg, img);

      if (index >= wallpapers.length) {
        newImg.src = "https://placehold.co/800x450?text=Wallpaper+Unavailable";
        return;
      }

      const wall = wallpapers[index];
      newImg.src = wall.thumbs.large;
      newImg.onerror = () => {
        newImg.src = "https://placehold.co/800x450?text=Wallpaper+Unavailable";
      };
      newImg.addEventListener("click", () => {
        window.open(`https://wallhaven.cc/w/${wall.id}`, "_blank");
      });
    });

  } catch (err) {
    console.error("Fehler beim Laden:", err);
    bilder.forEach(img => {
      img.src = "https://placehold.co/800x450?text=Error+Loading";
    });
  }
}

function sucheStarten() {
  const suche = document.getElementById("searchID")?.value;
  schliesseAutocomplete();
  bilderHolen(suche || "");
}

async function ladeExtraInfo() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  const response = await fetch(
    `https://corsproxy.io/?https://wallhaven.cc/api/v1/w/${id}`
  );
  const data = await response.json();
  const wall = data.data;

  document.getElementById("title").innerText = wall.id;
  document.getElementById("bigWallpaper").src = wall.path;
  document.getElementById("resolution").innerText = `Resolution: ${wall.resolution}`;
  document.getElementById("views").innerText = `Views: ${wall.views}`;

  const button = document.getElementById("downloadBtn");

  button.onclick = () => {
    const a = document.createElement("a");
    a.href = wall.path;
    a.download = `wallpaper-${wall.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
}

// --- Autocomplete ---
const WALLHAVEN_TAGS = [
  "nature","forest","mountains","ocean","beach","sunset","sunrise","sky","clouds","snow",
  "rain","waterfall","lake","river","desert","jungle","flowers","garden","autumn","spring",
  "space","galaxy","nebula","stars","moon","planet","earth","universe","cosmos","milky way",
  "anime","manga","fantasy","sci-fi","cyberpunk","steampunk","dark fantasy","magic","dragon",
  "samurai","ninja","mecha","vocaloid","hatsune miku","demon","angel","sword","knight",
  "city","cityscape","urban","night city","tokyo","new york","paris","london","neon",
  "skyscraper","architecture","street","alley","bridge","building",
  "abstract","minimal","geometric","colorful","dark","black","white","blue","red","green",
  "purple","orange","gradient","pattern","texture",
  "car","vehicle","motorcycle","supercar","ferrari","lamborghini","porsche","mustang",
  "bmw","mercedes","spaceship","airplane","train","boat",
  "cat","dog","wolf","fox","lion","tiger","bear","eagle","bird","horse","deer","rabbit",
  "owl","shark","whale","dolphin","elephant","panda","penguin",
  "girl","woman","portrait","warrior","assassin","witch","elf","cyberpunk girl",
  "landscape","panorama","photography","macro","long exposure","golden hour","fog","mist",
  "storm","lightning","volcano","glacier","cave","cliff",
  "dark souls","zelda","witcher","destiny","halo","overwatch","cyberpunk 2077",
  "final fantasy","elden ring","minecraft","pokemon",
  "music","headphones","guitar","piano","neon lights","retrowave","synthwave","vaporwave","lofi",
  "fire","water","ice","smoke","light","fractal","3d render","digital art","painting",
  "illustration","concept art","pixel art","artwork"
];

let autocompleteTimeout = null;

function holeTags(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return WALLHAVEN_TAGS.filter(tag => tag.includes(q)).slice(0, 8);
}

function zeigeAutocomplete(tags, input) {
  schliesseAutocomplete();
  if (!tags.length) return;

  const list = document.createElement("ul");
  list.id = "autocomplete-list";
  list.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    list-style: none;
    margin: 0;
    padding: 4px 0;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: ${input.offsetWidth}px;
    max-height: 260px;
    overflow-y: auto;
  `;

  const rect = input.getBoundingClientRect();
  list.style.top = (rect.bottom + window.scrollY + 4) + "px";
  list.style.left = (rect.left + window.scrollX) + "px";

  tags.forEach(tag => {
    const li = document.createElement("li");
    li.textContent = tag;
    li.style.cssText = `
      padding: 8px 14px;
      cursor: pointer;
      font-size: 0.95rem;
      color: #333;
      background: white;
    `;
    li.addEventListener("mouseenter", () => li.style.background = "#f0f0f0");
    li.addEventListener("mouseleave", () => { if (!li.classList.contains("active")) li.style.background = "white"; });
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      input.value = tag;
      schliesseAutocomplete();
      bilderHolen(tag);
    });
    list.appendChild(li);
  });

  document.body.appendChild(list);
}

function schliesseAutocomplete() {
  const existing = document.getElementById("autocomplete-list");
  if (existing) existing.remove();
}

function initAutocomplete() {
  document.querySelectorAll("#searchID").forEach(input => {
    input.setAttribute("autocomplete", "off");

    input.addEventListener("input", () => {
      clearTimeout(autocompleteTimeout);
      const val = input.value.trim();
      if (val.length < 2) { schliesseAutocomplete(); return; }
      autocompleteTimeout = setTimeout(() => {
        const tags = holeTags(val);
        zeigeAutocomplete(tags, input);
      }, 150);
    });

    input.addEventListener("keydown", (e) => {
      const list = document.getElementById("autocomplete-list");
      if (!list) return;
      const items = list.querySelectorAll("li");
      const activeItem = list.querySelector("li.active");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = activeItem ? activeItem.nextElementSibling : items[0];
        if (activeItem) { activeItem.classList.remove("active"); activeItem.style.background = "white"; }
        if (next) { next.classList.add("active"); next.style.background = "#e8e8e8"; input.value = next.textContent; }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = activeItem ? activeItem.previousElementSibling : items[items.length - 1];
        if (activeItem) { activeItem.classList.remove("active"); activeItem.style.background = "white"; }
        if (prev) { prev.classList.add("active"); prev.style.background = "#e8e8e8"; input.value = prev.textContent; }
      } else if (e.key === "Enter") {
        schliesseAutocomplete();
      } else if (e.key === "Escape") {
        schliesseAutocomplete();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(schliesseAutocomplete, 150);
    });
  });
}

document.addEventListener("DOMContentLoaded", initAutocomplete);
if (document.readyState !== "loading") initAutocomplete();

bilderHolen("nature");
ladeExtraInfo();