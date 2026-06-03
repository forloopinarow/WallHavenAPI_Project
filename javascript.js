async function bilderHolen(suchbegriff = "") {
  const bilder = document.querySelectorAll(".wallpaper");
  if (!bilder.length) return;

  // Placeholder sofort setzen damit nichts leer bleibt
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
      // Alle alten Event Listener entfernen (verhindert doppelte clicks)
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
        window.location.href = `extraInfo.html?id=${wall.id}`;
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

bilderHolen("nature");
ladeExtraInfo();